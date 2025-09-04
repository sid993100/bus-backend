import Duty from "../../../models/dutyModel.js";

export const getDuty = async (req, res) => {
    try {
        const duty = await Duty.find({})
            .populate('conductorName', 'name')
            .populate('driverName', 'name')
            .populate('supportDriver', 'name')
            .sort({ createdAt: -1 });
            
        if (!duty ) {
            return res.status(404).json({
                message: "Duty Not Found"
            });
        }
        return res.status(200).json({
            message: duty
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

export const addDuty = async (req, res) => {
  try {
    const {
      dutyDate,
      vehicleNumber,
      conductorName,
      driverName,
      supportDriver,
      dutyType = "SCHEDULED",
      scheduleNumber,
      dutyNumber,
      serviceType,
      scheduledKM,
      scheduledTrips,
      nightOuts,
      accountStatus = "PENDING",
      creationDate
    } = req.body;

    // Basic required field validation
    if (!dutyDate || !vehicleNumber || !conductorName || !driverName || 
        !dutyNumber || !serviceType || scheduledKM === undefined || 
        scheduledTrips === undefined || nightOuts === undefined) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    // Check for duplicate duty number
    const existingDuty = await Duty.findOne({ 
      dutyNumber: dutyNumber.toUpperCase() 
    });
    if (existingDuty) {
      return res.status(409).json({ 
        message: "Duty number already exists" 
      });
    }

    const duty = await Duty.create({
      dutyDate: new Date(dutyDate),
      vehicleNumber: vehicleNumber.toUpperCase(),
      conductorName,
      driverName,
      supportDriver,
      dutyType: dutyType.toUpperCase(),
      scheduleNumber: scheduleNumber ? scheduleNumber.toUpperCase() : undefined,
      dutyNumber: dutyNumber.toUpperCase(),
      serviceType: serviceType.toUpperCase(),
      scheduledKM,
      scheduledTrips,
      nightOuts,
      accountStatus: accountStatus.toUpperCase(),
      creationDate: creationDate ? new Date(creationDate) : new Date()
    });

    if (!duty) {
      return res.status(500).json({
        message: "Something went wrong while creating duty"
      });
    }

    res.status(201).json({
      message: "created",
      data: duty
    });

  } catch (error) {
    console.log(error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation failed",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry found"
      });
    }

    return res.status(500).json({
      message: "Server Error"
    });
  }
};


export const updateDuty = async (req, res) => {
  try {
    const { id } = req.params;
    
    const {
      dutyDate,
      vehicleNumber,
      conductorName,
      driverName,
      supportDriver,
      dutyType,
      scheduleNumber,
      dutyNumber,
      serviceType,
      scheduledKM,
      scheduledTrips,
      nightOuts,
      accountStatus,
      creationDate
    } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({
        message: "Duty ID is required"
      });
    }

    if (!dutyDate && !vehicleNumber && !conductorName && !driverName && 
        !supportDriver && !dutyType && !scheduleNumber && !dutyNumber && 
        !serviceType && !scheduledKM && !scheduledTrips && !nightOuts && 
        !accountStatus && !creationDate) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    // Find and update
    const updatedDuty = await Duty.findByIdAndUpdate(
      id,
      {
        ...(dutyDate && { dutyDate }),
        ...(vehicleNumber && { vehicleNumber }),
        ...(conductorName && { conductorName }),
        ...(driverName && { driverName }),
        ...(supportDriver && { supportDriver }),
        ...(dutyType && { dutyType }),
        ...(scheduleNumber && { scheduleNumber }),
        ...(dutyNumber && { dutyNumber }),
        ...(serviceType && { serviceType }),
        ...(scheduledKM && { scheduledKM }),
        ...(scheduledTrips && { scheduledTrips }),
        ...(nightOuts && { nightOuts }),
        ...(accountStatus && { accountStatus }),
        ...(creationDate && { creationDate })
      },
      { new: true } // return updated document
    );

    if (!updatedDuty) {
      return res.status(404).json({
        message: "Duty not found"
      });
    }

    res.status(200).json({
      message: "Duty updated successfully",
      data: updatedDuty
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server Error"
    });
  }
};
