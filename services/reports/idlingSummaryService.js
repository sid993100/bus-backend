import Vehicle from '../../models/vehicleModel.js';
import TrackingPacket from '../../models/trackingPacketModel.js';
import VLTDevice from '../../models/vltDeviceModel.js';
import { parseISO, differenceInMilliseconds, isValid } from 'date-fns';
import axios from 'axios';

const IDLE_SPEED_THRESHOLD = 0; 
const MIN_IDLE_DURATION_MS = 5 * 60 * 1000;

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

export const idlingSummary = async (req, res) => {
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

    if (!isValid(start) || !isValid(end) || start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format or range. Use ISO format and ensure startDate is before endDate.',
      });
    }

    const vehicleFilter = {};
    if (regionId) vehicleFilter.regionZone = regionId;
    if (depotId) vehicleFilter.depotCustomer = depotId;
    if (vehicleNumber) vehicleFilter.vehicleNumber = vehicleNumber.toUpperCase();

    const vehicles = await Vehicle.find(vehicleFilter)
      .populate('regionZone', 'name')
      .populate('depotCustomer', 'depotCustomer')
      .populate('serviceType', 'name')
      .populate('vltdDevice', 'imei');

    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No vehicles found for the selected criteria.',
      });
    }

    const vehicleNumbers = vehicles.map(v => v.vehicleNumber);

    const trackingData = await TrackingPacket.find({
      vehicle_reg_no: { $in: vehicleNumbers },
      timestamp: { $gte: start, $lte: end },
    })
    .select('vehicle_reg_no timestamp ignition speed_kmh latitude longitude')
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

      let isIdling = false;
      let idleStartTime = null;
      let idleStartLocation = null;
      const idleEvents = [];

      for (let i = 0; i < packets.length; i++) {
        const currentPacket = packets[i];
        
        // --- THIS IS THE ONLY LINE THAT CHANGED ---
        const conditionMet = !currentPacket.ignition && currentPacket.speed_kmh === IDLE_SPEED_THRESHOLD;

        if (!isIdling && conditionMet) {
          isIdling = true;
          idleStartTime = currentPacket.timestamp;
          idleStartLocation = {
            latitude: currentPacket.latitude,
            longitude: currentPacket.longitude,
          };
        } else if (isIdling && !conditionMet) {
          isIdling = false;
          const idleEndTime = packets[i-1].timestamp;
          const duration = differenceInMilliseconds(idleEndTime, idleStartTime);

          if (duration >= MIN_IDLE_DURATION_MS) {
            idleEvents.push({
              startTime: idleStartTime,
              endTime: idleEndTime,
              durationMs: duration,
              location: idleStartLocation,
            });
          }
        }
      }
      
      if (isIdling) {
        const lastPacketTime = packets[packets.length - 1].timestamp;
        const duration = differenceInMilliseconds(lastPacketTime, idleStartTime);
         if (duration >= MIN_IDLE_DURATION_MS) {
            idleEvents.push({
              startTime: idleStartTime,
              endTime: lastPacketTime,
              durationMs: duration,
              location: idleStartLocation,
            });
          }
      }

      if (idleEvents.length > 0) {
        const totalIdleDurationMs = idleEvents.reduce((sum, event) => sum + event.durationMs, 0);
        
        const detailedEvents = [];
        for (const event of idleEvents) {
            detailedEvents.push({
                vehicleNumber: vehicle.vehicleNumber,
                idlingStartTime: event.startTime.toISOString(),
                idlingEndTime: event.endTime.toISOString(),
                totalIdleDuration: formatDuration(event.durationMs),
                idlingLocation: await reverseGeocode(event.location.latitude, event.location.longitude)
            });
        }
        
        reportData.push({
          sNo: serialNo++,
          region: vehicle.regionZone?.name || 'N/A',
          depot: vehicle.depotCustomer?.depotCustomer || 'N/A',
          vehicleNumber: vehicle.vehicleNumber,
          imeiNumber: vehicle.vltdDevice?.imei || 'N/A',
          serviceType: vehicle.serviceType?.name || 'N/A',
          ownerType: vehicle.ownerType,
          totalIdleDuration: formatDuration(totalIdleDurationMs),
          details: detailedEvents
        });
      }
    }
    
    if (reportData.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No idling activity found for the given criteria and time period.'
        });
    }

    res.status(200).json({
      success: true,
      message: 'Idling summary report generated successfully.',
      filters: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          ...(regionId && { regionId }),
          ...(depotId && { depotId }),
          ...(vehicleNumber && { vehicleNumber }),
      },
      totalVehiclesWithIdling: reportData.length,
      data: reportData
    });

  } catch (error) {
    console.error('Error generating idling summary report:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred.',
      error: error.message,
    });
  }
};