import consoleManager from '../../../utils/consoleManager.js';
import responseManager from '../../../utils/responseManager.js';
import Driver from "../../../models/driverModel.js";
import validateAge from '../../../utils/valideAge.js';

// Helper: uniform error response
const sendError = (res, status, message) => res.status(status).json({ error: message });

// **ADDED: Population fields configuration**
const populationFields = [
  { path: 'departmentSection', select: 'account accountCode' },
  { path: 'zoneRegion', select: 'name code communicationAddress' },
  { path: 'depotCustomer', select: 'depotCustomer depotCode location' },
  { path: 'employment', select: 'name' },
  { path: 'photoIdCardType', select: 'name' }
];

// CREATE Driver with age validation
export const addDriver = async (req, res) => {
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
      photoIdCardType,
      idCardNumber,
      localAddress,
      permanentAddress,
      dlNumber,
      dlExpiryDate,
      emergencyContactNumber
    } = req.body;

    // ✅ Only required fields validation
    if (!payrollId || !driverName || !gender || !mobileNumber || !dateOfBirth || !fatherName) {
      return res.status(400).json({
        success: false,
        message: "payrollId, driverName, gender, mobileNumber, dateOfBirth, and fatherName are required",
      });
    }

    // ✅ Clean optional ObjectId fields
    const cleanObjectId = (value) => {
      if (!value || value === "") return undefined;
      return value;
    };

    // ✅ Create driver
    const driver = await Driver.create({
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
      photoIdCardType: cleanObjectId(photoIdCardType),
      idCardNumber: idCardNumber?.toUpperCase(),
      localAddress: localAddress?.toUpperCase(),
      permanentAddress: permanentAddress?.toUpperCase(),
      dlNumber: dlNumber?.toUpperCase(),
      dlExpiryDate,
      emergencyContactNumber,
    });

    res.status(201).json({
      success: true,
      message: "Driver created successfully",
      data: driver,
    });

  } catch (error) {
    console.error("Error creating driver:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate key error — payrollId must be unique",
      });
    }

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


export const getAllDrivers = async (req, res) => {
  try {
    let { page = 1, limit = 20 } = req.query;

    // ✅ Validate numbers
    page = Number.isInteger(+page) && +page > 0 ? +page : 1;
    limit = Number.isInteger(+limit) && +limit > 0 && +limit <= 100 ? +limit : 20;

    const [items, total] = await Promise.all([
      Driver.find()
      .populate(populationFields)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Driver.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// **ENHANCED: GET Driver by ID with population**
export const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const driver = await Driver.findOne({
      _id: id,
      isDeleted: { $ne: true }
    })
    .populate(populationFields)
    .lean();
    
    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    // **ADDED: Calculate age**
    const driverWithAge = {
      ...driver,
      age: driver.dateOfBirth ? new Date().getFullYear() - new Date(driver.dateOfBirth).getFullYear() : null
    };

    res.status(200).json({
      success: true,
      data: driverWithAge
    });
  } catch (error) {
    responseManager.serverError(res, error.message);
  }
};

// **ENHANCED: Update Driver with age validation**
export const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // **ADDED: Age validation if dateOfBirth is being updated**
    if (updates.dateOfBirth) {
      const ageValidation = validateAge(updates.dateOfBirth);
      if (!ageValidation.isValid) {
        return responseManager.badRequest(res, ageValidation.message);
      }
    }

    // Normalize optional ObjectId-like fields: empty string => undefined
    const cleanObjectId = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'string' && value.trim() === '') return undefined;
      return value;
    };

    if ('photoIdCardType' in updates) {
      updates.photoIdCardType = cleanObjectId(updates.photoIdCardType);
    }

    const driver = await Driver.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      updates,
      {
        new: true,
        runValidators: true
      }
    ).populate(populationFields);

    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }

    res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      data: driver
    });
  } catch (error) {
    if (error.code === 11000) {
      return responseManager.conflict(res, 'Duplicate key error');
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return responseManager.badRequest(res, 'Validation failed', validationErrors);
    }
    
    responseManager.serverError(res, error.message);
  }
};

// SOFT DELETE Driver by ID
export const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!driver) {
      return sendError(res, 404, 'Driver not found');
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Driver deleted (soft)', 
      id: driver._id 
    });
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// **NEW: Get drivers by region**
export const getDriversByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;
    
    const drivers = await Driver.find({
      zoneRegion: regionId,
      isDeleted: { $ne: true }
    })
    .populate(populationFields)
    .sort({ driverName: 1 })
    .lean();

    const driversWithAge = drivers.map(driver => ({
      ...driver,
      age: driver.dateOfBirth ? new Date().getFullYear() - new Date(driver.dateOfBirth).getFullYear() : null
    }));

    res.status(200).json({
      success: true,
      data: driversWithAge,
      count: driversWithAge.length
    });
  } catch (error) {
    responseManager.serverError(res, error.message);
  }
};

// **NEW: Get drivers by depot**
export const getDriversByDepot = async (req, res) => {
  try {
    const { depotId } = req.params;
    
    const drivers = await Driver.find({
      depotCustomer: depotId,
      isDeleted: { $ne: true }
    })
    .populate(populationFields)
    .sort({ driverName: 1 })
    .lean();

    const driversWithAge = drivers.map(driver => ({
      ...driver,
      age: driver.dateOfBirth ? new Date().getFullYear() - new Date(driver.dateOfBirth).getFullYear() : null
    }));

    res.status(200).json({
      success: true,
      data: driversWithAge,
      count: driversWithAge.length
    });
  } catch (error) {
    responseManager.serverError(res, error.message);
  }
};
