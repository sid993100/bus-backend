
import { isValid, differenceInHours, parseISO } from 'date-fns';
import TrackingPacket from '../../models/trackingPacketModel.js';



export  const  rawData =async (req, res) => {
  try {
    const { imei, startDate, endDate } = req.query;

    // Validation
    if (!imei) {
      return res.status(400).json({
        error: 'IMEI number is required',
        message: 'Please provide a valid VLTD IMEI number'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Date range required',
        message: 'Both startDate and endDate are required in ISO format'
      });
    }

    // Parse dates
    let start, end;
    try {
      start = parseISO(startDate);
      end = parseISO(endDate);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Dates must be in ISO format (e.g., 2024-10-24T00:00:00Z)'
      });
    }

    // Validate dates
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

    // Check 24-hour limit
    const hoursDifference = differenceInHours(end, start);
    if (hoursDifference > 24) {
      return res.status(400).json({
        error: 'Date range too large',
        message: 'Maximum allowed range is 24 hours',
        requestedHours: hoursDifference,
        maxAllowedHours: 24
      });
    }

    // Query database
    const trackingData = await TrackingPacket.find({
      imei: imei,
      timestamp: {
        $gte: start,
        $lte: end
      }
    })
    .sort({ timestamp: 1 })
    .limit(10000); // Safety limit

    // Response
    res.status(200).json({
      success: true,
      imei: imei,
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        durationHours: hoursDifference
      },
      totalRecords: trackingData.length,
      data: trackingData
    });

  } catch (error) {
    console.error('Error fetching raw data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve tracking data'
    });
  }
};


