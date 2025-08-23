import LoginPacket from "../../models/loginPacketModel.js"


export const addLoginPacket = async (req, res) => {
  const user = req.user;
  const {
    startCharacter,
    header,
    vendorID,
    vehicleRegNo,
    imei,
    firmwareVersion,
    protocolVersion,
    latitude,
    latitudeDirection,
    longitude,
    longitudeDirection,
    checksumSeparator,
    checksum
  } = req.body;
  
 
  if (!header || !vendorID || !vehicleRegNo || !imei || !latitude || !longitude || !checksum) {
    return res.status(400).json({
      message: "All required details must be provided (header, vendorID, vehicleRegNo, imei, latitude, longitude, checksum)"
    });
  }
  
  try {
    const loginPacket = await LoginPacket.create({
      startCharacter: startCharacter || '$',
      header,
      vendorID,
      vehicleRegNo,
      imei,
      firmwareVersion,
      protocolVersion,
      latitude,
      latitudeDirection,
      longitude,
      longitudeDirection,
      checksumSeparator: checksumSeparator || '*',
      checksum
    });
    
    if (!loginPacket) {
      return res.status(500).json({
        message: "Something went wrong while creating login packet"
      });
    }
    
    res.status(201).json({
      message: "created",
      data: loginPacket
    });
  } catch (error) {
    console.log(error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: "IMEI already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const getLoginPackets = async (req, res) => {
  try {
    const { page = 1, limit = 10, vehicleRegNo, imei, status } = req.query;
    
    let filter = {};
    if (vehicleRegNo) filter.vehicleRegNo = new RegExp(vehicleRegNo, 'i');
    if (imei) filter.imei = imei;
    if (status) filter.status = status;
    
    const skip = (page - 1) * limit;
    
    const [loginPackets, total] = await Promise.all([
      LoginPacket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LoginPacket.countDocuments(filter)
    ]);
    
    if (!loginPackets || loginPackets.length === 0) {
      return res.status(404).json({
        message: "Login packets not found"
      });
    }
    
    return res.status(200).json({
      message: loginPackets,
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

export const getLoginPacketById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Getting login packet by ID:", id);
    
    if (!id) {
      return res.status(400).json({
        message: "Login packet ID is required"
      });
    }
    
    // Try to find by ID first, then by IMEI
    let loginPacket = await LoginPacket.findById(id);
    
    if (!loginPacket) {
      loginPacket = await LoginPacket.findOne({ imei: id });
    }
    
    if (!loginPacket) {
      return res.status(404).json({
        message: "Login packet not found"
      });
    }
    
    return res.status(200).json({
      message: loginPacket
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const getLoginPacketsByVehicle = async (req, res) => {
  try {
    const { vehicleRegNo } = req.params;
    console.log("Getting login packets for vehicle:", vehicleRegNo);
    
    if (!vehicleRegNo) {
      return res.status(400).json({
        message: "Vehicle registration number is required"
      });
    }
    
    const loginPackets = await LoginPacket.find({ 
      vehicleRegNo: new RegExp(vehicleRegNo, 'i') 
    }).sort({ createdAt: -1 });
    
    if (!loginPackets || loginPackets.length === 0) {
      return res.status(404).json({
        message: "No login packets found for this vehicle"
      });
    }
    
    return res.status(200).json({
      message: loginPackets
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const getLoginPacketsByIMEI = async (req, res) => {
  try {
    const { imei } = req.params;
    console.log("Getting login packets for IMEI:", imei);
    
    if (!imei) {
      return res.status(400).json({
        message: "IMEI is required"
      });
    }
    
    const loginPackets = await LoginPacket.find({ imei })
      .sort({ createdAt: -1 });
    
    if (!loginPackets || loginPackets.length === 0) {
      return res.status(404).json({
        message: "No login packets found for this IMEI"
      });
    }
    
    return res.status(200).json({
      message: loginPackets
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const processLoginPacket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log("Processing login packet:", id, status);
    
    if (!id) {
      return res.status(400).json({
        message: "Login packet ID is required"
      });
    }
    
    if (!status || !['SUCCESS', 'FAILED', 'PENDING'].includes(status)) {
      return res.status(400).json({
        message: "Valid status is required (SUCCESS, FAILED, PENDING)"
      });
    }
    
    const processedLoginPacket = await LoginPacket.findByIdAndUpdate(
      id,
      { 
        isProcessed: true,
        status: status
      },
      { new: true }
    );
    
    if (!processedLoginPacket) {
      return res.status(404).json({
        message: "Login packet not found"
      });
    }
    
    res.status(200).json({
      message: "Login packet processed successfully",
      data: processedLoginPacket
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

