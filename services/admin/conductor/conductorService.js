import mongoose from "mongoose";
import Conductor from "../../../models/conductorModel.js";
import validateAge from "../../../utils/valideAge.js";
import responseManager from "../../../utils/responseManager.js";

// **ADDED: Population fields configuration**
const populationFields = [
  { path: 'departmentSection', select: 'account accountCode' },
  { path: 'zoneRegion', select: 'name code ' },
  { path: 'depotCustomer', select: 'depotCustomer code ' },
  { path: 'employment', select: 'name' },
  { path: 'photoIdCard', select: 'name' }
];

// **ENHANCED: GET all conductors with population and filtering**
export const getConductor = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    const [conductors, total] = await Promise.all([
      Conductor.find({})
        .populate(populationFields)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Conductor.countDocuments({})
    ]);

    res.status(200).json({
      success: true,
      data: conductors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// **ENHANCED: Add conductor with proper validation and population**
export const addConductor = async (req, res) => {
  try {
    const {
      payrollId,
      departmentSection,
      zoneRegion,
      depotCustomer,
      conductorName, // **CHANGED: Fixed field name**
      gender,
      mobileNumber,
      employment,
      dateOfBirth,
      fatherName,
      photoIdCard,
      idCardNumber,
      localAddress,
      permanentAddress,
      clNumber,
      clExpiryDate,
      emergencyContactNumber
    } = req.body;

    // **ENHANCED: Validate required fields**
    if (!payrollId || !conductorName || !gender || !mobileNumber || !employment || !dateOfBirth || !fatherName) {
      return res.status(400).json({
        success: false,
        message: "payrollId, conductorName, gender, mobileNumber, employment, dateOfBirth, and fatherName are required"
      });
    }

    // **ADDED: Age validation**
    if (dateOfBirth) {
      const ageValidation = validateAge(dateOfBirth);
      if (!ageValidation.isValid) {
        return responseManager.badRequest(res, ageValidation.message);
      }
    }

    // **ADDED: Check for duplicate payrollId**
    const existingConductor = await Conductor.findOne({ 
      payrollId: payrollId.toUpperCase(), 
      isDeleted: { $ne: true } 
    }).lean();
    
    if (existingConductor) {
      return res.status(409).json({
        success: false,
        message: "A conductor with this Payroll ID already exists"
      });
    }

    // **ADDED: Validate mobile number format**
    if (!/^[0-9]{10,15}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be 10-15 digits"
      });
    }

    // Create conductor
    const conductor = await Conductor.create({
      payrollId: payrollId.toUpperCase(),
      departmentSection,
      zoneRegion,
      depotCustomer,
      conductorName: conductorName.toUpperCase(),
      gender: gender.toUpperCase(),
      mobileNumber,
      employment,
      dateOfBirth,
      fatherName: fatherName.toUpperCase(),
      photoIdCard,
      idCardNumber: idCardNumber?.toUpperCase(),
      localAddress: localAddress?.toUpperCase(),
      permanentAddress: permanentAddress?.toUpperCase(),
      clNumber: clNumber?.toUpperCase(),
      clExpiryDate,
      emergencyContactNumber
    });

    // **ADDED: Populate the created conductor**
    const populatedConductor = await Conductor.findById(conductor._id)
      .populate(populationFields)
      .lean();

    res.status(201).json({
      success: true,
      message: "Conductor created successfully",
      data: populatedConductor
    });
  } catch (error) {
    console.error('Error creating conductor:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate key error - Payroll ID must be unique"
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// **ENHANCED: Update conductor with validation and population**
export const updateConductor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Conductor ID format"
      });
    }

    // Check if at least one field is provided
    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update"
      });
    }

    // **ADDED: Age validation if dateOfBirth is being updated**
    if (updates.dateOfBirth) {
      const ageValidation = validateAge(updates.dateOfBirth);
      if (!ageValidation.isValid) {
        return responseManager.badRequest(res, ageValidation.message);
      }
    }

    // **ADDED: Transform fields to uppercase where needed**
    if (updates.conductorName) updates.conductorName = updates.conductorName.toUpperCase();
    if (updates.gender) updates.gender = updates.gender.toUpperCase();
    if (updates.fatherName) updates.fatherName = updates.fatherName.toUpperCase();
    if (updates.payrollId) updates.payrollId = updates.payrollId.toUpperCase();
    if (updates.idCardNumber) updates.idCardNumber = updates.idCardNumber.toUpperCase();
    if (updates.localAddress) updates.localAddress = updates.localAddress.toUpperCase();
    if (updates.permanentAddress) updates.permanentAddress = updates.permanentAddress.toUpperCase();
    if (updates.clNumber) updates.clNumber = updates.clNumber.toUpperCase();

    // **ADDED: Validate mobile number if being updated**
    if (updates.mobileNumber && !/^[0-9]{10,15}$/.test(updates.mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be 10-15 digits"
      });
    }

    // Perform update
    const updatedConductor = await Conductor.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      updates,
      { new: true, runValidators: true }
    ).populate(populationFields);

    if (!updatedConductor) {
      return res.status(404).json({
        success: false,
        message: "Conductor not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Conductor updated successfully",
      data: updatedConductor
    });
  } catch (error) {
    console.error('Error updating conductor:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate key error - Payroll ID must be unique"
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};


// **NEW: Soft delete conductor**
export const deleteConductor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Conductor ID format"
      });
    }

    const conductor = await Conductor.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!conductor) {
      return res.status(404).json({
        success: false,
        message: "Conductor not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Conductor deleted successfully",
      id: conductor._id
    });
  } catch (error) {
    console.error('Error deleting conductor:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// **NEW: Get conductors by region**
export const getConductorsByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;

    const conductors = await Conductor.find({
      zoneRegion: regionId,
      isDeleted: { $ne: true }
    })
    .populate(populationFields)
    .sort({ conductorName: 1 })
    .lean();

    const conductorsWithAge = conductors.map(conductor => ({
      ...conductor,
      age: conductor.dateOfBirth ? 
        new Date().getFullYear() - new Date(conductor.dateOfBirth).getFullYear() : null
    }));

    res.status(200).json({
      success: true,
      message: "Conductors retrieved successfully for region",
      data: conductorsWithAge,
      count: conductorsWithAge.length
    });
  } catch (error) {
    console.error('Error fetching conductors by region:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

// **NEW: Get conductors by depot**
export const getConductorsByDepot = async (req, res) => {
  try {
    const { depotId } = req.params;

    const conductors = await Conductor.find({
      depotCustomer: depotId,
      isDeleted: { $ne: true }
    })
    .populate(populationFields)
    .sort({ conductorName: 1 })
    .lean();

    const conductorsWithAge = conductors.map(conductor => ({
      ...conductor,
      age: conductor.dateOfBirth ? 
        new Date().getFullYear() - new Date(conductor.dateOfBirth).getFullYear() : null
    }));

    res.status(200).json({
      success: true,
      message: "Conductors retrieved successfully for depot",
      data: conductorsWithAge,
      count: conductorsWithAge.length
    });
  } catch (error) {
    console.error('Error fetching conductors by depot:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};
