import TrackingPacket from "../../../models/trackingPacketModel.js";
import responseManager from "../../../utils/responseManager.js";

export const addTrackingPacket = async (req, res) => {
  const user = req.user;
  const {
    startCharacter,
    header,
    vendorID,
    firmwareVersion,
    packetType,
    messageID,
    packetStatus,
    imei,
    vehicleRegNo,
    gpsFix,
    date,
    time,
    latitude,
    latitudeDirection,
    longitude,
    longitudeDirection,
    speed,
    heading,
    numOfSatellites,
    altitude,
    pdop,
    hdop,
    networkOperator,
    ignitionStatus,
    mainPowerStatus,
    mainInputVoltage,
    internalBattery,
    checksum,
    emergencyStatus,
    tamperAlert,
    gsmSignalStrength,
    mcc,
    mnc,
    lac,
    cellID,
    gsmSignalStrengthNMR1Neighbour,
    lacNMR1Neighbour,
    cellIDNMR1stNeighbour,
    gsmSignalStrengthNMR2ndNeighbour,
    lacNMR2Neighbour,
    cellIDNMR2Neighbour,
    gsmSignalStrengthNMR3Neighbour,
    lacNMR3Neighbour,
    cellIDNMR3Neighbour,
    gsmSignalStrengthNMR4Neighbour,
    lacNMR4Neighbour,
    cellIDNMR4Neighbour,
    digitalInputStatus,
    digitalOutputStatus,
    frameNumber,
    analogInput1,
    analogInput2,
    deltaDistance,
    otaResponse,
    endCharacter,
    checkSum
  } = req.body;
  
  console.log("Tracking packet data:", { header, vendorID, vehicleRegNo, imei, packetType });
  
  
  if (!header || !vendorID || !vehicleRegNo || !imei || !packetType || !messageID || 
      !date || !time || !latitude || !longitude || !checksum) {
    return res.status(400).json({
      message: "All required details must be provided (header, vendorID, vehicleRegNo, imei, packetType, messageID, date, time, latitude, longitude, checksum)"
    });
  }
  
  try {
    const trackingPacket = await TrackingPacket.create({
      startCharacter: startCharacter || '$',
      header,
      vendorID,
      firmwareVersion,
      packetType,
      messageID,
      packetStatus,
      imei,
      vehicleRegNo,
      gpsFix: gpsFix || 'V',
      date,
      time,
      latitude,
      latitudeDirection,
      longitude,
      longitudeDirection,
      speed,
      heading,
      numOfSatellites,
      altitude,
      pdop,
      hdop,
      networkOperator,
      ignitionStatus,
      mainPowerStatus,
      mainInputVoltage,
      internalBattery,
      checksum,
      emergencyStatus,
      tamperAlert,
      gsmSignalStrength,
      mcc,
      mnc,
      lac,
      cellID,
      gsmSignalStrengthNMR1Neighbour,
      lacNMR1Neighbour,
      cellIDNMR1stNeighbour,
      gsmSignalStrengthNMR2ndNeighbour,
      lacNMR2Neighbour,
      cellIDNMR2Neighbour,
      gsmSignalStrengthNMR3Neighbour,
      lacNMR3Neighbour,
      cellIDNMR3Neighbour,
      gsmSignalStrengthNMR4Neighbour,
      lacNMR4Neighbour,
      cellIDNMR4Neighbour,
      digitalInputStatus,
      digitalOutputStatus,
      frameNumber,
      analogInput1,
      analogInput2,
      deltaDistance,
      otaResponse,
      endCharacter,
      checkSum
    });
    
    if (!trackingPacket) {
      return res.status(500).json({
        message: "Something went wrong while creating tracking packet"
      });
    }
    
    res.status(201).json({
      message: "created",
      data: trackingPacket
    });
  } catch (error) {
    console.log(error);
    
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const getTrackingPackets = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      vehicleRegNo, 
      imei, 
      packetType, 
      gpsFix,
      ignitionStatus,
      startDate,
      endDate
    } = req.query;
    
    let filter = {};
    if (vehicleRegNo) filter.vehicleRegNo = new RegExp(vehicleRegNo, 'i');
    if (imei) filter.imei = imei;
    if (packetType) filter.packetType = packetType;
    if (gpsFix) filter.gpsFix = gpsFix;
    if (ignitionStatus) filter.ignitionStatus = ignitionStatus;
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const [trackingPackets, total] = await Promise.all([
      TrackingPacket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TrackingPacket.countDocuments(filter)
    ]);
    
    if (!trackingPackets || trackingPackets.length === 0) {
      return res.status(404).json({
        message: "Tracking packets not found"
      });
    }
    
    return res.status(200).json({
      message: trackingPackets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const getTrackingPacketById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Getting tracking packet by ID:", id);
    
    if (!id) {
      return res.status(400).json({
        message: "Tracking packet ID is required"
      });
    }
    
    const trackingPacket = await TrackingPacket.findById(id);
    
    if (!trackingPacket) {
      return res.status(404).json({
        message: "Tracking packet not found"
      });
    }
    
    return res.status(200).json({
      message: trackingPacket
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const getTrackingPacketsByVehicle = async (req, res) => {
  try {
    const { vehicleRegNo } = req.params;
    const { limit = 50, startDate, endDate } = req.query;
    console.log("Getting tracking packets for vehicle:", vehicleRegNo);
    
    if (!vehicleRegNo) {
      return res.status(400).json({
        message: "Vehicle registration number is required"
      });
    }
    
    let filter = { vehicleRegNo: new RegExp(vehicleRegNo, 'i') };
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const trackingPackets = await TrackingPacket.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    if (!trackingPackets || trackingPackets.length === 0) {
      return res.status(404).json({
        message: "No tracking packets found for this vehicle"
      });
    }
    
    return res.status(200).json({
      message: trackingPackets
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const getLatestLocationByVehicle = async (req, res) => {
  try {
    const { vehicleRegNo } = req.params;
    console.log("Getting latest location for vehicle:", vehicleRegNo);
    
    if (!vehicleRegNo) {
      return res.status(400).json({
        message: "Vehicle registration number is required"
      });
    }
    
    const latestPacket = await TrackingPacket.findOne({ 
      vehicleRegNo: new RegExp(vehicleRegNo, 'i'),
      gpsFix: 'A' // Only valid GPS fixes
    })
    .sort({ createdAt: -1 })
    .select('vehicleRegNo imei latitude longitude latitudeDirection longitudeDirection location speed heading ignitionStatus createdAt parsedDateTime');
    
    if (!latestPacket) {
      return res.status(404).json({
        message: "No recent location data found for this vehicle"
      });
    }
    
    return res.status(200).json({
      message: latestPacket
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const getVehicleRoute = async (req, res) => {
  try {
    const { vehicleRegNo } = req.params;
    const { startDate, endDate } = req.query;
    console.log("Getting route for vehicle:", vehicleRegNo);
    
    if (!vehicleRegNo) {
      return res.status(400).json({
        message: "Vehicle registration number is required"
      });
    }
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Start date and end date are required"
      });
    }
    
    const routeData = await TrackingPacket.find({
      vehicleRegNo: new RegExp(vehicleRegNo, 'i'),
      gpsFix: 'A',
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .select('latitude longitude location speed heading ignitionStatus createdAt parsedDateTime')
    .sort({ createdAt: 1 });
    
    if (!routeData || routeData.length === 0) {
      return res.status(404).json({
        message: "No route data found for the specified period"
      });
    }
    
    return res.status(200).json({
      message: routeData
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const bulkAddTrackingPackets = async (req, res) => {
  const user = req.user;
  const { trackingPackets } = req.body;
  console.log("Bulk adding tracking packets:", trackingPackets?.length);
  
  if (user.hierarchy !== "ADMIN") {
    return responseManager.unauthorized(res, "not admin");
  }
  
  if (!trackingPackets || !Array.isArray(trackingPackets) || trackingPackets.length === 0) {
    return res.status(400).json({
      message: "Please provide an array of tracking packets"
    });
  }
  
  try {
    const createdTrackingPackets = await TrackingPacket.insertMany(
      trackingPackets, 
      { ordered: false }
    );
    
    res.status(201).json({
      message: `${createdTrackingPackets.length} tracking packets created successfully`,
      data: createdTrackingPackets
    });
  } catch (error) {
    console.log(error);
    
    return res.status(500).json({
      message: "Server Error",
      details: error.writeErrors || []
    });
  }
};

export const processTrackingPacket = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Processing tracking packet:", id);
    
    if (!id) {
      return res.status(400).json({
        message: "Tracking packet ID is required"
      });
    }
    
    const processedTrackingPacket = await TrackingPacket.findByIdAndUpdate(
      id,
      { isProcessed: true },
      { new: true }
    );
    
    if (!processedTrackingPacket) {
      return res.status(404).json({
        message: "Tracking packet not found"
      });
    }
    
    res.status(200).json({
      message: "Tracking packet processed successfully",
      data: processedTrackingPacket
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const getTrackingPacketStats = async (req, res) => {
  try {
    const stats = await TrackingPacket.aggregate([
      {
        $group: {
          _id: null,
          totalPackets: { $sum: 1 },
          validGPSFixes: {
            $sum: { $cond: [{ $eq: ["$gpsFix", "A"] }, 1, 0] }
          },
          invalidGPSFixes: {
            $sum: { $cond: [{ $eq: ["$gpsFix", "V"] }, 1, 0] }
          },
          ignitionOnPackets: {
            $sum: { $cond: [{ $eq: ["$ignitionStatus", "ON"] }, 1, 0] }
          },
          ignitionOffPackets: {
            $sum: { $cond: [{ $eq: ["$ignitionStatus", "OFF"] }, 1, 0] }
          },
          processedPackets: {
            $sum: { $cond: ["$isProcessed", 1, 0] }
          },
          uniqueVehicles: { $addToSet: "$vehicleRegNo" },
          uniqueIMEIs: { $addToSet: "$imei" },
          avgSpeed: { $avg: { $toDouble: "$speed" } },
          maxSpeed: { $max: { $toDouble: "$speed" } }
        }
      },
      {
        $project: {
          _id: 0,
          totalPackets: 1,
          validGPSFixes: 1,
          invalidGPSFixes: 1,
          ignitionOnPackets: 1,
          ignitionOffPackets: 1,
          processedPackets: 1,
          unprocessedPackets: { $subtract: ["$totalPackets", "$processedPackets"] },
          uniqueVehiclesCount: { $size: "$uniqueVehicles" },
          uniqueIMEIsCount: { $size: "$uniqueIMEIs" },
          avgSpeed: { $round: ["$avgSpeed", 2] },
          maxSpeed: 1,
          gpsValidityRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$validGPSFixes", "$totalPackets"] },
                  100
                ]
              },
              2
            ]
          }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalPackets: 0,
      validGPSFixes: 0,
      invalidGPSFixes: 0,
      ignitionOnPackets: 0,
      ignitionOffPackets: 0,
      processedPackets: 0,
      unprocessedPackets: 0,
      uniqueVehiclesCount: 0,
      uniqueIMEIsCount: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      gpsValidityRate: 0
    };
    
    return res.status(200).json({
      message: result
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const getNearbyVehicles = async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query;
    console.log("Getting nearby vehicles:", { lat, lng, radius });
    
    if (!lat || !lng) {
      return res.status(400).json({
        message: "Latitude and longitude are required"
      });
    }
    
    const nearbyVehicles = await TrackingPacket.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(radius),
          spherical: true,
          query: { gpsFix: 'A' }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$vehicleRegNo',
          latestData: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestData' }
      },
      {
        $project: {
          vehicleRegNo: 1,
          imei: 1,
          latitude: 1,
          longitude: 1,
          location: 1,
          speed: 1,
          heading: 1,
          ignitionStatus: 1,
          distance: 1,
          createdAt: 1
        }
      }
    ]);
    
    return res.status(200).json({
      message: nearbyVehicles
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};
