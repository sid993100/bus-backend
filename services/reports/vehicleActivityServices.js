
import { isValid, differenceInHours, parseISO } from 'date-fns';
import TrackingPacket from '../../models/trackingPacketModel.js';

export const vehicleActivity= async (req, res) => {
  try {
    const { vehicleNumber, startDate, endDate, includeAnalytics = false } = req.query;

    // Validation
    if (!vehicleNumber) {
      return res.status(400).json({
        error: 'Vehicle number is required',
        message: 'Please provide a valid vehicle registration number (e.g., UP77AN2161)'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Date range required',
        message: 'Both startDate and endDate are required in ISO format'
      });
    }

    // Parse and validate dates
    let start, end;
    try {
      start = parseISO(startDate);
      end = parseISO(endDate);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Dates must be in ISO format (e.g., 2024-04-17T00:00:00Z)'
      });
    }

    if (!isValid(start) || !isValid(end)) {
      return res.status(400).json({
        error: 'Invalid dates',
        message: 'Please provide valid dates'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'Start date must be before end date'
      });
    }

    // Query tracking data by vehicle number
    const trackingData = await TrackingPacket.find({
      vehicle_reg_no: vehicleNumber,
      timestamp: {
        $gte: start,
        $lte: end
      }
    })
    .select(`
      vehicle_reg_no imei timestamp latitude longitude speed_kmh heading
      ignition main_power emergency_status satellites fix_status
      gsm_signal battery_voltage main_voltage operator_name
      raw_data formatted_datetime
    `)
    .sort({ timestamp: 1 })
    .limit(5000); // Safety limit

    if (trackingData.length === 0) {
      return res.status(404).json({
        error: 'No data found',
        message: `No tracking data found for vehicle ${vehicleNumber} in the specified date range`
      });
    }

    // Calculate analytics if requested
    let analytics = {};
    if (includeAnalytics === 'true') {
      analytics = calculateTripAnalytics(trackingData);
    }

    // Response
    res.status(200).json({
      success: true,
      vehicleNumber: vehicleNumber.toUpperCase(),
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        durationHours: differenceInHours(end, start)
      },
      totalRecords: trackingData.length,
      ...(includeAnalytics === 'true' && { analytics }),
      data: trackingData
    });

  } catch (error) {
    console.error('Error fetching vehicle tracking data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve tracking data'
    });
  }
};

/**
 * Calculate trip analytics from tracking data
 */
function calculateTripAnalytics(data) {
  if (data.length === 0) return {};

  const speeds = data.map(d => d.speed_kmh || 0);
  const distances = [];
  let totalDistance = 0;
  let runTime = 0;
  let idleTime = 0;
  let maxSpeed = Math.max(...speeds);
  let avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

  // Calculate distance between consecutive points
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    
    if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
      const dist = calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
      distances.push(dist);
      totalDistance += dist;
    }

    // Calculate run vs idle time (assuming 10-minute intervals)
    const timeDiff = 10; // minutes between packets
    if (curr.speed_kmh > 5) {
      runTime += timeDiff;
    } else {
      idleTime += timeDiff;
    }
  }

  return {
    maxSpeed: Math.round(maxSpeed * 100) / 100,
    averageSpeed: Math.round(avgSpeed * 100) / 100,
    totalDistance: Math.round(totalDistance * 100) / 100,
    runTimeMinutes: runTime,
    idleTimeMinutes: idleTime,
    runTimeHours: Math.round((runTime / 60) * 100) / 100,
    idleTimeHours: Math.round((idleTime / 60) * 100) / 100
  };
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


