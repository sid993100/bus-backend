import Duty from "../../../models/dutyModel.js";

// Is function mein koi badlav nahi hai
export const getDuty = async (req, res) => {
    try {
        const duties = await Duty.find({})
            .populate('conductorName', 'driverName')
            .populate('driverName', 'driverName')
            .populate('supportDriver', 'driverName')
            .sort({ createdAt: -1 });
            
        if (!duties || duties.length === 0) {
            return res.status(404).json({
                message: "No Duties Found"
            });
        }
        return res.status(200).json({
            message: duties
        });
    } catch (error) {
        console.error("Error fetching duties:", error);
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// addDuty function mein badlav
export const addDuty = async (req, res) => {
  try {
    const {
      dutyDate, vehicleNumber, conductorName, driverName, supportDriver,
      dutyType, scheduleNumber, dutyNumber, serviceType, scheduledKM,
      scheduledTrips, nightOuts, accountStatus
    } = req.body;

    if (!dutyDate || !vehicleNumber || !conductorName || !driverName || 
        !dutyNumber || !serviceType || scheduledKM === undefined || 
        scheduledTrips === undefined || nightOuts === undefined) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    const existingDuty = await Duty.findOne({ 
      dutyNumber: dutyNumber.toUpperCase() 
    });
    if (existingDuty) {
      return res.status(409).json({ 
        message: "Duty number already exists" 
      });
    }

    // Naya duty create karna
    const newDuty = await Duty.create({
      dutyDate: new Date(dutyDate),
      vehicleNumber: vehicleNumber.toUpperCase(),
      conductorName,
      driverName,
      supportDriver,
      dutyType: dutyType ? dutyType.toUpperCase() : 'SCHEDULED',
      scheduleNumber: scheduleNumber ? scheduleNumber.toUpperCase() : undefined,
      dutyNumber: dutyNumber.toUpperCase(),
      serviceType: serviceType.toUpperCase(),
      scheduledKM,
      scheduledTrips,
      nightOuts,
      accountStatus: accountStatus ? accountStatus.toUpperCase() : 'PENDING'
    });

    // Response bhejne se pehle naye duty ko populate karna
    const populatedDuty = await Duty.findById(newDuty._id)
        .populate('conductorName', 'driverName')
        .populate('driverName', 'driverName')
        .populate('supportDriver', 'driverName');

    res.status(201).json({
      message: "Duty created successfully",
      data: populatedDuty // Populated data bhejna
    });

  } catch (error) {
    console.error("Error adding duty:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation failed",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry for Duty Number"
      });
    }

    return res.status(500).json({
      message: "Server Error"
    });
  }
};

// updateDuty function mein badlav
export const updateDuty = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        message: "Duty ID is required"
      });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }
    
    const updateData = { ...req.body };
    // ... (uppercase logic theek hai)

    // Duty ko update karna aur saath hi mein populate karna
    const updatedDuty = await Duty.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('conductorName', 'driverName')
        .populate('driverName', 'driverName')
        .populate('supportDriver', 'driverName');

    if (!updatedDuty) {
      return res.status(404).json({
        message: "Duty not found"
      });
    }

    res.status(200).json({
      message: "Duty updated successfully",
      data: updatedDuty // Populated data bhejna
    });
  } catch (error) {
    console.error("Error updating duty:", error);
    
    if (error.code === 11000) {
        return res.status(409).json({
          message: "Duty number must be unique"
        });
    }
      
    return res.status(500).json({
      message: "Server Error"
    });
  }
};