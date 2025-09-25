import consoleManager from '../../../utils/consoleManager.js';
import responseManager from '../../../utils/responseManager.js';
import Driver from "../../../models/driverModel.js";

// Helper: uniform error response
const sendError = (res, status, message) => res.status(status).json({ error: message });

// **ADDED: Population fields configuration**
const populationFields = [
  { path: 'departmentSection', select: 'accountName accountCode' },
  { path: 'zoneRegion', select: 'name code communicationAddress' },
  { path: 'depotCustomer', select: 'depotCustomer depotCode location' },
  { path: 'employment', select: 'employmentType description' },
  { path: 'photoIdCardType', select: 'cardType description' }
];

// **ENHANCED: Age validation helper**
const validateAge = (dateOfBirth) => {
  if (!dateOfBirth) return { isValid: false, age: null, message: 'Date of birth is required' };
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, age: null, message: 'Invalid date format' };
  }
  
  // Check if birth date is in future
  if (birthDate > today) {
    return { isValid: false, age: null, message: 'Date of birth cannot be in the future' };
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age < 18) {
    return { isValid: false, age, message: `Driver must be at least 18 years old. Current age: ${age}` };
  }
  
  if (age > 70) {
    return { isValid: false, age, message: `Driver age cannot exceed 70 years. Current age: ${age}` };
  }
  
  return { isValid: true, age, message: null };
};

// CREATE Driver with age validation
export const addDriver = async (req, res) => {
  try {
    const payload = req.body;

    // Basic safeguard
    if (!payload || Object.keys(payload).length === 0) {
      return responseManager.badRequest(res, 'Driver data is required');
    }

    // **ADDED: Age validation before creating**
    if (payload.dateOfBirth) {
      const ageValidation = validateAge(payload.dateOfBirth);
      if (!ageValidation.isValid) {
        return responseManager.badRequest(res, ageValidation.message);
      }
    }

    // Duplicate payrollId check
    const existing = await Driver.findOne({ 
      payrollId: payload.payrollId, 
      isDeleted: { $ne: true } 
    }).lean();
    
    if (existing) {
      return responseManager.conflict(res, 'A driver with this Payroll ID already exists');
    }

    // Create record
    const driver = await Driver.create(payload);

    if (!driver) {
      return responseManager.serverError(res, "Something went wrong while creating a driver");
    }

    // **ADDED: Populate the created driver before returning**
    const populatedDriver = await Driver.findById(driver._id)
      .populate(populationFields)
      .lean();

    // Respond
    responseManager.created(res, 'Driver created successfully', populatedDriver);

  } catch (error) {
    consoleManager.error('Error creating driver:', error);

    // Mongo duplicate key error code
    if (error.code === 11000) {
      return responseManager.conflict(res, 'Duplicate key error — payrollId must be unique');
    }

    // **ENHANCED: Better validation error handling**
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return responseManager.badRequest(res, 'Validation failed', validationErrors);
    }

    responseManager.badRequest(res, error.message);
  }
};

// **ENHANCED: GET all Drivers with population**
export const getAllDrivers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      active,
      includeDeleted = 'false',
      minAge,
      maxAge,
      zoneRegion,
      depotCustomer
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filter = {};

    // Soft delete filter
    if (includeDeleted !== 'true') {
      filter.isDeleted = { $ne: true };
    }

    // **ADDED: Region/Depot filters**
    if (zoneRegion) filter.zoneRegion = zoneRegion;
    if (depotCustomer) filter.depotCustomer = depotCustomer;

    // Text search across common fields
    if (search) {
      filter.$or = [
        { driverName: { $regex: search, $options: 'i' } },
        { payrollId: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { dlNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // **ADDED: Age-based filtering**
    if (minAge || maxAge) {
      const today = new Date();
      if (minAge) {
        const maxBirthDate = new Date(today.getFullYear() - parseInt(minAge), today.getMonth(), today.getDate());
        filter.dateOfBirth = { ...filter.dateOfBirth, $lte: maxBirthDate };
      }
      if (maxAge) {
        const minBirthDate = new Date(today.getFullYear() - parseInt(maxAge) - 1, today.getMonth(), today.getDate());
        filter.dateOfBirth = { ...filter.dateOfBirth, $gt: minBirthDate };
      }
    }

    const [items, total] = await Promise.all([
      Driver.find(filter)
        .populate(populationFields) // **ADDED: Population**
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Driver.countDocuments(filter)
    ]);

    // **ADDED: Calculate age for each driver**
    const itemsWithAge = items.map(driver => ({
      ...driver,
      age: driver.dateOfBirth ? new Date().getFullYear() - new Date(driver.dateOfBirth).getFullYear() : null
    }));

    res.status(200).json({
      success: true,
      data: itemsWithAge,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    responseManager.serverError(res, error.message);
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
