
import consoleManager from '../../../utils/consoleManager.js';
import responseManager from '../../../utils/responseManager.js';
import Driver from "../../../models/driverModel.js"

// Helper: uniform error response
const sendError = (res, status, message) => res.status(status).json({ error: message })

// CREATE Driver

export const addDriver = async (req, res) => {
  try {
    const payload = req.body;

    // Basic safeguard
    if (!payload || Object.keys(payload).length === 0) {
      return responseManager.badRequest(res,'Driver data is required')
    }

    // Duplicate payrollId check
    const existing = await Driver.findOne({ payrollId: payload.payrollId, isDeleted: { $ne: true } }).lean();
    if (existing) {
      return responseManager.conflict(res,'A driver with this Payroll ID already exists')
    }

    // Create record
    const driver = await Driver.create(payload);

    if(!driver){
        return responseManager.serverError(res,"Somthing went Wrong while Creating A Driver")
    }

    // Respond
   responseManager.created(res,'Driver created successfully',driver);

  } catch (error) {
  
    consoleManager.error('Error creating driver:',error)

    // Mongo duplicate key error code
    if (error.code === 11000) {
    //   return res.status(409).json({ error: 'Duplicate key error — payrollId must be unique' });
      return responseManager.conflict(res,'Duplicate key error — payrollId must be unique')
    }

    // res.status(400).json({ error: error.message });
    responseManager.badRequest(res, error.message)
  }
};

// GET all Drivers (with pagination, filtering, and lean response)
export const getAllDrivers = async (req, res) => {
  try {
    // Query params: page, limit, search, active, includeDeleted
    const {
      page = 1,
      limit = 20,
      search = '',
      active,
      includeDeleted = 'false'
    } = req.query

    const pageNum = Math.max(parseInt(page, 10) || 1, 1)
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100)

    const filter = {}

    // Soft delete filter
    if (includeDeleted !== 'true') {
      filter.isDeleted = { $ne: true }
    }

    // Example boolean filter
    if (typeof active !== 'undefined') {
      filter.active = active === 'true'
    }

    // Text-like search across common fields (adjust to your schema)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } }
      ]
    }

    const [items, total] = await Promise.all([
      Driver.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(), // faster, returns plain objects
      Driver.countDocuments(filter)
    ])

    res.status(200).json({
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    responseManager.serverError(res,error.message)
  }
}

// GET Driver by ID
export const getDriverById = async (req, res) => {
  try {
    const { id } = req.params
    const driver = await Driver.findById(id).lean()
    if (!driver || driver.isDeleted) return sendError(res, 404, 'Driver not found')
    res.status(200).json(driver)
  } catch (error) {
    responseManager.serverError(res,error.message)
  }
}

export const updateDriver = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const driver = await Driver.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      updates,
      {
        new: true,
        runValidators: true
      }
    )

    if (!driver) return sendError(res, 404, 'Driver not found')
    res.status(200).json(driver)
  } catch (error) {
    if (error.code === 11000) {
      return responseManager.conflict(res,'Duplicate key error')
    }
    responseManager.serverError(res,error.message)
  }
}

// SOFT DELETE Driver by ID
export const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params

    // Prefer soft delete to preserve references/history
    const driver = await Driver.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    )

    if (!driver) return sendError(res, 404, 'Driver not found')
    res.status(200).json({ success: true, message: 'Driver deleted (soft)', id: driver._id })
  } catch (error) {
    sendError(res, 400, error.message)
  }
}


