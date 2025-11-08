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
      page = 1,
      limit = 10
    } = req.query;

    // Validate vehicle number
    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle number is required',
        message: 'Please provide a valid vehicle number (e.g., UP77AN2799)'
      });
    }

    // Calculate date range
    const dateRange = calculateDateRange(period, startDate, endDate);
    if (!dateRange.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: dateRange.message
      });
    }

    // Pagination setup
    const currentPage = parseInt(page) || 1;
    const pageLimit = Math.min(parseInt(limit) || 500, 1000);
    const skip = (currentPage - 1) * pageLimit;

    // Filter
    const filter = {
      vehicle_reg_no: vehicleNumber,
      latitude: { $ne: 0 },
      longitude: { $ne: 0 },
      timestamp: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      }
    };

    // Get total count
    const totalRecords = await TrackingPacket.countDocuments(filter);

    // Query tracking data with pagination
    const trackingData = await TrackingPacket.find(filter)
      .select(`
        vehicle_reg_no timestamp latitude longitude speed_kmh 
        ignition main_power imei formatted_datetime
        satellites fix_status gsm_signal heading
      `)
      .sort({ time: 1 })
      .skip(skip)
      .limit(pageLimit);

    if (trackingData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found',
        message: `No tracking data found for vehicle ${vehicleNumber} in the specified period`
      });
    }

    // Format response data
    let formattedData = trackingData.map((record, index) => ({
      serialNumber: skip + index + 1,
      vehicleNumber: record.vehicle_reg_no,
      dateTime: formatDateTime(record.timestamp),
      latitude: record.latitude || 0,
      longitude: record.longitude || 0,
      location: null, // will be added if includeLocation=true
      ignition: record.ignition ? 'ON' : 'OFF',
      speedKmh: record.speed_kmh || 0,
      mainPower: record.main_power ? 'Connected' : 'Disconnected',
      imei: record.imei,
      satellites: record.satellites || 0,
      gsmSignal: record.gsm_signal || 0,
      heading: record.heading || 0
    }));

    // Add location info if requested
    if (includeLocation === 'true') {
      formattedData = await addLocationData(formattedData);
    }

    // Response
    res.status(200).json({
      success: true,
      vehicleNumber: vehicleNumber.toUpperCase(),
      pagination: {
        currentPage,
        limit: pageLimit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageLimit),
        hasNextPage: currentPage * pageLimit < totalRecords,
        hasPrevPage: currentPage > 1
      },
      period,
      dateRange: {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        duration: `${Math.round((dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60))} hours`
      },
      count: formattedData.length,
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
        return { success: false, message: 'Start date and end date are required for custom period' };
      }
      
      start = new Date(startDate);
      end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { success: false, message: 'Invalid date format. Use ISO format (e.g., 2024-03-03T14:04:20Z)' };
      }

      if (start > now) return { success: false, message: 'Start date cannot be in the future' };
      if (end > now) return { success: false, message: 'End date cannot be in the future' };

      const hoursDiff = (end - start) / (1000 * 60 * 60);
      if (hoursDiff > 24) return { success: false, message: 'Custom date range cannot exceed 24 hours' };
      if (start >= end) return { success: false, message: 'Start date must be before end date' };

      const maxPastDays = 90;
      const maxPastTime = new Date(now.getTime() - (maxPastDays * 24 * 60 * 60 * 1000));
      if (start < maxPastTime) {
        return { success: false, message: `Start date cannot be more than ${maxPastDays} days in the past` };
      }
      break;
    
    default:
      return { success: false, message: 'Invalid period. Use: last1hour, last2hours, last6hours, last12hours, or custom' };
  }

  if (start > now) start = new Date(now.getTime() - (1 * 60 * 60 * 1000));
  if (end > now) end = now;

  // ✅ Convert UTC to IST
  const toIST = (date) => {
    const IST_OFFSET = 5.5 * 60; // minutes
    return new Date(date.getTime() + IST_OFFSET * 60 * 1000);
  };

  return {
    success: true,
    startDate: toIST(start),
    endDate: toIST(end)
  };
}


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


 async function addLocationData(data) {
  const maxGeocode = Math.min(data.length, 10); // limit how many records get geocoded
  const concurrencyLimit = 3; // how many geocode calls run at once

  // Pre-fill all records with fallback locations
  const results = data.map((record) => ({
    ...record,
    location:
      record.latitude && record.longitude && record.latitude !== 0 && record.longitude !== 0
        ? `${record.latitude}, ${record.longitude}`
        : 'Invalid Coordinates'
  }));

  // Helper: concurrency pool
  async function asyncPool(limit, array, iteratorFn) {
    const ret = [];
    const executing = [];
    for (const item of array) {
      const p = Promise.resolve().then(() => iteratorFn(item, array.indexOf(item)));
      ret.push(p);
      if (limit <= array.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= limit) await Promise.race(executing);
      }
    }
    return Promise.all(ret);
  }

  // Run reverse geocode on first `maxGeocode` records with concurrency control
  await asyncPool(concurrencyLimit, results.slice(0, maxGeocode), async (record, i) => {
    try {
      if (
        record.latitude &&
        record.longitude &&
        record.latitude !== 0 &&
        record.longitude !== 0
      ) {
        const location = await reverseGeocode(record.latitude, record.longitude);
        results[i].location = location || `${record.latitude}, ${record.longitude}`;
      }
    } catch (error) {
      console.error(
        `Geocoding failed for ${record.latitude}, ${record.longitude}:`,
        error.message
      );
    }
  });

  return results;
}

async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.anantdrishti.com/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
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
