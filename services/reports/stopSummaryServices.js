import Vehicle from '../../models/vehicleModel.js';
import TrackingPacket from '../../models/trackingPacketModel.js';
import { parseISO, differenceInMilliseconds, isValid } from 'date-fns';
import axios from 'axios';

const STOP_SPEED_THRESHOLD = 0; 
const MIN_STOP_DURATION_MS = 5 * 60 * 1000; // 5 minutes minimum stop duration

const formatDuration = (ms) => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const reverseGeocode = async (lat, lon) => {
  if (!lat || !lon || lat === 0 || lon === 0) {
    return 'Invalid Coordinates';
  }
  try {
    const url = `http://nominatim.locationtrack.in/reverse?format=geocodejson&lat=${lat}&lon=${lon}`;
    const response = await axios.get(url);
    return response.data?.features?.[0]?.properties?.display_name || `${lat}, ${lon}`;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return `${lat}, ${lon}`;
  }
};

export const stopSummary = async (req, res) => {
  try {
    const { startDate, endDate, regionId, depotId, vehicleNumber } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required query parameters.',
      });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Validate date format first
    if (!isValid(start) || !isValid(end)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO format (e.g., 2025-09-16T10:00:00Z)',
      });
    }

    // Get current time for validation
    const now = new Date();

    // Check if dates are in the future
    if (start > now) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the future',
      });
    }

    if (end > now) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be in the future',
      });
    }

    // Check date range validity
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date',
      });
    }

    // Optional - limit maximum date range (e.g., 30 days)
    const maxRangeDays = 30;
    const maxRangeMs = maxRangeDays * 24 * 60 * 60 * 1000;
    const dateRangeMs = differenceInMilliseconds(end, start);
    
    if (dateRangeMs > maxRangeMs) {
      return res.status(400).json({
        success: false,
        message: `Date range cannot exceed ${maxRangeDays} days`,
      });
    }

    // Optional - limit how far back in time we can query (e.g., 90 days)
    const maxPastDays = 90;
    const maxPastTime = new Date(now.getTime() - (maxPastDays * 24 * 60 * 60 * 1000));
    
    if (start < maxPastTime) {
      return res.status(400).json({
        success: false,
        message: `Start date cannot be more than ${maxPastDays} days in the past`,
      });
    }

    const vehicleFilter = {};
    if (regionId) vehicleFilter.regionZone = regionId;
    if (depotId) vehicleFilter.depotCustomer = depotId;
    if (vehicleNumber) vehicleFilter.vehicleNumber = vehicleNumber.toUpperCase();

    const vehicles = await Vehicle.find(vehicleFilter)
      .populate('regionZone', 'name')
      .populate('depotCustomer', 'depotCustomer')
      .populate('serviceType', 'name');

    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No vehicles found for the selected criteria.',
      });
    }

    const vehicleNumbers = vehicles.map(v => v.vehicleNumber);

    // Get IMEI from TrackingPacket and use stop condition (Ignition OFF + Speed 0)
    const trackingData = await TrackingPacket.find({
      vehicle_reg_no: { $in: vehicleNumbers },
      timestamp: { $gte: start, $lte: end },
    })
    .select('vehicle_reg_no timestamp ignition speed_kmh latitude longitude imei')
    .sort({ vehicle_reg_no: 1, timestamp: 1 });

    const dataByVehicle = trackingData.reduce((acc, packet) => {
      if (!acc[packet.vehicle_reg_no]) {
        acc[packet.vehicle_reg_no] = [];
      }
      acc[packet.vehicle_reg_no].push(packet);
      return acc;
    }, {});

    const reportData = [];
    let serialNo = 1;

    for (const vehicle of vehicles) {
      const packets = dataByVehicle[vehicle.vehicleNumber] || [];
      if (packets.length === 0) continue;

      // Get IMEI from the first available tracking packet
      const imeiNumber = packets.find(p => p.imei)?.imei || 'N/A';

      let isStopped = false;
      let stopStartTime = null;
      let stopStartLocation = null;
      const stopEvents = [];

      for (let i = 0; i < packets.length; i++) {
        const currentPacket = packets[i];
        
        // **STOP CONDITION: Ignition OFF and Speed = 0**
        const conditionMet = !currentPacket.ignition && currentPacket.speed_kmh === STOP_SPEED_THRESHOLD;

        if (!isStopped && conditionMet) {
          isStopped = true;
          stopStartTime = currentPacket.timestamp;
          stopStartLocation = {
            latitude: currentPacket.latitude,
            longitude: currentPacket.longitude,
          };
        } else if (isStopped && !conditionMet) {
          isStopped = false;
          const stopEndTime = packets[i-1].timestamp;
          const duration = differenceInMilliseconds(stopEndTime, stopStartTime);

          if (duration >= MIN_STOP_DURATION_MS) {
            stopEvents.push({
              startTime: stopStartTime,
              endTime: stopEndTime,
              durationMs: duration,
              location: stopStartLocation,
            });
          }
        }
      }
      
      // Handle case where vehicle is still stopped at the end of the period
      if (isStopped) {
        const lastPacketTime = packets[packets.length - 1].timestamp;
        const duration = differenceInMilliseconds(lastPacketTime, stopStartTime);
        if (duration >= MIN_STOP_DURATION_MS) {
          stopEvents.push({
            startTime: stopStartTime,
            endTime: lastPacketTime,
            durationMs: duration,
            location: stopStartLocation,
          });
        }
      }

      if (stopEvents.length > 0) {
        const totalStopDurationMs = stopEvents.reduce((sum, event) => sum + event.durationMs, 0);
        
        const detailedEvents = [];
        for (const event of stopEvents) {
          detailedEvents.push({
            vehicleNumber: vehicle.vehicleNumber,
            stopStartTime: event.startTime.toISOString(),
            stopEndTime: event.endTime.toISOString(),
            totalStopDuration: formatDuration(event.durationMs),
            stopLocation: await reverseGeocode(event.location.latitude, event.location.longitude)
          });
        }
        
        reportData.push({
          sNo: serialNo++,
          region: vehicle.regionZone?.name || 'N/A',
          depot: vehicle.depotCustomer?.depotCustomer || 'N/A',
          vehicleNumber: vehicle.vehicleNumber,
          imeiNumber: imeiNumber,
          serviceType: vehicle.serviceType?.name || 'N/A',
          ownerType: vehicle.ownerType,
          totalStopDuration: formatDuration(totalStopDurationMs),
          stopEventCount: stopEvents.length,
          details: detailedEvents
        });
      }
    }
    
    if (reportData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No stop activity found for the given criteria and time period.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stop summary report generated successfully.',
      filters: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        dateRangeDays: Math.ceil(dateRangeMs / (24 * 60 * 60 * 1000)),
        ...(regionId && { regionId }),
        ...(depotId && { depotId }),
        ...(vehicleNumber && { vehicleNumber }),
      },
      summary: {
        totalVehiclesAnalyzed: vehicles.length,
        totalVehiclesWithStops: reportData.length,
        totalStopEvents: reportData.reduce((sum, vehicle) => sum + vehicle.stopEventCount, 0),
        averageStopsPerVehicle: Math.round((reportData.reduce((sum, vehicle) => sum + vehicle.stopEventCount, 0) / reportData.length) * 100) / 100
      },
      data: reportData
    });

  } catch (error) {
    console.error('Error generating stop summary report:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};
