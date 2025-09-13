import { isValid, differenceInHours, parseISO } from 'date-fns';
import TrackingPacket from '../../models/trackingPacketModel.js';

export const vehicleActivity = async (req, res) => {
  try {
    const { vehicleNumber, startDate, endDate, includeAnalytics = true } = req.query;

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

    // Query tracking data by vehicle number - Updated with all fields
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
      raw_data formatted_datetime altitude_m pdop hdop
      tamper_alert mcc mnc lac cell_id
      neighbor_cell_1_signal neighbor_cell_2_signal neighbor_cell_3_signal neighbor_cell_4_signal
      digital_inputs digital_outputs analog_input_1 analog_input_2
      delta_distance frame_number protocol packet_type
      header vendor_id firmware_version message_type message_id message_description
      date time location
    `)
    .sort({ timestamp: 1 })
    .limit(5000); // Safety limit

    if (trackingData.length === 0) {
      return res.status(404).json({
        error: 'No data found',
        message: `No tracking data found for vehicle ${vehicleNumber} in the specified date range`
      });
    }

    // Calculate comprehensive analytics if requested
    let analytics = {};
    if (includeAnalytics === 'true') {
      analytics = calculateComprehensiveAnalytics(trackingData);
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
 * Calculate comprehensive trip analytics from tracking data
 * Including alerts and status monitoring as per iTriangle specifications
 */
function calculateComprehensiveAnalytics(data) {
  if (data.length === 0) return {};

  const speeds = data.map(d => d.speed_kmh || 0);
  const distances = [];
  let totalDistance = 0;
  let runTime = 0;
  let idleTime = 0;
  let maxSpeed = Math.max(...speeds);
  let avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

  // Alert counters based on iTriangle Message & Alerts
  let alertCounts = {
    locationUpdates: 0,
    disconnectedAlerts: 0,
    lowBatteryAlerts: 0,
    connectionAlerts: 0,
    ignitionOnEvents: 0,
    ignitionOffEvents: 0,
    gpsBoxOpenedEvents: 0,
    emergencyAlerts: 0,
    overTheAirAlerts: 0,
    harshBrakingEvents: 0,
    harshAccelerationEvents: 0,
    harshTurningEvents: 0,
    emergencyButtonEvents: 0
  };

  // Power and connectivity metrics
  let powerMetrics = {
    mainPowerOnDuration: 0,
    mainPowerOffDuration: 0,
    avgBatteryVoltage: 0,
    avgMainVoltage: 0,
    avgGsmSignal: 0,
    avgSatellites: 0
  };

  // GPS and location metrics
  let locationMetrics = {
    validGpsFixes: 0,
    invalidGpsFixes: 0,
    avgAltitude: 0,
    avgPdop: 0,
    avgHdop: 0
  };

  // Calculate distance between consecutive points and analyze data
  for (let i = 0; i < data.length; i++) {
    const curr = data[i];
    
    // Distance calculation
    if (i > 0) {
      const prev = data[i - 1];
      if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
        const dist = calculateDistance(
          prev.latitude, prev.longitude,
          curr.latitude, curr.longitude
        );
        distances.push(dist);
        totalDistance += dist;
      }

      // Time-based calculations (assuming regular intervals)
      const timeDiff = 10; // minutes between packets
      if (curr.speed_kmh > 5) {
        runTime += timeDiff;
      } else {
        idleTime += timeDiff;
      }
    }

    // Alert analysis based on iTriangle specifications
    if (curr.emergency_status) alertCounts.emergencyAlerts++;
    if (curr.ignition && (!data[i-1] || !data[i-1].ignition)) alertCounts.ignitionOnEvents++;
    if (!curr.ignition && data[i-1] && data[i-1].ignition) alertCounts.ignitionOffEvents++;
    if (curr.battery_voltage && curr.battery_voltage < 3.7) alertCounts.lowBatteryAlerts++;
    if (!curr.main_power) alertCounts.disconnectedAlerts++;
    if (curr.tamper_alert) alertCounts.gpsBoxOpenedEvents++;

    // Harsh behavior detection
    if (i > 0) {
      const speedDiff = Math.abs(curr.speed_kmh - data[i-1].speed_kmh);
      const timeDiffSeconds = (new Date(curr.timestamp) - new Date(data[i-1].timestamp)) / 1000;
      if (timeDiffSeconds > 0) {
        const acceleration = speedDiff / (timeDiffSeconds / 3600); // km/h per hour
        if (acceleration > 10) alertCounts.harshAccelerationEvents++;
        if (acceleration < -10) alertCounts.harshBrakingEvents++;
      }

      // Harsh turning detection based on heading change
      if (curr.heading && data[i-1].heading) {
        const headingDiff = Math.abs(curr.heading - data[i-1].heading);
        if (headingDiff > 30 && curr.speed_kmh > 20) alertCounts.harshTurningEvents++;
      }
    }

    // Power metrics
    if (curr.main_power) powerMetrics.mainPowerOnDuration++;
    else powerMetrics.mainPowerOffDuration++;
    
    if (curr.battery_voltage) powerMetrics.avgBatteryVoltage += curr.battery_voltage;
    if (curr.main_voltage) powerMetrics.avgMainVoltage += curr.main_voltage;
    if (curr.gsm_signal) powerMetrics.avgGsmSignal += curr.gsm_signal;
    if (curr.satellites) powerMetrics.avgSatellites += curr.satellites;

    // GPS metrics
    if (curr.fix_status) locationMetrics.validGpsFixes++;
    else locationMetrics.invalidGpsFixes++;
    
    if (curr.altitude_m) locationMetrics.avgAltitude += curr.altitude_m;
    if (curr.pdop) locationMetrics.avgPdop += curr.pdop;
    if (curr.hdop) locationMetrics.avgHdop += curr.hdop;

    alertCounts.locationUpdates++;
  }

  // Calculate averages
  const dataLength = data.length;
  powerMetrics.avgBatteryVoltage = Math.round((powerMetrics.avgBatteryVoltage / dataLength) * 100) / 100;
  powerMetrics.avgMainVoltage = Math.round((powerMetrics.avgMainVoltage / dataLength) * 100) / 100;
  powerMetrics.avgGsmSignal = Math.round((powerMetrics.avgGsmSignal / dataLength) * 100) / 100;
  powerMetrics.avgSatellites = Math.round((powerMetrics.avgSatellites / dataLength) * 100) / 100;
  locationMetrics.avgAltitude = Math.round((locationMetrics.avgAltitude / dataLength) * 100) / 100;
  locationMetrics.avgPdop = Math.round((locationMetrics.avgPdop / dataLength) * 100) / 100;
  locationMetrics.avgHdop = Math.round((locationMetrics.avgHdop / dataLength) * 100) / 100;

  return {
    // Basic trip analytics
    maxSpeed: Math.round(maxSpeed * 100) / 100,
    averageSpeed: Math.round(avgSpeed * 100) / 100,
    totalDistance: Math.round(totalDistance * 100) / 100,
    runTimeMinutes: runTime,
    idleTimeMinutes: idleTime,
    runTimeHours: Math.round((runTime / 60) * 100) / 100,
    idleTimeHours: Math.round((idleTime / 60) * 100) / 100,
    
    // Alert analytics based on iTriangle specifications
    alerts: alertCounts,
    
    // Power and connectivity metrics
    powerStatus: powerMetrics,
    
    // GPS and location quality
    locationQuality: locationMetrics,
    
    // Device performance
    devicePerformance: {
      totalPackets: dataLength,
      dataCompleteness: Math.round((locationMetrics.validGpsFixes / dataLength) * 100),
      signalQuality: powerMetrics.avgGsmSignal > 15 ? 'Good' : 'Poor',
      gpsAccuracy: locationMetrics.avgHdop < 2 ? 'High' : locationMetrics.avgHdop < 5 ? 'Medium' : 'Low'
    }
  };
}

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
