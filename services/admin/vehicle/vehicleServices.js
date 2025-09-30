import mongoose, { isValidObjectId } from "mongoose";
import Vehicle from "../../../models/vehicleModel.js";

export const getVehicle = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({})
      .populate('seatLayout', 'layoutName')
      .populate('department', 'account accountCode')
      .populate('hierarchy', 'name level description')
      .populate('regionZone', 'name code')
      .populate('depotCustomer', 'depotCustomer depotCode location')
      .populate('serviceType', 'name serviceType fare')
      .populate('vehicleManufacturer', 'make shortName')
      .populate('vehicleType', 'vehicleType')
      .populate('vehicleModel', 'vehicleModel')
      .populate({
        path: 'vltdDevice',
        select: 'imeiNumber iccid simNumber deviceStatus',
        populate: {
          path: 'vlt',
          select: 'manufacturerName modelName version'
        }
      })
      .sort({ vehicleNumber: 1 });

    // Check if vehicles array is empty
    if (!vehicles || vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No vehicles found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully",
      data: vehicles,
      count: vehicles.length
    });

  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};
export const addVehicle = async (req, res) => {
  try {
    
   const {
       department,
      vehicleNumber,
      seatLayout,
      hierarchy,
      regionZone,
      depotCustomer,
      serviceType,
      seatCapacity,
      registrationDate,
      vehicleManufacturer,
      vehicleType,
      vehicleModel,
      ownerType,
      engineNumber,
      chassisNumber,
      manufacturingYear,
      purchaseDate,
      permitName,
      permitDueDate,
      pucDate,
      pucExpiryDate,
      fitness,
      vltdDevice
    } = req.body;

    // Validate required fields
    if (!vehicleNumber || !seatLayout || !ownerType) {
      return res.status(400).json({
        message: "vehicleNumber, seatLayout, ownerType are required"
      });
    }

    // Validate seatLayout ObjectId
    if (!mongoose.Types.ObjectId.isValid(seatLayout)) {
      return res.status(400).json({ message: "Invalid seatLayout ID format" });
    }

    // Create vehicle
    const vehicle = await Vehicle.create({
      department,
      vehicleNumber,
      seatLayout,
      hierarchy,
      regionZone,
      depotCustomer,
      serviceType,
      seatCapacity,
      registrationDate,
      vehicleManufacturer,
      vehicleType,
      vehicleModel,
      ownerType,
      engineNumber,
      chassisNumber,
      manufacturingYear,
      purchaseDate,
      permitName,
      permitDueDate,
      pucDate,
      pucExpiryDate,
      fitness,
      vltdDevice
    });

    res.status(201).json({
      message: "Vehicle created successfully",
      data: vehicle
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate vehicle ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Vehicle ID format" });
    }

    // No update fields case
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    // If seatLayout is provided, validate ObjectId
    if (req.body.seatLayout && !mongoose.Types.ObjectId.isValid(req.body.seatLayout)) {
      return res.status(400).json({ message: "Invalid seatLayout ID format" });
    }

    // Perform update
    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json({
      message: "Vehicle updated successfully",
      data: updatedVehicle
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};

export const getVehiclesByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(regionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid region ID format"
      });
    }

    const vehicles = await Vehicle.find({ regionZone: regionId })
      .populate('seatLayout', 'layoutName')
      .populate('department', 'account accountCode')
      .populate('hierarchy', 'name level description')
      .populate('regionZone', 'name code')
      .populate('depotCustomer', 'depotCustomer depotCode location')
      .populate('serviceType', 'name serviceType fare')
      .populate('vehicleManufacturer', 'make shortName')
      .populate('vehicleType', 'vehicleType')
      .populate('vehicleModel', 'vehicleModel')
      .populate({
        path: 'vltdDevice',
        select: 'imeiNumber iccid simNumber deviceStatus',
        populate: {
          path: 'vlt',
          select: 'manufacturerName modelName version'
        }
      })
      .sort({ vehicleNumber: 1 });

    // Check if vehicles array is empty
    if (!vehicles || vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No vehicles found for this region"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully for region",
      data: vehicles,
      count: vehicles.length,
      regionId: regionId
    });

  } catch (error) {
    console.error('Error fetching vehicles by region:', error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Get Vehicles by Depot
export const getVehiclesByDepot = async (req, res) => {
  try {
    const { depotId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(depotId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid depot ID format"
      });
    }

    const vehicles = await Vehicle.find({ depotCustomer: depotId })
      .populate('seatLayout', 'layoutName')
      .populate('department', 'account accountCode')
      .populate('hierarchy', 'name level description')
      .populate('regionZone', 'name code')
      .populate('depotCustomer', 'depotCustomer depotCode location')
      .populate('serviceType', 'name serviceType fare')
      .populate('vehicleManufacturer', 'make shortName')
      .populate('vehicleType', 'vehicleType')
      .populate('vehicleModel', 'vehicleModel')
      .populate({
        path: 'vltdDevice',
        select: 'imeiNumber iccid simNumber deviceStatus',
        populate: {
          path: 'vlt',
          select: 'manufacturerName modelName version'
        }
      })
      .sort({ vehicleNumber: 1 });

    // Check if vehicles array is empty
    if (!vehicles || vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No vehicles found for this depot"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully for depot",
      data: vehicles,
      count: vehicles.length,
      depotId: depotId
    });

  } catch (error) {
    console.error('Error fetching vehicles by depot:', error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Enhanced version with query parameters and filters
export const getVehiclesByRegionAndDepot = async (req, res) => {
  try {
    const { regionId, depotId } = req.query;
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'vehicleNumber', 
      sortOrder = 'asc',
      search,
      ownerType,
      serviceType 
    } = req.query;

    // Build filter object
    const filter = {};
    if (regionId) {
      if (!isValidObjectId(regionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid region ID format"
        });
      }
      filter.regionZone = regionId;
    }

    if (depotId) {
      if (!isValidObjectId(depotId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid depot ID format"
        });
      }
      filter.depotCustomer = depotId;
    }

    if (search) {
      filter.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { engineNumber: { $regex: search, $options: 'i' } },
        { chassisNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (ownerType) {
      filter.ownerType = ownerType.toUpperCase();
    }

    if (serviceType) {
      filter.serviceType = serviceType;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const vehicles = await Vehicle.find(filter)
      .populate('seatLayout', 'layoutName')
      .populate('hierarchy', 'name level description')
      .populate('regionZone', 'name code')
      .populate('depotCustomer', 'depotCustomer depotCode location')
      .populate('serviceType', 'name serviceType fare')
      .populate('vehicleManufacturer', 'make shortName')
      .populate('vehicleType', 'vehicleType')
      .populate('vehicleModel', 'vehicleModel')
      .populate({
        path: 'vltdDevice',
        select: 'imeiNumber iccid simNumber deviceStatus',
        populate: {
          path: 'vlt',
          select: 'manufacturerName modelName version'
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Vehicle.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Check if vehicles array is empty
    if (!vehicles || vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No vehicles found for the specified criteria"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully",
      data: vehicles,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      filters: {
        ...(regionId && { regionId }),
        ...(depotId && { depotId })
      }
    });

  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Get Vehicle Statistics by Region and Depot
export const getVehicleStats = async (req, res) => {
  try {
    const { regionId, depotId } = req.query;

    const filter = {};
    if (regionId) filter.regionZone = regionId;
    if (depotId) filter.depotCustomer = depotId;

    const stats = await Vehicle.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalVehicles: { $sum: 1 },
          ownedVehicles: {
            $sum: { $cond: [{ $eq: ["$ownerType", "OWNED"] }, 1, 0] }
          },
          hiredVehicles: {
            $sum: { $cond: [{ $eq: ["$ownerType", "HIRED"] }, 1, 0] }
          },
          avgManufacturingYear: { $avg: "$manufacturingYear" }
        }
      }
    ]);

    // Service type breakdown
    const serviceTypeStats = await Vehicle.aggregate([
      { $match: filter },
      { $group: { _id: "$serviceType", count: { $sum: 1 } } },
      { $lookup: { from: "servicetypes", localField: "_id", foreignField: "_id", as: "serviceInfo" } },
      { $project: { count: 1, serviceName: { $arrayElemAt: ["$serviceInfo.name", 0] } } }
    ]);

    return res.status(200).json({
      success: true,
      message: "Vehicle statistics retrieved successfully",
      data: {
        overview: stats[0] || { totalVehicles: 0, ownedVehicles: 0, hiredVehicles: 0 },
        serviceTypeBreakdown: serviceTypeStats
      }
    });

  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};