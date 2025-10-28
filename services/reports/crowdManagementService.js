import TrackingPacket from "../../models/trackingPacketModel.js";
import GeoFence from "../../models/geoFenceModel.js";

export const getCrowdManagement = async (req, res) => {
  try {
    const { 
      geo, 
      criteria, 
      startDate, 
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    // Validate inputs
    if (!geo ) {
      return res.status(400).json({
        success: false,
        error: 'geo is required'
      });
    }
    const geoFence= await GeoFence.findById(geo)


    if (!criteria || !['entry', 'exit'].includes(criteria.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'criteria must be either "entry" or "exit"'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'startDate must be before endDate'
      });
    }

    // Parse and validate pagination params
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);

    const lon = parseFloat(geoFence.longitude);
    const lat = parseFloat(geoFence.latitude);
    const radiusInMeters = parseFloat(geoFence.radius);

    // Query all packets in time range for analysis
    const allPackets = await TrackingPacket.find({
      timestamp: { $gte: start, $lte: end },
      location: { $exists: true },
      vehicle_reg_no: { $exists: true, $ne: null }
    })
    .select('vehicle_reg_no imei timestamp location latitude longitude speed_kmh heading')
    .sort({ vehicle_reg_no: 1, timestamp: 1 })
    .lean();

    if (!allPackets || allPackets.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No tracking data found for the specified time range',
        data: [],
        pagination: {
          currentPage: pageNum,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limitNum,
          hasNextPage: false,
          hasPrevPage: false
        },
        summary: {
          totalVehicles: 0,
          totalEvents: 0,
          criteria,
          timeRange: { start, end },
          geofence: { center: { lon, lat }, radiusMeters: radiusInMeters }
        }
      });
    }

    // Group packets by vehicle
    const vehiclePackets = {};
    allPackets.forEach(packet => {
      const vehicleId = packet.vehicle_reg_no;
      if (!vehiclePackets[vehicleId]) {
        vehiclePackets[vehicleId] = [];
      }
      vehiclePackets[vehicleId].push(packet);
    });

    // Detect entry/exit events with duration
    const allEvents = [];
    const criteriaLower = criteria.toLowerCase();

    for (const [vehicleId, packets] of Object.entries(vehiclePackets)) {
      const vehicleEvents = detectGeofenceEventsWithDuration(
        packets,
        { lon, lat, radiusInMeters },
        criteriaLower
      );

      if (vehicleEvents.length > 0) {
        allEvents.push({
          vehicle_reg_no: vehicleId,
          imei: packets[0].imei,
          events: vehicleEvents
        });
      }
    }

    // Sort by most recent event first (before pagination)
    allEvents.sort((a, b) => {
      const lastA = a.events[a.events.length - 1].entryTime || a.events[a.events.length - 1].exitTime;
      const lastB = b.events[b.events.length - 1].entryTime || b.events[b.events.length - 1].exitTime;
      return new Date(lastB) - new Date(lastA);
    });

    // Calculate total counts before pagination
    const totalVehicles = allEvents.length;
    const totalEvents = allEvents.reduce((sum, v) => sum + v.events.length, 0);
    const totalPages = Math.ceil(totalVehicles / limitNum);

    // Apply pagination using array slice
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedEvents = allEvents.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      message: `Found ${totalEvents} ${criteriaLower} event(s) for ${totalVehicles} vehicle(s)`,
      data: paginatedEvents,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalVehicles,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      summary: {
        totalVehicles,
        totalEvents,
        criteria: criteriaLower,
        timeRange: { start, end },
        geofence: {
          center: { lon, lat },
          radiusMeters: radiusInMeters
        }
      }
    });

  } catch (error) {
    console.error('Error in crowd management:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process crowd management request',
      message: error.message
    });
  }
};

/**
 * Helper: Detect entry/exit events with duration tracking
 */
function detectGeofenceEventsWithDuration(packets, geofence, criteria) {
  const events = [];
  let previousInside = null;
  let entryPacket = null;

  packets.forEach((packet, index) => {
    const isInside = isPointInCircle(
      packet.location.coordinates[1], // latitude
      packet.location.coordinates[0], // longitude
      geofence.lat,
      geofence.lon,
      geofence.radiusInMeters
    );

    // Detect state change
    if (previousInside !== null && previousInside !== isInside) {
      if (criteria === 'entry') {
        // Track entries with subsequent exit information
        if (!previousInside && isInside) {
          // Vehicle entered
          entryPacket = packet;
        } else if (previousInside && !isInside && entryPacket) {
          // Vehicle exited - pair with entry
          const durationMinutes = calculateMinutesDifference(entryPacket.timestamp, packet.timestamp);
          
          events.push({
            eventType: 'ENTRY',
            entryTime: entryPacket.timestamp,
            entryLocation: {
              lat: entryPacket.latitude,
              lon: entryPacket.longitude
            },
            exitTime: packet.timestamp,
            exitLocation: {
              lat: packet.latitude,
              lon: packet.longitude
            },
            durationMinutes,
            durationFormatted: formatDuration(durationMinutes),
            entrySpeed_kmh: entryPacket.speed_kmh || 0,
            exitSpeed_kmh: packet.speed_kmh || 0,
            entryHeading: entryPacket.heading || 0,
            exitHeading: packet.heading || 0,
            stillInside: false
          });
          entryPacket = null;
        }
      } else if (criteria === 'exit') {
        // Track exits with prior entry information
        if (!previousInside && isInside) {
          // Vehicle entered - store for pairing
          entryPacket = packet;
        } else if (previousInside && !isInside && entryPacket) {
          // Vehicle exited
          const durationMinutes = calculateMinutesDifference(entryPacket.timestamp, packet.timestamp);
          
          events.push({
            eventType: 'EXIT',
            entryTime: entryPacket.timestamp,
            entryLocation: {
              lat: entryPacket.latitude,
              lon: entryPacket.longitude
            },
            exitTime: packet.timestamp,
            exitLocation: {
              lat: packet.latitude,
              lon: packet.longitude
            },
            durationMinutes,
            durationFormatted: formatDuration(durationMinutes),
            entrySpeed_kmh: entryPacket.speed_kmh || 0,
            exitSpeed_kmh: packet.speed_kmh || 0,
            entryHeading: entryPacket.heading || 0,
            exitHeading: packet.heading || 0
          });
          entryPacket = null;
        }
      }
    }

    previousInside = isInside;
  });

  // Handle vehicles still inside (for entry criteria only)
  if (criteria === 'entry' && entryPacket && previousInside) {
    const lastPacket = packets[packets.length - 1];
    const durationMinutes = calculateMinutesDifference(entryPacket.timestamp, lastPacket.timestamp);
    
    events.push({
      eventType: 'ENTRY',
      entryTime: entryPacket.timestamp,
      entryLocation: {
        lat: entryPacket.latitude,
        lon: entryPacket.longitude
      },
      exitTime: null,
      exitLocation: null,
      durationMinutes,
      durationFormatted: formatDuration(durationMinutes) + ' (ongoing)',
      entrySpeed_kmh: entryPacket.speed_kmh || 0,
      exitSpeed_kmh: null,
      entryHeading: entryPacket.heading || 0,
      exitHeading: null,
      stillInside: true,
      lastKnownLocation: {
        lat: lastPacket.latitude,
        lon: lastPacket.longitude
      },
      lastKnownTime: lastPacket.timestamp
    });
  }

  return events;
}

/**
 * Helper: Calculate minutes difference between two dates
 */
function calculateMinutesDifference(date1, date2) {
  const diffMs = Math.abs(new Date(date2) - new Date(date1));
  return Math.round(diffMs / (1000 * 60));
}

/**
 * Helper: Format duration into human-readable format
 */
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}

/**
 * Helper: Check if a point is inside a circle (Haversine formula)
 */
function isPointInCircle(pointLat, pointLon, circleLat, circleLon, radiusMeters) {
  const R = 6378100; // Earth's radius in meters
  const dLat = toRadians(pointLat - circleLat);
  const dLon = toRadians(pointLon - circleLon);

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(circleLat)) * Math.cos(toRadians(pointLat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radiusMeters;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
