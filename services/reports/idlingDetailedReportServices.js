import Vehicle from '../../models/vehicleModel.js';
import TrackingPacket from '../../models/trackingPacketModel.js';
import { parseISO, differenceInMilliseconds, isValid } from 'date-fns';
import axios from 'axios';

const IDLE_SPEED_THRESHOLD = 0;

const formatDuration = (ms) => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const formatDateTimeForReport = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const reverseGeocode = async (lat, lon) => {
  if (!lat || !lon || lat === 0 || lon === 0) {
    return 'Invalid Coordinates';
  }
  try {
    const url = `https://nominatim.locationtrack.in/reverse.php?lat=${lat}&lon=${lon}&format=json`;
    const response = await axios.get(url, { timeout: 3000 });
    return response.data?.display_name || `${lat}, ${lon}`;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return `${lat}, ${lon}`;
  }
};

// Diagnostic function to analyze idling data patterns
export const idlingDataAnalysis = async (req, res) => {
  try {
    const { startDate, endDate, vehicleNumber } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required query parameters.',
      });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (!isValid(start) || !isValid(end)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO format (e.g., 2025-09-16T10:00:00Z)',
      });
    }

    // Get sample tracking data for analysis
    const query = {
      timestamp: { $gte: start, $lte: end }
    };
    
    if (vehicleNumber) {
      query.vehicle_reg_no = vehicleNumber.toUpperCase();
    }

    const sampleData = await TrackingPacket.find(query)
      .select('vehicle_reg_no timestamp ignition speed_kmh latitude longitude imei')
      .sort({ timestamp: 1 })
      .limit(500);

    if (sampleData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No tracking data found for analysis'
      });
    }

    // Analyze the data patterns for idling
    const analysis = {
      totalRecords: sampleData.length,
      ignitionPatterns: {
        ignitionTrue: sampleData.filter(d => d.ignition === true).length,
        ignitionFalse: sampleData.filter(d => d.ignition === false).length,
        ignitionNull: sampleData.filter(d => d.ignition === null || d.ignition === undefined).length
      },
      speedPatterns: {
        speedZero: sampleData.filter(d => d.speed_kmh === 0).length,
        speedGreaterThanZero: sampleData.filter(d => d.speed_kmh > 0).length,
        speedNull: sampleData.filter(d => d.speed_kmh === null || d.speed_kmh === undefined).length
      },
      idlingPatterns: {
        ignitionOnSpeedZero: sampleData.filter(d => d.ignition === true && d.speed_kmh === 0).length,
        ignitionOffSpeedZero: sampleData.filter(d => d.ignition === false && d.speed_kmh === 0).length,
        ignitionOnSpeedGreaterZero: sampleData.filter(d => d.ignition === true && d.speed_kmh > 0).length,
        ignitionOffSpeedGreaterZero: sampleData.filter(d => d.ignition === false && d.speed_kmh > 0).length
      },
      vehicles: [...new Set(sampleData.map(d => d.vehicle_reg_no))],
      sampleRecords: sampleData.slice(0, 20).map(d => ({
        timestamp: formatDateTimeForReport(d.timestamp),
        ignition: d.ignition,
        speed_kmh: d.speed_kmh,
        vehicle: d.vehicle_reg_no
      }))
    };

    // Recommendations based on analysis
    let recommendations = [];
    if (analysis.idlingPatterns.ignitionOnSpeedZero > 0) {
      recommendations.push("Use condition 'ignition_on_speed_zero' - this is the ideal idling condition");
    }
    if (analysis.idlingPatterns.ignitionOffSpeedZero > 0) {
      recommendations.push("Use condition 'ignition_off_speed_zero' - for stoppage scenarios");
    }
    if (analysis.speedPatterns.speedZero > 0) {
      recommendations.push("Use condition 'speed_zero_only' - if ignition data is unreliable");
    }
    if (analysis.ignitionPatterns.ignitionTrue > 0) {
      recommendations.push("Use condition 'ignition_on_only' - if speed data is unreliable");
    }

    return res.status(200).json({
      success: true,
      message: 'Idling data pattern analysis completed',
      analysis: analysis,
      recommendations: recommendations,
      bestCondition: analysis.idlingPatterns.ignitionOnSpeedZero > 0 ? 'ignition_on_speed_zero' :
                    analysis.speedPatterns.speedZero > 0 ? 'speed_zero_only' :
                    analysis.ignitionPatterns.ignitionTrue > 0 ? 'ignition_on_only' : 'ignition_on_speed_zero'
    });

  } catch (error) {
    console.error('Error in idling data analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error in idling data analysis',
      error: error.message
    });
  }
};

// Main idling detailed report function
export const idlingDetailedReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      regionId, 
      depotId, 
      vehicleNumber, 
      idlingDuration = 5,
      condition = 'ignition_on_speed_zero' 
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required query parameters.',
      });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (!isValid(start) || !isValid(end)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO format (e.g., 2025-09-16T10:00:00Z)',
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date',
      });
    }

    const now = new Date();
    if (start > now) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the future',
      });
    }

    if (end > now) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be in the future',
      });
    }

    // Validate idling duration
    const idlingDurationNum = parseInt(idlingDuration);
    if (isNaN(idlingDurationNum) || idlingDurationNum < 1 || idlingDurationNum > 1440) {
      return res.status(400).json({
        success: false,
        message: 'Idling duration must be between 1 and 1440 minutes (24 hours)',
      });
    }

    const minIdlingDurationMs = idlingDurationNum * 60 * 1000;

    // Build vehicle filter
    const vehicleFilter = {};
    if (regionId) vehicleFilter.regionZone = regionId;
    if (depotId) vehicleFilter.depotCustomer = depotId;
    if (vehicleNumber) vehicleFilter.vehicleNumber = vehicleNumber.toUpperCase();

    const vehicles = await Vehicle.find(vehicleFilter)
      .populate('regionZone', 'name')
      .populate('depotCustomer', 'depotCustomer')
      .populate('serviceType', 'name');

    if (vehicles.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No vehicles found for the specified filter.' 
      });
    }

    const vehicleNumbers = vehicles.map(v => v.vehicleNumber);
    console.log(`Found ${vehicles.length} vehicles: ${vehicleNumbers.join(', ')}`);

    // Get tracking data
    const trackingData = await TrackingPacket.find({
      vehicle_reg_no: { $in: vehicleNumbers },
      timestamp: { $gte: start, $lte: end },
    })
    .select('vehicle_reg_no timestamp ignition speed_kmh latitude longitude imei')
    .sort({ vehicle_reg_no: 1, timestamp: 1 });

    console.log(`Found ${trackingData.length} tracking packets`);

    if (trackingData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No tracking data found for the specified criteria and time period.'
      });
    }

    // Analyze data patterns for auto condition selection
    const dataAnalysis = {
      ignitionOnSpeedZero: trackingData.filter(d => d.ignition === true && d.speed_kmh === 0).length,
      ignitionOffSpeedZero: trackingData.filter(d => d.ignition === false && d.speed_kmh === 0).length,
      speedZeroOnly: trackingData.filter(d => d.speed_kmh === 0).length,
      ignitionOnOnly: trackingData.filter(d => d.ignition === true).length,
      totalRecords: trackingData.length
    };

    console.log('Idling data analysis:', dataAnalysis);

    // Group data by vehicle
    const dataByVehicle = trackingData.reduce((acc, packet) => {
      if (!acc[packet.vehicle_reg_no]) {
        acc[packet.vehicle_reg_no] = [];
      }
      acc[packet.vehicle_reg_no].push(packet);
      return acc;
    }, {});

    // Define idling condition functions
    const getIdlingCondition = (packet, conditionType) => {
      const hasValidIgnition = packet.ignition !== null && packet.ignition !== undefined;
      const hasValidSpeed = packet.speed_kmh !== null && packet.speed_kmh !== undefined;

      switch (conditionType) {
        case 'ignition_on_speed_zero':
          return hasValidIgnition && hasValidSpeed && packet.ignition === true && packet.speed_kmh === 0;
        case 'speed_zero_only':
          return hasValidSpeed && packet.speed_kmh === 0;
        case 'ignition_on_only':
          return hasValidIgnition && packet.ignition === true;
        case 'ignition_off_speed_zero':
          return hasValidIgnition && hasValidSpeed && packet.ignition === false && packet.speed_kmh === 0;
        default:
          return hasValidIgnition && hasValidSpeed && packet.ignition === true && packet.speed_kmh === 0;
      }
    };

    // Auto-select best condition if 'auto' is specified
    let finalCondition = condition;
    if (condition === 'auto') {
      if (dataAnalysis.ignitionOnSpeedZero > 0) {
        finalCondition = 'ignition_on_speed_zero';
      } else if (dataAnalysis.speedZeroOnly > 0) {
        finalCondition = 'speed_zero_only';
      } else if (dataAnalysis.ignitionOnOnly > 0) {
        finalCondition = 'ignition_on_only';
      } else if (dataAnalysis.ignitionOffSpeedZero > 0) {
        finalCondition = 'ignition_off_speed_zero';
      } else {
        finalCondition = 'ignition_on_speed_zero'; // Default fallback
      }
    }

    console.log(`Using idling condition: ${finalCondition}`);

    const detailedReportList = [];
    let totalIdlingFound = 0;

    // Process each vehicle
    for (const vehicle of vehicles) {
      const packets = dataByVehicle[vehicle.vehicleNumber] || [];
      console.log(`Processing vehicle ${vehicle.vehicleNumber}: ${packets.length} packets`);
      
      if (packets.length === 0) continue;

      // Get IMEI from tracking data
      const imeiNumber = packets.find(p => p.imei)?.imei || 'N/A';

      let isIdling = false;
      let idleStartTime = null;
      let idleStartLocation = null;
      let vehicleIdlings = 0;

      for (let i = 0; i < packets.length; i++) {
        const currentPacket = packets[i];
        
        const conditionMet = getIdlingCondition(currentPacket, finalCondition);

        if (!isIdling && conditionMet) {
          // Start of idling
          isIdling = true;
          idleStartTime = currentPacket.timestamp;
          idleStartLocation = {
            latitude: currentPacket.latitude || 0,
            longitude: currentPacket.longitude || 0,
          };
        } else if (isIdling && !conditionMet) {
          // End of idling
          isIdling = false;
          const idleEndTime = currentPacket.timestamp;
          const duration = differenceInMilliseconds(idleEndTime, idleStartTime);

          if (duration >= minIdlingDurationMs) {
            vehicleIdlings++;
            
            // Get location with rate limiting
            let locationName = 'Location not available';
            if (idleStartLocation.latitude !== 0 && idleStartLocation.longitude !== 0) {
              try {
                locationName = await reverseGeocode(idleStartLocation.latitude, idleStartLocation.longitude);
                // Add delay to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (error) {
                locationName = `${idleStartLocation.latitude}, ${idleStartLocation.longitude}`;
              }
            }

            detailedReportList.push({
              zoneRegion: vehicle.regionZone?.name || 'N/A',
              depotCustomer: vehicle.depotCustomer?.depotCustomer || 'N/A',
              vehicleNumber: vehicle.vehicleNumber,
              imeiNumber: imeiNumber,
              serviceType: vehicle.serviceType?.name || 'N/A',
              ownerType: vehicle.ownerType || 'N/A',
              idlingStartTime: formatDateTimeForReport(idleStartTime),
              idlingEndTime: formatDateTimeForReport(idleEndTime),
              totalIdlingDuration: formatDuration(duration),
              idlingLocation: locationName,
              coordinates: {
                latitude: idleStartLocation.latitude,
                longitude: idleStartLocation.longitude
              },
              conditionUsed: finalCondition
            });
          }
        }
      }
      
      // Handle ongoing idling (vehicle still idling at end of period)
      if (isIdling && packets.length > 0) {
        const lastPacketTime = packets[packets.length - 1].timestamp;
        const duration = differenceInMilliseconds(lastPacketTime, idleStartTime);
        
        if (duration >= minIdlingDurationMs) {
          vehicleIdlings++;
          
          let locationName = 'Location not available';
          if (idleStartLocation.latitude !== 0 && idleStartLocation.longitude !== 0) {
            try {
              locationName = await reverseGeocode(idleStartLocation.latitude, idleStartLocation.longitude);
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              locationName = `${idleStartLocation.latitude}, ${idleStartLocation.longitude}`;
            }
          }

          detailedReportList.push({
            zoneRegion: vehicle.regionZone?.name || 'N/A',
            depotCustomer: vehicle.depotCustomer?.depotCustomer || 'N/A',
            vehicleNumber: vehicle.vehicleNumber,
            imeiNumber: imeiNumber,
            serviceType: vehicle.serviceType?.name || 'N/A',
            ownerType: vehicle.ownerType || 'N/A',
            idlingStartTime: formatDateTimeForReport(idleStartTime),
            idlingEndTime: formatDateTimeForReport(lastPacketTime),
            totalIdlingDuration: formatDuration(duration),
            idlingLocation: locationName,
            coordinates: {
              latitude: idleStartLocation.latitude,
              longitude: idleStartLocation.longitude
            },
            isOngoing: true,
            conditionUsed: finalCondition
          });
        }
      }

      totalIdlingFound += vehicleIdlings;
      console.log(`Vehicle ${vehicle.vehicleNumber}: Found ${vehicleIdlings} idling periods`);
    }

    console.log(`Total idling periods found: ${totalIdlingFound}`);

    if (detailedReportList.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No idling activity found for more than ${idlingDuration} minutes using condition '${finalCondition}'.`,
        debug: {
          vehiclesFound: vehicles.length,
          trackingPacketsFound: trackingData.length,
          conditionUsed: finalCondition,
          dataAnalysis: dataAnalysis,
          suggestions: [
            dataAnalysis.ignitionOnSpeedZero > 0 ? 'Try condition=ignition_on_speed_zero' : null,
            dataAnalysis.speedZeroOnly > 0 ? 'Try condition=speed_zero_only' : null,
            dataAnalysis.ignitionOnOnly > 0 ? 'Try condition=ignition_on_only' : null,
            dataAnalysis.ignitionOffSpeedZero > 0 ? 'Try condition=ignition_off_speed_zero' : null
          ].filter(Boolean)
        }
      });
    }

    // Sort results by vehicle number and then by idling start time
    detailedReportList.sort((a, b) => {
      if (a.vehicleNumber !== b.vehicleNumber) {
        return a.vehicleNumber.localeCompare(b.vehicleNumber);
      }
      // Convert formatted date back to comparable format for sorting
      const parseFormattedDate = (dateStr) => {
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('-');
        return new Date(`${year}-${month}-${day}T${timePart}:00`);
      };
      
      return parseFormattedDate(a.idlingStartTime) - parseFormattedDate(b.idlingStartTime);
    });

    // Calculate summary statistics
    const totalIdlingTime = detailedReportList.reduce((sum, record) => {
      const [hours, minutes, seconds] = record.totalIdlingDuration.split(':').map(Number);
      return sum + (hours * 3600 + minutes * 60 + seconds) * 1000;
    }, 0);

    const uniqueVehicles = new Set(detailedReportList.map(record => record.vehicleNumber));
    const dateRangeMs = differenceInMilliseconds(end, start);

    // Prepare final response
    res.status(200).json({
      success: true,
      message: 'Idling detailed report generated successfully.',
      conditionUsed: finalCondition,
      filters: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        minDurationMinutes: idlingDurationNum,
        dateRangeDays: Math.ceil(dateRangeMs / (24 * 60 * 60 * 1000)),
        condition: finalCondition,
        ...(regionId && { regionId }),
        ...(depotId && { depotId }),
        ...(vehicleNumber && { vehicleNumber }),
      },
      summary: {
        totalRecords: detailedReportList.length,
        uniqueVehicles: uniqueVehicles.size,
        totalVehiclesAnalyzed: vehicles.length,
        totalTrackingPackets: trackingData.length,
        totalIdlingTime: formatDuration(totalIdlingTime),
        averageIdlingPerVehicle: uniqueVehicles.size > 0 ? 
          Math.round((detailedReportList.length / uniqueVehicles.size) * 100) / 100 : 0,
        ongoingIdlings: detailedReportList.filter(record => record.isOngoing).length,
        dataAnalysis: dataAnalysis
      },
      data: detailedReportList
    });

  } catch (error) {
    console.error('Error generating idling detailed report:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
