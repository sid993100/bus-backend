import Vehicle from '../../models/vehicleModel.js';
import TrackingPacket from '../../models/trackingPacketModel.js';
import { parseISO, differenceInMilliseconds, isValid } from 'date-fns';
import axios from 'axios';

const STOP_SPEED_THRESHOLD = 0;

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
    const url = `https://nominatim.anantdrishti.com/reverse?format=geocodejson&lat=${lat}&lon=${lon}`;
    const response = await axios.get(url, { timeout: 3000 });
    return response.data?.features?.[0]?.properties?.display_name || `${lat}, ${lon}`;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return `${lat}, ${lon}`;
  }
};

// Diagnostic function to analyze data patterns
export const stoppageDataAnalysis = async (req, res) => {
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
      .limit(500); // Get sample records

    if (sampleData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No tracking data found for analysis'
      });
    }

    // Analyze the data patterns
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
      combinedPatterns: {
        ignitionOffSpeedZero: sampleData.filter(d => d.ignition === false && d.speed_kmh === 0).length,
        ignitionOnSpeedZero: sampleData.filter(d => d.ignition === true && d.speed_kmh === 0).length,
        ignitionOffSpeedGreaterZero: sampleData.filter(d => d.ignition === false && d.speed_kmh > 0).length,
        ignitionOnSpeedGreaterZero: sampleData.filter(d => d.ignition === true && d.speed_kmh > 0).length
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
    if (analysis.combinedPatterns.ignitionOffSpeedZero > 0) {
      recommendations.push("Use condition 'ignition_off_speed_zero' - this is the ideal stoppage condition");
    }
    if (analysis.combinedPatterns.ignitionOnSpeedZero > 0) {
      recommendations.push("Use condition 'ignition_on_speed_zero' - for idling scenarios");
    }
    if (analysis.speedPatterns.speedZero > 0) {
      recommendations.push("Use condition 'speed_zero_only' - if ignition data is unreliable");
    }
    if (analysis.ignitionPatterns.ignitionFalse > 0) {
      recommendations.push("Use condition 'ignition_off_only' - if speed data is unreliable");
    }

    return res.status(200).json({
      success: true,
      message: 'Data pattern analysis completed',
      analysis: analysis,
      recommendations: recommendations,
      bestCondition: analysis.combinedPatterns.ignitionOffSpeedZero > 0 ? 'ignition_off_speed_zero' :
                    analysis.speedPatterns.speedZero > 0 ? 'speed_zero_only' :
                    analysis.ignitionPatterns.ignitionFalse > 0 ? 'ignition_off_only' : 'ignition_on_speed_zero'
    });

  } catch (error) {
    console.error('Error in data analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error in data analysis',
      error: error.message
    });
  }
};

// Main stoppage detailed report function
export const stoppageDetailedReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      regionId, 
      depotId, 
      vehicleNumber, 
      stoppageDuration = 5,
      condition = 'auto' // auto, ignition_off_speed_zero, speed_zero_only, ignition_off_only, ignition_on_speed_zero
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

    // Validate stoppage duration
    const stoppageDurationNum = parseInt(stoppageDuration);
    if (isNaN(stoppageDurationNum) || stoppageDurationNum < 1 || stoppageDurationNum > 1440) {
      return res.status(400).json({
        success: false,
        message: 'Stoppage duration must be between 1 and 1440 minutes (24 hours)',
      });
    }

    const minStoppageDurationMs = stoppageDurationNum * 60 * 1000;

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
      ignitionOffSpeedZero: trackingData.filter(d => d.ignition === false && d.speed_kmh === 0).length,
      ignitionOnSpeedZero: trackingData.filter(d => d.ignition === true && d.speed_kmh === 0).length,
      speedZeroOnly: trackingData.filter(d => d.speed_kmh === 0).length,
      ignitionOffOnly: trackingData.filter(d => d.ignition === false).length,
      totalRecords: trackingData.length
    };

    console.log('Data analysis:', dataAnalysis);

    // Group data by vehicle
    const dataByVehicle = trackingData.reduce((acc, packet) => {
      if (!acc[packet.vehicle_reg_no]) {
        acc[packet.vehicle_reg_no] = [];
      }
      acc[packet.vehicle_reg_no].push(packet);
      return acc;
    }, {});

    // Define condition functions
    const getStoppageCondition = (packet, conditionType) => {
      const hasValidIgnition = packet.ignition !== null && packet.ignition !== undefined;
      const hasValidSpeed = packet.speed_kmh !== null && packet.speed_kmh !== undefined;

      switch (conditionType) {
        case 'ignition_off_speed_zero':
          return hasValidIgnition && hasValidSpeed && packet.ignition === false && packet.speed_kmh === 0;
        case 'speed_zero_only':
          return hasValidSpeed && packet.speed_kmh === 0;
        case 'ignition_off_only':
          return hasValidIgnition && packet.ignition === false;
        case 'ignition_on_speed_zero':
          return hasValidIgnition && hasValidSpeed && packet.ignition === true && packet.speed_kmh === 0;
        default:
          return hasValidIgnition && hasValidSpeed && packet.ignition === false && packet.speed_kmh === 0;
      }
    };

    // Auto-select best condition if 'auto' is specified
    let finalCondition = condition;
    if (condition === 'auto') {
      if (dataAnalysis.ignitionOffSpeedZero > 0) {
        finalCondition = 'ignition_off_speed_zero';
      } else if (dataAnalysis.speedZeroOnly > 0) {
        finalCondition = 'speed_zero_only';
      } else if (dataAnalysis.ignitionOffOnly > 0) {
        finalCondition = 'ignition_off_only';
      } else if (dataAnalysis.ignitionOnSpeedZero > 0) {
        finalCondition = 'ignition_on_speed_zero';
      } else {
        finalCondition = 'ignition_off_speed_zero'; // Default fallback
      }
    }

    console.log(`Using condition: ${finalCondition}`);

    const detailedReportList = [];
    let totalStoppagesFound = 0;

    // Process each vehicle
    for (const vehicle of vehicles) {
      const packets = dataByVehicle[vehicle.vehicleNumber] || [];
      console.log(`Processing vehicle ${vehicle.vehicleNumber}: ${packets.length} packets`);
      
      if (packets.length === 0) continue;

      // Get IMEI from tracking data
      const imeiNumber = packets.find(p => p.imei)?.imei || 'N/A';

      let isStopped = false;
      let stopStartTime = null;
      let stopStartLocation = null;
      let vehicleStoppages = 0;

      for (let i = 0; i < packets.length; i++) {
        const currentPacket = packets[i];
        
        const conditionMet = getStoppageCondition(currentPacket, finalCondition);

        if (!isStopped && conditionMet) {
          // Start of stoppage
          isStopped = true;
          stopStartTime = currentPacket.timestamp;
          stopStartLocation = {
            latitude: currentPacket.latitude || 0,
            longitude: currentPacket.longitude || 0,
          };
        } else if (isStopped && !conditionMet) {
          // End of stoppage
          isStopped = false;
          const stopEndTime = currentPacket.timestamp;
          const duration = differenceInMilliseconds(stopEndTime, stopStartTime);

          if (duration >= minStoppageDurationMs) {
            vehicleStoppages++;
            
            // Get location with rate limiting
            let locationName = 'Location not available';
            if (stopStartLocation.latitude !== 0 && stopStartLocation.longitude !== 0) {
              try {
                locationName = await reverseGeocode(stopStartLocation.latitude, stopStartLocation.longitude);
                // Add delay to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (error) {
                locationName = `${stopStartLocation.latitude}, ${stopStartLocation.longitude}`;
              }
            }

            detailedReportList.push({
              zoneRegion: vehicle.regionZone?.name || 'N/A',
              depotCustomer: vehicle.depotCustomer?.depotCustomer || 'N/A',
              vehicleNumber: vehicle.vehicleNumber,
              imeiNumber: imeiNumber,
              serviceType: vehicle.serviceType?.name || 'N/A',
              ownerType: vehicle.ownerType || 'N/A',
              stoppageStartTime: formatDateTimeForReport(stopStartTime),
              stoppageEndTime: formatDateTimeForReport(stopEndTime),
              totalStoppageDuration: formatDuration(duration),
              stoppageLocation: locationName,
              coordinates: {
                latitude: stopStartLocation.latitude,
                longitude: stopStartLocation.longitude
              },
              conditionUsed: finalCondition
            });
          }
        }
      }
      
      // Handle ongoing stoppages (vehicle still stopped at end of period)
      if (isStopped && packets.length > 0) {
        const lastPacketTime = packets[packets.length - 1].timestamp;
        const duration = differenceInMilliseconds(lastPacketTime, stopStartTime);
        
        if (duration >= minStoppageDurationMs) {
          vehicleStoppages++;
          
          let locationName = 'Location not available';
          if (stopStartLocation.latitude !== 0 && stopStartLocation.longitude !== 0) {
            try {
              locationName = await reverseGeocode(stopStartLocation.latitude, stopStartLocation.longitude);
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              locationName = `${stopStartLocation.latitude}, ${stopStartLocation.longitude}`;
            }
          }

          detailedReportList.push({
            zoneRegion: vehicle.regionZone?.name || 'N/A',
            depotCustomer: vehicle.depotCustomer?.depotCustomer || 'N/A',
            vehicleNumber: vehicle.vehicleNumber,
            imeiNumber: imeiNumber,
            serviceType: vehicle.serviceType?.name || 'N/A',
            ownerType: vehicle.ownerType || 'N/A',
            stoppageStartTime: formatDateTimeForReport(stopStartTime),
            stoppageEndTime: formatDateTimeForReport(lastPacketTime),
            totalStoppageDuration: formatDuration(duration),
            stoppageLocation: locationName,
            coordinates: {
              latitude: stopStartLocation.latitude,
              longitude: stopStartLocation.longitude
            },
            isOngoing: true,
            conditionUsed: finalCondition
          });
        }
      }

      totalStoppagesFound += vehicleStoppages;
      console.log(`Vehicle ${vehicle.vehicleNumber}: Found ${vehicleStoppages} stoppages`);
    }

    console.log(`Total stoppages found: ${totalStoppagesFound}`);

    if (detailedReportList.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No stoppage activity found for more than ${stoppageDuration} minutes using condition '${finalCondition}'.`,
        debug: {
          vehiclesFound: vehicles.length,
          trackingPacketsFound: trackingData.length,
          conditionUsed: finalCondition,
          dataAnalysis: dataAnalysis,
          suggestions: [
            dataAnalysis.ignitionOffSpeedZero > 0 ? 'Try condition=ignition_off_speed_zero' : null,
            dataAnalysis.speedZeroOnly > 0 ? 'Try condition=speed_zero_only' : null,
            dataAnalysis.ignitionOffOnly > 0 ? 'Try condition=ignition_off_only' : null,
            dataAnalysis.ignitionOnSpeedZero > 0 ? 'Try condition=ignition_on_speed_zero' : null
          ].filter(Boolean)
        }
      });
    }

    // Sort results by vehicle number and then by stoppage start time
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
      
      return parseFormattedDate(a.stoppageStartTime) - parseFormattedDate(b.stoppageStartTime);
    });

    // Calculate summary statistics
    const totalStoppageTime = detailedReportList.reduce((sum, record) => {
      const [hours, minutes, seconds] = record.totalStoppageDuration.split(':').map(Number);
      return sum + (hours * 3600 + minutes * 60 + seconds) * 1000;
    }, 0);

    const uniqueVehicles = new Set(detailedReportList.map(record => record.vehicleNumber));
    const dateRangeMs = differenceInMilliseconds(end, start);

    // Prepare final response
    res.status(200).json({
      success: true,
      message: 'Stoppage detailed report generated successfully.',
      conditionUsed: finalCondition,
      filters: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        minDurationMinutes: stoppageDurationNum,
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
        totalStoppageTime: formatDuration(totalStoppageTime),
        averageStoppagePerVehicle: uniqueVehicles.size > 0 ? 
          Math.round((detailedReportList.length / uniqueVehicles.size) * 100) / 100 : 0,
        ongoingStoppages: detailedReportList.filter(record => record.isOngoing).length,
        dataAnalysis: dataAnalysis
      },
      data: detailedReportList
    });

  } catch (error) {
    console.error('Error generating stoppage detailed report:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
