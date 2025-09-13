import axios from 'axios';
import TrackingPacket from '../../models/trackingPacketModel.js';

export const journeyHistory = async (req, res) => {
  try {
    const { vehicleNumber } = req.params;
    const { 
      period = 'last1hour', 
      startDate, 
      endDate, 
      includeLocation = 'false',
      limit = 500 
    } = req.query;

    // Validate vehicle number
    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle number is required',
        message: 'Please provide a valid vehicle number (e.g., UP77AN2799)'
      });
    }

    // Calculate date range based on period
    let dateRange = calculateDateRange(period, startDate, endDate);
    
    if (!dateRange.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: dateRange.message
      });
    }

    // Validate limit
    const queryLimit = Math.min(parseInt(limit) || 500, 1000);

    // Query tracking data
    const trackingData = await TrackingPacket.find({
      vehicle_reg_no: vehicleNumber,
      timestamp: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      }
    })
    .select(`
      vehicle_reg_no timestamp latitude longitude speed_kmh 
      ignition main_power imei formatted_datetime
      satellites fix_status gsm_signal heading
    `)
    .sort({ timestamp: 1 })
    .limit(queryLimit);

    if (trackingData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found',
        message: `No tracking data found for vehicle ${vehicleNumber} in the specified period`
      });
    }

    // Format response data similar to Journey History table
    let formattedData = trackingData.map((record, index) => ({
      serialNumber: index + 1,
      vehicleNumber: record.vehicle_reg_no,
      dateTime: formatDateTime(record.timestamp),
      latitude: record.latitude || 0,
      longitude: record.longitude || 0,
      location: null, // Will be populated if includeLocation is true
      ignition: record.ignition ? 'ON' : 'OFF',
      speedKmh: record.speed_kmh || 0,
      mainPower: record.main_power ? 'Connected' : 'Disconnected',
      imei: record.imei,
      satellites: record.satellites || 0,
      gsmSignal: record.gsm_signal || 0,
      heading: record.heading || 0
    }));

    // Add location information if requested
    if (includeLocation === 'true') {
      formattedData = await addLocationData(formattedData);
    }

    // Response
    res.status(200).json({
      success: true,
      vehicleNumber: vehicleNumber.toUpperCase(),
      period: period,
      dateRange: {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        duration: `${Math.round((dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60))} hours`
      },
      totalRecords: formattedData.length,
      filters: {
        vehicleNumber: vehicleNumber.toUpperCase(),
        startDateTime: dateRange.startDate.toISOString(),
        endDateTime: dateRange.endDate.toISOString()
      },
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching journey history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve journey history'
    });
  }
};

/**
 * Calculate date range based on period - FIXED VERSION
 */
function calculateDateRange(period, startDate, endDate) {
  const now = new Date();
  let start, end = new Date(now);

  switch (period) {
    case 'last1hour':
      start = new Date(now.getTime() - (1 * 60 * 60 * 1000));
      break;
    
    case 'last2hours':
      start = new Date(now.getTime() - (2 * 60 * 60 * 1000));
      break;
    
    case 'last6hours':
      start = new Date(now.getTime() - (6 * 60 * 60 * 1000));
      break;
    
    case 'last12hours':
      start = new Date(now.getTime() - (12 * 60 * 60 * 1000));
      break;
    
    case 'custom':
      if (!startDate || !endDate) {
        return {
          success: false,
          message: 'Start date and end date are required for custom period'
        };
      }
      
      start = new Date(startDate);
      end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {
          success: false,
          message: 'Invalid date format. Use ISO format (e.g., 2024-03-03T14:04:20Z)'
        };
      }

      // **FIX: Check if dates are in the future**
      if (start > now) {
        return {
          success: false,
          message: 'Start date cannot be in the future'
        };
      }

      if (end > now) {
        return {
          success: false,
          message: 'End date cannot be in the future'
        };
      }
      
      // Validate 24-hour limit for custom range
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

      // **FIX: Additional validation for reasonable date ranges**
      const maxPastDays = 90; // Allow maximum 90 days in the past
      const maxPastTime = new Date(now.getTime() - (maxPastDays * 24 * 60 * 60 * 1000));
      
      if (start < maxPastTime) {
        return {
          success: false,
          message: `Start date cannot be more than ${maxPastDays} days in the past`
        };
      }

      break;
    
    default:
      return {
        success: false,
        message: 'Invalid period. Use: last1hour, last2hours, last6hours, last12hours, or custom'
      };
  }

  // **FIX: Final validation to ensure dates are not in future for predefined periods**
  if (start > now) {
    start = new Date(now.getTime() - (1 * 60 * 60 * 1000)); // Default to 1 hour ago
  }
  
  if (end > now) {
    end = now;
  }

  return {
    success: true,
    startDate: start,
    endDate: end
  };
}

/**
 * Format datetime similar to Journey History format (03-03-2024 14:04:20)
 */
function formatDateTime(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Add location data using reverse geocoding - Improved version
 */
async function addLocationData(data) {
  // Limit geocoding to first 20 records to avoid rate limiting
  const maxGeocode = Math.min(data.length, 20);
  
  for (let i = 0; i < maxGeocode; i++) {
    const record = data[i];
    
    if (record.latitude && record.longitude && record.latitude !== 0 && record.longitude !== 0) {
      try {
        const location = await reverseGeocode(record.latitude, record.longitude);
        record.location = location || `${record.latitude}, ${record.longitude}`;
        
        // Rate limiting - wait between requests
        if (i < maxGeocode - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`Geocoding failed for ${record.latitude}, ${record.longitude}:`, error.message);
        record.location = `${record.latitude}, ${record.longitude}`;
      }
    } else {
      record.location = 'Invalid Coordinates';
    }
  }
  
  // For remaining records without geocoding, just show coordinates
  for (let i = maxGeocode; i < data.length; i++) {
    const record = data[i];
    if (record.latitude && record.longitude && record.latitude !== 0 && record.longitude !== 0) {
      record.location = `${record.latitude}, ${record.longitude}`;
    } else {
      record.location = 'Invalid Coordinates';
    }
  }
  
  return data;
}

/**
 * Reverse geocode coordinates to address - Improved version
 */
async function reverseGeocode(lat, lon) {
  try {
    const url = `http://nominatim.locationtrack.in/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const response = await axios.get(url, { 
      timeout: 5000,
      headers: {
        'User-Agent': 'VehicleTrackingApp/1.0'
      }
    });
    
    if (response.data?.display_name) {
      return response.data.display_name;
    }
    
    if (response.data?.address) {
      const addr = response.data.address;
      const parts = [
        addr.house_number,
        addr.road,
        addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.village,
        addr.state,
        addr.country
      ].filter(Boolean);
      
      return parts.join(', ');
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}
