import TrackingPacket from '../../models/trackingPacketModel.js';
import axios from 'axios';

export const getDistanceTravelled = async (req, res) => {
  try {
    const { vehicleNumber, startDate, endDate } = req.query;

    if (!vehicleNumber) {
      return res.status(400).json({
        error: 'Vehicle number is required',
        message: 'Please provide a valid vehicle number (e.g., UP33AT5471)'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Date range required',
        message: 'Both startDate and endDate are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // **FIX: Validate date format**
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Please provide valid dates in ISO format (e.g., 2025-09-13T00:00:00Z)'
      });
    }

    // **FIX: Get current time for validation**
    const now = new Date();

    // **FIX: Check if dates are in the future**
    if (start > now) {
      return res.status(400).json({
        error: 'Invalid start date',
        message: 'Start date cannot be in the future'
      });
    }

    if (end > now) {
      return res.status(400).json({
        error: 'Invalid end date',
        message: 'End date cannot be in the future'
      });
    }

    // **FIX: Check date range validity**
    if (start >= end) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'Start date must be before end date'
      });
    }

    // **FIX: Optional - limit maximum date range (e.g., 7 days for distance calculation)**
    const maxRangeDays = 7;
    const dateRangeMs = end.getTime() - start.getTime();
    const maxRangeMs = maxRangeDays * 24 * 60 * 60 * 1000;
    
    if (dateRangeMs > maxRangeMs) {
      return res.status(400).json({
        error: 'Date range too large',
        message: `Date range cannot exceed ${maxRangeDays} days for distance calculation`
      });
    }

    // **FIX: Optional - limit how far back in time (e.g., 30 days)**
    const maxPastDays = 30;
    const maxPastTime = new Date(now.getTime() - (maxPastDays * 24 * 60 * 60 * 1000));
    
    if (start < maxPastTime) {
      return res.status(400).json({
        error: 'Start date too old',
        message: `Start date cannot be more than ${maxPastDays} days in the past`
      });
    }

    // Get tracking data for the vehicle in date range
    const trackingData = await TrackingPacket.find({
      vehicle_reg_no: vehicleNumber,
      timestamp: {
        $gte: start,
        $lte: end
      }
    })
    .select('timestamp latitude longitude speed_kmh ignition')
    .sort({ timestamp: 1 });

    if (trackingData.length === 0) {
      return res.status(404).json({
        error: 'No data found',
        message: `No tracking data found for vehicle ${vehicleNumber} in the specified period`
      });
    }

    // Calculate journey segments and total distance
    const journeySegments = [];
    let totalDistance = 0;
    let currentJourney = null;

    for (let i = 0; i < trackingData.length; i++) {
      const point = trackingData[i];
      
      // Start of journey (ignition on)
      if (point.ignition && !currentJourney) {
        currentJourney = {
          startTime: point.timestamp,
          startLocation: null,
          startLat: point.latitude,
          startLon: point.longitude,
          endTime: null,
          endLocation: null,
          endLat: null,
          endLon: null,
          distance: 0
        };
      }
      
      // Calculate distance between consecutive points
      if (i > 0 && currentJourney) {
        const prevPoint = trackingData[i - 1];
        if (prevPoint.latitude && prevPoint.longitude && point.latitude && point.longitude) {
          const segmentDistance = calculateDistance(
            prevPoint.latitude, prevPoint.longitude,
            point.latitude, point.longitude
          );
          currentJourney.distance += segmentDistance;
        }
      }
      
      // End of journey (ignition off or last point)
      if ((!point.ignition || i === trackingData.length - 1) && currentJourney) {
        currentJourney.endTime = point.timestamp;
        currentJourney.endLat = point.latitude;
        currentJourney.endLon = point.longitude;
        
        // Get location names (with rate limiting for API calls)
        if (currentJourney.startLat && currentJourney.startLon) {
          currentJourney.startLocation = await getLocationName(currentJourney.startLat, currentJourney.startLon);
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (currentJourney.endLat && currentJourney.endLon) {
          currentJourney.endLocation = await getLocationName(currentJourney.endLat, currentJourney.endLon);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Calculate journey time
        const journeyTimeMs = currentJourney.endTime - currentJourney.startTime;
        const journeyTimeHours = Math.floor(journeyTimeMs / (1000 * 60 * 60));
        const journeyTimeMinutes = Math.floor((journeyTimeMs % (1000 * 60 * 60)) / (1000 * 60));
        
        journeySegments.push({
          vehicleNumber: vehicleNumber,
          startTime: formatDateTime(currentJourney.startTime),
          startLocation: currentJourney.startLocation || `${currentJourney.startLat}, ${currentJourney.startLon}`,
          endTime: formatDateTime(currentJourney.endTime),
          endLocation: currentJourney.endLocation || `${currentJourney.endLat}, ${currentJourney.endLon}`,
          journeyTime: `${String(journeyTimeHours).padStart(2, '0')}:${String(journeyTimeMinutes).padStart(2, '0')}:00`,
          distanceTravelled: `${Math.round(currentJourney.distance * 10) / 10} KM`
        });
        
        totalDistance += currentJourney.distance;
        currentJourney = null;
      }
    }

    // **FIX: Enhanced response with validation info**
    res.json({
      success: true,
      summary: {
        vehicleNumber: vehicleNumber,
        startTime: formatDateTime(start),
        endTime: formatDateTime(end),
        totalDistance: `${Math.round(totalDistance * 10) / 10} KM`,
        totalJourneys: journeySegments.length,
        dateRangeDays: Math.ceil(dateRangeMs / (24 * 60 * 60 * 1000)),
        dataPoints: trackingData.length
      },
      journeys: journeySegments
    });

  } catch (error) {
    console.error('Error calculating distance travelled:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to calculate distance travelled'
    });
  }
};

/**
 * Calculate distance between two GPS coordinates using Haversine formula
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

/**
 * Get location name from coordinates - Enhanced with better error handling
 */
async function getLocationName(lat, lon) {
  if (!lat || !lon || lat === 0 || lon === 0) {
    return 'Invalid Coordinates';
  }
  
  try {
    const url = `https://nominatim.locationtrack.in/reverse.php?lat=${lat}&lon=${lon}&format=json`;
    const response = await axios.get(url, { 
      timeout: 5000,
      headers: {
        'User-Agent': 'DistanceTrackingApp/1.0'
      }
    });
    
    if (response.data?.display_name) {
      return response.data.display_name;
    }
    
    // Fallback to address components
    if (response.data?.address) {
      const addr = response.data.address;
      const parts = [
        addr.road,
        addr.city || addr.town || addr.village,
        addr.state,
        addr.country
      ].filter(Boolean);
      
      return parts.length > 0 ? parts.join(', ') : `${lat}, ${lon}`;
    }
    
    return `${lat}, ${lon}`;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return `${lat}, ${lon}`;
  }
}

/**
 * Format datetime to DD-MM-YYYY HH:MM
 */
function formatDateTime(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
