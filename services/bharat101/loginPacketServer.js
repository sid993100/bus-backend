import LoginPacket from "../../models/loginPacketModel.js"


export const addLoginPacket = async (req, res) => {
  try {
    const {data} = req.body;
    console.log(".........................",data);
    

    // Validate required fields based on the flat structure
    if (!data.header || !data.vendor_id || !data.vehicle_reg_no || !data.imei) {
      return res.status(400).json({
        success: false,
        error: "Required fields missing: header, vendor_id, vehicle_reg_no, imei",
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

   

    // Create login packet with flat structure
    const loginPacketData = {
      protocol: data.protocol || 'BHARAT_101',
      packet_type: data.packet_type || 'login',
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      raw_data: data.raw_data || '',
      
      // Login packet fields matching the image format
      start_character: data.start_character || '$',
      header: data.header,
      vendor_id: data.vendor_id,
      vehicle_reg_no: data.vehicle_reg_no,
      imei: data.imei,
      firmware_version: data.firmware_version || '',
      protocol_version: data.protocol_version || 'AIS140',
      latitude: parseFloat(data.latitude) || 0,
      latitude_dir: data.latitude_dir || 'N',
      longitude: parseFloat(data.longitude) || 0,
      longitude_dir: data.longitude_dir || 'E',
      checksum_separator: data.checksum_separator || '*',
      checksum: data.checksum || null
    };

    const loginPacket = new LoginPacket(loginPacketData);
    const savedPacket = await loginPacket.save();

    res.status(201).json({
      success: true,
      message: "Login packet created successfully",
      data: {
        id: savedPacket._id,
        imei: savedPacket.imei,
        vehicle_reg_no: savedPacket.vehicle_reg_no,
        vendor_id: savedPacket.vendor_id,
        firmware_version: savedPacket.firmware_version,
        protocol_version: savedPacket.protocol_version,
        location: savedPacket.location,
        timestamp: savedPacket.timestamp,
        createdAt: savedPacket.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating login packet:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `Duplicate ${field} detected`,
        code: 'DUPLICATE_ERROR',
        field: field
      });
    }

    // Handle cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: `Invalid ${error.path}: ${error.value}`,
        code: 'CAST_ERROR'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
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

