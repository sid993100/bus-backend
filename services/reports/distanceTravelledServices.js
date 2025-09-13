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
        
        // Get location names
        if (currentJourney.startLat && currentJourney.startLon) {
          currentJourney.startLocation = await getLocationName(currentJourney.startLat, currentJourney.startLon);
        }
        if (currentJourney.endLat && currentJourney.endLon) {
          currentJourney.endLocation = await getLocationName(currentJourney.endLat, currentJourney.endLon);
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

    // Response matching your table format
    res.json({
      success: true,
      summary: {
        vehicleNumber: vehicleNumber,
        startTime: formatDateTime(start),
        endTime: formatDateTime(end),
        totalDistance: `${Math.round(totalDistance * 10) / 10} KM`,
        totalJourneys: journeySegments.length
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
 * Get location name from coordinates
 */
async function getLocationName(lat, lon) {
  try {
    const url = `http://nominatim.locationtrack.in/reverse?format=json&lat=${lat}&lon=${lon}`;
    const response = await axios.get(url, { timeout: 3000 });
    
    if (response.data?.display_name) {
      return response.data.display_name;
    }
    return `${lat}, ${lon}`;
  } catch (error) {
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
