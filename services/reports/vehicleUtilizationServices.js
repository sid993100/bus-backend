import TrackingPacket from '../../models/trackingPacketModel.js';

export const getVehicleUtilization = async (req, res) => {
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

    // **FIX: Optional - limit maximum date range (e.g., 31 days)**
    const maxRangeDays = 31;
    const dateRangeMs = end.getTime() - start.getTime();
    const maxRangeMs = maxRangeDays * 24 * 60 * 60 * 1000;
    
    if (dateRangeMs > maxRangeMs) {
      return res.status(400).json({
        error: 'Date range too large',
        message: `Date range cannot exceed ${maxRangeDays} days`
      });
    }

    // **FIX: Optional - limit how far back in time (e.g., 90 days)**
    const maxPastDays = 90;
    const maxPastTime = new Date(now.getTime() - (maxPastDays * 24 * 60 * 60 * 1000));
    
    if (start < maxPastTime) {
      return res.status(400).json({
        error: 'Start date too old',
        message: `Start date cannot be more than ${maxPastDays} days in the past`
      });
    }

    // Get tracking data grouped by date
    const utilizationData = await TrackingPacket.aggregate([
      {
        $match: {
          vehicle_reg_no: vehicleNumber,
          timestamp: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $addFields: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp"
            }
          }
        }
      },
      {
        $group: {
          _id: {
            vehicle: '$vehicle_reg_no',
            date: '$date'
          },
          packets: { $push: '$$ROOT' },
          firstPacket: { $min: '$timestamp' },
          lastPacket: { $max: '$timestamp' },
          totalPackets: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    if (utilizationData.length === 0) {
      return res.status(404).json({
        error: 'No data found',
        message: `No tracking data found for vehicle ${vehicleNumber} in the specified period`
      });
    }

    // Process each day's data
    const dailyUtilization = [];

    for (const dayData of utilizationData) {
      const packets = dayData.packets.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      let stoppageDuration = 0;
      let idleDuration = 0;
      let journeyDuration = 0;
      let journeyTravelled = 0;

      let lastMovingTime = null;
      let lastStationaryTime = null;

      // Calculate durations and distance
      for (let i = 0; i < packets.length; i++) {
        const packet = packets[i];
        const prevPacket = i > 0 ? packets[i - 1] : null;

        // Calculate distance
        if (prevPacket && packet.latitude && packet.longitude && 
            prevPacket.latitude && prevPacket.longitude) {
          const distance = calculateDistance(
            prevPacket.latitude, prevPacket.longitude,
            packet.latitude, packet.longitude
          );
          journeyTravelled += distance;
        }

        // Calculate time durations
        if (prevPacket) {
          const timeDiff = (new Date(packet.timestamp) - new Date(prevPacket.timestamp)) / (1000 * 60); // minutes
          
          if (packet.speed_kmh > 5) { // Vehicle is moving
            journeyDuration += timeDiff;
            if (lastStationaryTime) {
              // Was stationary, now moving
              if (prevPacket.ignition) {
                idleDuration += timeDiff;
              } else {
                stoppageDuration += timeDiff;
              }
            }
            lastMovingTime = packet.timestamp;
            lastStationaryTime = null;
          } else { // Vehicle is stationary
            if (packet.ignition) {
              idleDuration += timeDiff;
            } else {
              stoppageDuration += timeDiff;
            }
            lastStationaryTime = packet.timestamp;
          }
        }
      }

      // Format the data for response
      dailyUtilization.push({
        vehicleNumber: dayData._id.vehicle,
        manufacturerName: 'TATA',
        vehicleType: 'BUS',
        model: 'BS-VI',
        date: formatDate(dayData._id.date),
        stoppageDuration: formatDuration(stoppageDuration),
        idleDuration: formatDuration(idleDuration),
        journeyDuration: formatDuration(journeyDuration),
        journeyTravelled: `${Math.round(journeyTravelled)} KM`
      });
    }

    // Calculate totals
    const totalJourneyTravelled = dailyUtilization.reduce((sum, day) => {
      return sum + parseInt(day.journeyTravelled.replace(' KM', ''));
    }, 0);

    // **FIX: Enhanced response with validation info**
    res.json({
      success: true,
      summary: {
        vehicleNumber: vehicleNumber,
        startTime: formatDateOnly(start),
        endTime: formatDateOnly(end),
        totalDays: dailyUtilization.length,
        totalJourneyTravelled: `${totalJourneyTravelled} KM`,
        dateRangeDays: Math.ceil(dateRangeMs / (24 * 60 * 60 * 1000))
      },
      utilization: dailyUtilization
    });

  } catch (error) {
    console.error('Error calculating vehicle utilization:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to calculate vehicle utilization'
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
 * Format duration from minutes to HH:MM format
 */
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Format date to DD-MM-YYYY
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format date to DD-MM-YYYY (from Date object)
 */
function formatDateOnly(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
