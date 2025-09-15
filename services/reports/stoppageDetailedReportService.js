import Vehicle from '../../models/vehicleModel.js';
import TrackingPacket from '../../models/trackingPacketModel.js';
import { parseISO, differenceInMilliseconds, isValid } from 'date-fns';
import axios from 'axios';

const IDLE_SPEED_THRESHOLD = 0;

const formatDuration = (ms) => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const formatDateTimeForReport = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
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

export const stoppageDetailedReport = async (req, res) => {
  try {
    const { startDate, endDate, regionId, depotId, vehicleNumber, idleDuration = 5 } = req.query;

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
        message: 'Invalid date format or range.',
      });
    }
    
    const minIdleDurationMs = parseInt(idleDuration) * 60 * 1000;

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
      return res.status(404).json({ success: false, message: 'No vehicles found for the specified filter.' });
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

    const detailedReportList = [];

    for (const vehicle of vehicles) {
      const packets = dataByVehicle[vehicle.vehicleNumber] || [];
      if (packets.length === 0) continue;

      let isIdling = false;
      let idleStartTime = null;
      let idleStartLocation = null;

      for (let i = 0; i < packets.length; i++) {
        const currentPacket = packets[i];
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

          if (duration >= minIdleDurationMs) {
            detailedReportList.push({
              zoneRegion: vehicle.regionZone?.name || 'N/A',
              depotCustomer: vehicle.depotCustomer?.depotCustomer || 'N/A',
              vehicleNumber: vehicle.vehicleNumber,
              imeiNumber: vehicle.vltdDevice?.imei || 'N/A',
              serviceType: vehicle.serviceType?.name || 'N/A',
              ownerType: vehicle.ownerType,
              idlingStartTime: formatDateTimeForReport(idleStartTime),
              idlingEndTime: formatDateTimeForReport(idleEndTime),
              totalIdleDuration: formatDuration(duration),
              idlingLocation: await reverseGeocode(idleStartLocation.latitude, idleStartLocation.longitude)
            });
          }
        }
      }
      
      if (isIdling) {
        const lastPacketTime = packets[packets.length - 1].timestamp;
        const duration = differenceInMilliseconds(lastPacketTime, idleStartTime);
         if (duration >= minIdleDurationMs) {
            detailedReportList.push({
              zoneRegion: vehicle.regionZone?.name || 'N/A',
              depotCustomer: vehicle.depotCustomer?.depotCustomer || 'N/A',
              vehicleNumber: vehicle.vehicleNumber,
              imeiNumber: vehicle.vltdDevice?.imei || 'N/A',
              serviceType: vehicle.serviceType?.name || 'N/A',
              ownerType: vehicle.ownerType,
              idlingStartTime: formatDateTimeForReport(idleStartTime),
              idlingEndTime: formatDateTimeForReport(lastPacketTime),
              totalIdleDuration: formatDuration(duration),
              idlingLocation: await reverseGeocode(idleStartLocation.latitude, idleStartLocation.longitude)
            });
          }
      }
    }
    
    if (detailedReportList.length === 0) {
        return res.status(404).json({
            success: false,
            message: `No stoppage activity found for more than ${idleDuration} minutes.`
        });
    }

    res.status(200).json({
      success: true,
      message: 'Stoppage detailed report generated successfully.',
      filters: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          minDurationMinutes: idleDuration,
          ...(regionId && { regionId }),
          ...(depotId && { depotId }),
          ...(vehicleNumber && { vehicleNumber }),
      },
      totalRecords: detailedReportList.length,
      data: detailedReportList
    });

  } catch (error) {
    console.error('Error generating stoppage detailed report:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred.',
      error: error.message,
    });
  }
};