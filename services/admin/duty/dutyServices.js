import { isValidObjectId } from "mongoose";
import Duty from "../../../models/dutyModel.js";


export const getDuty = async (req, res) => {
  try {
    const { pageNum, limitNum, skip, sort, textFilter } = buildDutyQueryParams(req);

    const filter = { ...textFilter };

    // Fetch duties and count in parallel for better performance
    const [items, total] = await Promise.all([
      Duty.find(filter)
        .populate(dutyPopulate)
        .populate({
          path: 'scheduleNumber',
          select: 'scheduleLabel depot seatLayout busService trips startDate endDate cycleDay scheduleKm',
          populate: [
            { path: 'depot', select: 'depotCustomer depotCode region' },
            { path: 'seatLayout', select: 'layoutName totalSeats seatConfiguration' },
            { path: 'busService', select: 'name serviceType fare' },
            {
              path: 'trips.trip',
              select: 'tripId origin destination originTime destinationTime cycleDay day status route',
              populate: {
                path: 'route',
                select: 'routeName routeCode routeLength source destination'
              }
            }
          ]
        })
        .sort(sort || { createdAt: -1 })  // Latest first by default
        .skip(skip)
        .limit(limitNum),
      Duty.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    // Handle empty results
    if (!items || items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No duties found',
        data: [],
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total || 0,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      });
    }

    // Return successful response with data
    return res.status(200).json({
      success: true,
      message: 'Duties retrieved successfully',
      data: items,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching duties:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};



const dutyPopulate = [
  { path: "conductorName", select: "driverName" },
  { path: "driverName", select: "driverName" },
  { path: "supportDriver", select: "driverName" },
  {path: "route", select: "routeName" },
  {path: "scheduleNumber", select: "scheduleLabel scheduleKm trips " }
];

function buildDutyQueryParams(req) {
  const {
    page = "1",
    limit = "20",
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = Math.max(parseInt(limit, 10), 1);
  const skip = (pageNum - 1) * limitNum;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  // Adjust text fields per Duty schema (examples: dutyNumber, remarks)
  const textFilter = search
    ? {
        $or: [
          { dutyNumber: { $regex: search, $options: "i" } },
          { remarks: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  return { pageNum, limitNum, skip, sort, textFilter };
}


export const getDutyByDepot = async (req, res) => {
  try {
    const { depotId } = req.params;
    if (!isValidObjectId(depotId)) {
      return res.status(400).json({ success: false, message: "Invalid depot ID" });
    }

    const { pageNum, limitNum, skip, sort, textFilter } = buildDutyQueryParams(req);

    // Assuming 'depot' field on Duty references the Depot model
    const filter = { depot: depotId, ...textFilter };

    const [items, total] = await Promise.all([
      Duty.find(filter).populate(dutyPopulate)
      .populate('depot', 'depotName depotCode')
      .populate('seatLayout', 'layoutName totalSeats')
      .populate('busService', 'serviceName serviceType')
      .populate({
        path: "trips.trip",
        populate: { path: "route", select: "routeName routeCode routeLength source destination" }
      })
      .populate("route.routeName")
      .sort(sort ||{createdAt:-1}).skip(skip).limit(limitNum),
      Duty.countDocuments(filter),
    ]);

    if (items.length === 0) {
      return res.status(200).json({ success: true, message: "No duties found for depot",data:items });
    }

    const totalPages = Math.ceil(total / limitNum);
    return res.status(200).json({
      success: true,
      message: "Duties retrieved successfully",
      data: items,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: { depotId },
    });
  } catch (error) {
    console.error("Error fetching duties by depot:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

export const getDutyByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;
    if (!isValidObjectId(regionId)) {
      return res.status(400).json({ success: false, message: "Invalid region ID" });
    }

    const { pageNum, limitNum, skip, sort, textFilter } = buildDutyQueryParams(req);

  
    const filter = { region: regionId, ...textFilter };

    const [items, total] = await Promise.all([
      Duty.find(filter).populate(dutyPopulate)
      .populate('depot', 'depotName depotCode')
      .populate('seatLayout', 'layoutName totalSeats')
      .populate('busService', 'serviceName serviceType')
      .populate({
        path: "trips.trip",
        populate: { path: "route", select: "routeName routeCode routeLength source destination" }
      })
      .populate("route.routeName")
      .sort(sort || {createdAt:-1}).skip(skip).limit(limitNum),
      Duty.countDocuments(filter),
    ]);

    if (items.length === 0) {
      return res.status(200).json({ success: true, message: "No duties found for region" , data: items });
    }

    const totalPages = Math.ceil(total / limitNum);
    return res.status(200).json({
      success: true,
      message: "Duties retrieved successfully",
      data: items,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: { regionId },
    });
  } catch (error) {
    console.error("Error fetching duties by region:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};


// addDuty function mein badlav
export const addDuty = async (req, res) => {
  try {
    const {
      data
    } = req.body;

    if (!data.dutyDate || !data.vehicleNumber || !data.conductorName || !data.driverName  ) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    if (existingDuty) {
      return res.status(409).json({ 
        message: "Duty number already exists" 
      });
    }

    // Naya duty create karna
    const newDuty = await Duty.create({
    data
    });

    if(!newDuty){
      return res.status(500).json({
        message: "Failed to create duty"
      });
    } 

    res.status(201).json({
      message: "Duty created successfully",
      data: newDuty 
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
     success: false,
     message:error.message
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