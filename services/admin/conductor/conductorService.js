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
  
    const allConductor = await Conductor.find()
    .populate(populationFields)

    if (!allConductor) {
      return res.status(404).json({
        success: false,
        message: "No conductors found"
      });
    }

    res.status(200).json({
      success: true,
      data: allConductor
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
      driverName,
      gender,
      mobileNumber,
      employment,
      dateOfBirth,
      fatherName,
      departmentSection,
      zoneRegion,
      depotCustomer,
      photoIdCard,
      idCardNumber,
      localAddress,
      permanentAddress,
      clNumber,
      clExpiryDate,
      emergencyContactNumber
    } = req.body;

    // ✅ Only required fields validation
    if (!payrollId || !driverName || !gender || !mobileNumber || !employment || !dateOfBirth || !fatherName) {
      return res.status(400).json({
        success: false,
        message:
          "payrollId, driverName, gender, mobileNumber, employment, dateOfBirth, and fatherName are required",
      });
    }

 // Helper to clean ObjectId fields
const cleanObjectId = (value) => {
  if (!value || value === "") return undefined;
  return value;
};


    const conductor = await Conductor.create({
      payrollId: payrollId.toUpperCase(),
      departmentSection: cleanObjectId(departmentSection),
      zoneRegion: cleanObjectId(zoneRegion),
      depotCustomer: cleanObjectId(depotCustomer),
      driverName: driverName.toUpperCase(),
      gender: gender.toUpperCase(),
      mobileNumber,
      employment: cleanObjectId(employment),
      dateOfBirth,
      fatherName: fatherName.toUpperCase(),
      photoIdCard: cleanObjectId(photoIdCard),
      idCardNumber: idCardNumber?.toUpperCase(),
      localAddress: localAddress?.toUpperCase(),
      permanentAddress: permanentAddress?.toUpperCase(),
      clNumber: clNumber?.toUpperCase(),
      clExpiryDate,
      emergencyContactNumber,
    });

    res.status(201).json({
      success: true,
      message: "Conductor created successfully",
      data: conductor,
    });

  } catch (error) {
    console.error("Error creating conductor:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
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

        const cleanObjectId = (value) => {
          // Normalize falsy or empty-string values to undefined so Mongoose clears them if needed
          if (value === undefined || value === null) return undefined;
          if (typeof value === 'string' && value.trim() === '') return undefined;
          return value;
        };

        // **ADDED: Transform fields to uppercase where needed**
        if (updates.driverName) updates.driverName = String(updates.driverName).toUpperCase();
        // Ensure photoIdCard becomes undefined when empty string; otherwise keep the provided value
        if ('photoIdCard' in updates) updates.photoIdCard = cleanObjectId(updates.photoIdCard);
        if (updates.gender) updates.gender = String(updates.gender).toUpperCase();
        if (updates.fatherName) updates.fatherName = String(updates.fatherName).toUpperCase();
        if (updates.payrollId) updates.payrollId = String(updates.payrollId).toUpperCase();
        if (updates.idCardNumber) updates.idCardNumber = String(updates.idCardNumber).toUpperCase();
        if (updates.localAddress) updates.localAddress = String(updates.localAddress).toUpperCase();
        if (updates.permanentAddress) updates.permanentAddress = String(updates.permanentAddress).toUpperCase();
        if (updates.clNumber) updates.clNumber = String(updates.clNumber).toUpperCase();

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
