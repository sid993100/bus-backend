import TrackingPacket from '../../models/trackingPacketModel.js';
import Route from "../../models/routemodel.js";
import axios from 'axios';

export const journeyHistoryReplay = async (req, res) => {
  try {
    const { vehicleNumber } = req.params;
    const { 
      period = 'last1hour', 
      startDate, 
      endDate, 
      routeName,
      includeLocation = 'false',
      markers = 'all'
    } = req.query;

    // Validate vehicle number
    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle number is required',
        message: 'Please provide a valid vehicle number'
      });
    }

    // Calculate date range with validation
    let dateRange = calculateDateRange(period, startDate, endDate);
    
    if (!dateRange.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: dateRange.message
      });
    }

    // Build query for tracking data
    const trackingQuery = {
      vehicle_reg_no: vehicleNumber,
      timestamp: {
        $gte: String(dateRange.startDate),
        $lte: String(dateRange.endDate)
      }
    };

    // Get tracking data
    const trackingData = await TrackingPacket.find(trackingQuery)
      .select(`
        vehicle_reg_no imei timestamp latitude longitude speed_kmh 
        ignition main_power emergency_status satellites fix_status
        gsm_signal battery_voltage heading operator_name
      `)
      .sort({ formatted_datetime: 1 })
      .limit(2000);

    if (trackingData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found',
        message: `No tracking data found for vehicle ${vehicleNumber} in the specified period`
      });
    }

    // Get route information if routeName is provided
    let routeInfo = null;
    if (routeName) {
      routeInfo = await Route.findOne({ 
        routeName: new RegExp(routeName, 'i') 
      })
      .populate('source', 'stopName location')
      .populate('destination', 'stopName location')
      .populate('via', 'stopName location')
      .populate('stops.stop', 'stopName location')
      .select('routeCode routeName routeLength source destination via stops');
    }

    // Process tracking data with markers
    const replayData = await processReplayData(trackingData, markers);

    // Since timestamp is already IST, no conversion needed
    const replayDataIST = replayData.map(point => ({
      ...point,
      dateTimeIST: point.timestamp,
      reportedDateTime: formatDateTimeIST(point.timestamp)
    }));

    // Response
    res.status(200).json({
      success: true,
      vehicleNumber: vehicleNumber.toUpperCase(),
      period: period,
      dateRange: {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        startDateIST: dateRange.startDate.toISOString(),
        endDateIST: dateRange.endDate.toISOString(),
        duration: `${Math.round((dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60))} hours`
      },
      route: routeInfo ? {
        routeCode: routeInfo.routeCode,
        routeName: routeInfo.routeName,
        routeLength: `${routeInfo.routeLength} KM`,
        source: routeInfo.source?.stopName || 'Unknown',
        destination: routeInfo.destination?.stopName || 'Unknown',
        via: routeInfo.via?.stopName || null,
        totalStops: routeInfo.stops?.length || 0
      } : null,
      totalPoints: replayDataIST.length,
      markers: {
        available: ['vehicleNumber', 'vehicleType', 'vehicleModel', 'imeiNumber', 'location', 'reportedDateTime', 'speed', 'powerStatus', 'routeName'],
        requested: markers.split(',').map(m => m.trim())
      },
      replayData: replayDataIST
    });

  } catch (error) {
    console.error('Error generating journey history replay:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate journey history replay'
    });
  }
};


function calculateDateRange(period, startDate, endDate) {
  const now = new Date();

  // Convert "now" into IST by adding +5:30
  const nowIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));

  let start, end = new Date(nowIST);

  switch (period) {
    case 'last1hour':
      start = new Date(nowIST.getTime() - (1 * 60 * 60 * 1000));
      break;
    
    case 'last2hours':
      start = new Date(nowIST.getTime() - (2 * 60 * 60 * 1000));
      break;
    
    case 'last6hours':
      start = new Date(nowIST.getTime() - (6 * 60 * 60 * 1000));
      break;
    
    case 'last12hours':
      start = new Date(nowIST.getTime() - (12 * 60 * 60 * 1000));
      break;
    
    case 'custom':
      if (!startDate || !endDate) {
        return {
          success: false,
          message: 'Start date and end date are required for custom period'
        };
      }

      // Parse custom dates as IST directly
      start = new Date(new Date(startDate).getTime() + (5.5 * 60 * 60 * 1000));
      end = new Date(new Date(endDate).getTime() + (5.5 * 60 * 60 * 1000));

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {
          success: false,
          message: 'Invalid date format. Use ISO format (e.g., 2025-09-15T06:00:00Z)'
        };
      }

      if (start > nowIST) {
        return {
          success: false,
          message: 'Start date cannot be in the future'
        };
      }

      if (end > nowIST) {
        return {
          success: false,
          message: 'End date cannot be in the future'
        };
      }

      const hoursDiff = (end - start) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        return {
          success: false,
          message: 'Custom date range cannot exceed 24 hours'
        };
      }

      if (start >= end) {
        return {
          success: false,
          message: 'Start date must be before end date'
        };
      }
      break;
    
    default:
      return {
        success: false,
        message: 'Invalid period. Use: last1hour, last2hours, last6hours, last12hours, or custom'
      };
  }

  // Final validation to ensure dates are not in the future
  if (start > nowIST) {
    start = new Date(nowIST.getTime() - (1 * 60 * 60 * 1000));
  }

  if (end > nowIST) {
    end = nowIST;
  }

  return {
    success: true,
    startDate: start,
    endDate: end
  };
}


async function processReplayData(trackingData, markers, includeLocation=false) {
  const markerTypes = markers === 'all' ? 
    ['vehicleNumber', 'vehicleType', 'vehicleModel', 'imeiNumber', 'location', 'reportedDateTime', 'speed', 'powerStatus', 'routeName'] :
    markers.split(',').map(m => m.trim());

  const processedData = [];
  
  for (let i = 0; i < trackingData.length; i++) {
    const point = trackingData[i];
    
    let locationName = null;
    if (includeLocation && point.latitude && point.longitude) {
      try {
        locationName = await reverseGeocode(point.latitude, point.longitude);
        // Rate limiting
        if (i < trackingData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        locationName = `${point.latitude}, ${point.longitude}`;
      }
    }

    const replayPoint = {
      sequenceNumber: i + 1,
      timestamp: point.timestamp,
      latitude: point.latitude || 0,
      longitude: point.longitude || 0,
      markers: {}
    };

    // Add requested markers
    if (markerTypes.includes('vehicleNumber')) {
      replayPoint.markers.vehicleNumber = point.vehicle_reg_no;
    }
    
    if (markerTypes.includes('vehicleType')) {
      replayPoint.markers.vehicleType = 'BUS'; // Default
    }
    
    if (markerTypes.includes('vehicleModel')) {
      replayPoint.markers.vehicleModel = 'BS-VI'; // Default
    }
    
    if (markerTypes.includes('imeiNumber')) {
      replayPoint.markers.imeiNumber = point.imei;
    }
    
    if (markerTypes.includes('location')) {
      replayPoint.markers.location = locationName || `${point.latitude}, ${point.longitude}`;
    }
    
    if (markerTypes.includes('reportedDateTime')) {
      replayPoint.markers.reportedDateTime = formatDateTimeIST(point.timestamp);
    }
    
    if (markerTypes.includes('speed')) {
      replayPoint.markers.speed = `${point.speed_kmh || 0} KM/H`;
    }
    
    if (markerTypes.includes('powerStatus')) {
      replayPoint.markers.powerStatus = point.main_power ? 'Connected' : 'Disconnected';
    }
    
    if (markerTypes.includes('routeName')) {
      replayPoint.markers.routeName = point.operator_name || 'Unknown Route';
    }

    // Add additional tracking info
    replayPoint.trackingInfo = {
      ignition: point.ignition ? 'ON' : 'OFF',
      heading: point.heading || 0,
      satellites: point.satellites || 0,
      gsmSignal: point.gsm_signal || 0,
      batteryVoltage: point.battery_voltage || 0,
      emergencyStatus: point.emergency_status || false
    };

    processedData.push(replayPoint);
  }

  return processedData;
}


function formatDateTimeIST(dateObj) {
  const date = new Date(dateObj); 

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} IST`;
}

async function reverseGeocode(lat, lon) {
  try {
    const url = `http://nominatim.locationtrack.in/reverse?format=json&lat=${lat}&lon=${lon}`;
    const response = await axios.get(url, { 
      timeout: 5000,
      headers: { 'User-Agent': 'JourneyReplayApp/1.0' }
    });
    
    return response.data?.display_name || `${lat}, ${lon}`;
  } catch (error) {
    return `${lat}, ${lon}`;
  }
}
