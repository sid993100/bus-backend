import { isValidObjectId } from "mongoose";
import ScheduleConfiguration from "../../models/scheduleModel.js";
import TripConfig from "../../models/tripModel.js";

// CREATE - Add new schedule configuration

export const createScheduleConfiguration = async (req, res) => {
  try {
    const {
      depot,
      scheduleLabel,
      seatLayout,
      busService,
      trips,
      startDate,
      endDate,
    } = req.body;

    // Validation
    if (!depot || !scheduleLabel || !seatLayout || !busService || !trips || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'All required fields must be provided' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({ success: false, error: 'Start date must be before end date' });
    }

    // 🔹 Calculate scheduleKm
    let totalKm = 0;
    for (const trip of trips) {
      const tripConfig = await TripConfig.findByIdAndUpdate(trip.trip,{$set: {startDate: start, endDate: end ,scheduleLabel}},{new: true}).populate("route", "routeLength");
      if (!tripConfig) continue;
      
      if (!tripConfig.route || !tripConfig.route.routeLength) continue;

      totalKm += tripConfig.route.routeLength;
    }

    const scheduleConfig = new ScheduleConfiguration({
      depot,
      scheduleLabel: scheduleLabel.toUpperCase(),
      seatLayout,
      busService,
      trips,
      scheduleKm: totalKm,
      startDate: start,
      endDate: end,
    });

    const savedSchedule = await scheduleConfig.save();

    const populatedSchedule = await ScheduleConfiguration.findById(savedSchedule._id)
      .populate('depot', 'depotName depotCode')
      .populate('seatLayout', 'layoutName totalSeats')
      .populate('busService', 'serviceName serviceType')
      .populate({
        path: "trips.trip",
        populate: { path: "route", select: "routeName routeCode routeLength source destination" }
      });

    res.status(201).json({
      success: true,
      message: 'Schedule configuration created successfully',
      data: populatedSchedule
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET ALL - Retrieve all schedule configurations
export const getAllScheduleConfigurations = async (req, res) => {
  try {
    const {
      depot,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (depot) filter.depot = depot;
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const schedules = await ScheduleConfiguration.find(filter)
      .populate('depot', 'depotCustomer depotCode region')
      .populate('seatLayout', 'layoutName totalSeats seatConfiguration')
      .populate('busService', 'name serviceType fare')
      .populate({
        path: 'trips.trip',
        select: 'tripId origin destination originTime destinationTime cycleDay day status route',
        populate:[
         { path:"route" , select:"routeName"}
        ]
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await ScheduleConfiguration.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.status(200).json({
      success: true,
      data: schedules,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching schedule configurations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule configurations'
    });
  }
};

// UPDATE - Update schedule configuration
export const updateScheduleConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
    if (updateData.startDate && updateData.endDate) {
      if (start >= end) {
        return res.status(400).json({ success: false, error: 'Start date must be before end date' });
      }
    }

    if (updateData.scheduleLabel) {
      updateData.scheduleLabel = updateData.scheduleLabel.toUpperCase();
    }

    // 🔹 Recalculate scheduleKm if trips provided
    if (updateData.trips && updateData.trips.length > 0) {
      let totalKm = 0;
      for (const trip of updateData.trips) {
        const tripConfig = await TripConfig.findByIdAndUpdate(trip.trip,{$set:{startDate: start, endDate: end}},{new: true}).populate("route", "routeLength");
        if (!tripConfig) continue;
        if (!tripConfig.route || !tripConfig.route.routeLength) continue;

        totalKm += tripConfig.route.routeLength;
      }
      updateData.scheduleKm = totalKm;
    }

    const updatedSchedule = await ScheduleConfiguration.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('depot', 'depotName depotCode location')
      .populate('seatLayout', 'layoutName totalSeats seatConfiguration')
      .populate('busService', 'serviceName serviceType fare')
      .populate({
        path: "trips.trip",
        populate: { path: "route", select: "routeName routeCode routeLength source destination" }
      });

    if (!updatedSchedule) {
      return res.status(404).json({ success: false, error: 'Schedule configuration not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule configuration updated successfully',
      data: updatedSchedule
    });

  } catch (error) {
    console.error('Error updating schedule configuration:', error);
    res.status(500).json({ success: false, error: 'Failed to update schedule configuration' });
  }
};


// DELETE - Delete schedule configuration
export const deleteScheduleConfiguration = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSchedule = await ScheduleConfiguration.findByIdAndDelete(id);

    if (!deletedSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule configuration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule configuration deleted successfully',
      data: deletedSchedule
    });

  } catch (error) {
    console.error('Error deleting schedule configuration:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid schedule configuration ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete schedule configuration'
    });
  }
};

// GET BY DEPOT - Get schedules by specific depot
export const getSchedulesByDepot = async (req, res) => {
  try {
    const { depotId } = req.params;

    const schedules = await ScheduleConfiguration.find({ depot: depotId })
      .populate('depot', 'depotCustomer depotCode')
      .populate('seatLayout', 'layoutName totalSeats')
      .populate('busService', 'name ')
      // .populate('routeName', 'routeName routeCode source destination')
      .sort({ scheduleLabel: 1 });

    res.status(200).json({
      success: true,
      data: schedules,
      count: schedules.length
    });

  } catch (error) {
    console.error('Error fetching depot schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch depot schedules'
    });
  }
};

export const getByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;
    console.log(regionId)
    if (!regionId || !isValidObjectId(regionId)) {
      return res.status(400).json({ success: false, error: "Invalid regionId" });
    }
    const items = await ScheduleConfiguration.find({})
      .populate({ path: "depot", select: "depotCustomer depotCode region", match: { region: regionId } })
      .populate("seatLayout", "layoutName")
      .populate("busService", "name")
      .populate({ path: "trips.trip", select: "tripId route", populate: [{ path: "route", select: "routeName" }] })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: items.filter(d => d.depot) });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || "Server error" });
  }
};

// GET BY ID - Retrieve single schedule configuration
export const getScheduleConfigurationById = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await ScheduleConfiguration.findById(id)
      .populate('depot', 'depotName depotCode location')
      .populate('seatLayout', 'layoutName totalSeats seatConfiguration')
      .populate('busService', 'serviceName serviceType fare')
      .populate('routeName', 'routeName routeCode source destination routeLength');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule configuration not found'
      });
    }

    res.status(200).json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('Error fetching schedule configuration:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid schedule configuration ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule configuration'
    });
  }
};

export const getSchedulesByDate = async (req, res) => {
  try {
    const {
      date = new Date().toISOString().split("T")[0],          // e.g., 2025-10-01 or ISO string
      depot,         // optional
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, error: "Missing required 'date' query param" });
    }

    const target = new Date(date);
    if (isNaN(target.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid 'date' format" });
    }

    // Inclusive window: startDate <= target <= endDate
    const filter = {
      startDate: { $lte: target },
      endDate: { $gte: target },
    };

    if (depot) filter.depot = depot;

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [items, total] = await Promise.all([
      ScheduleConfiguration.find(filter)
        .populate("depot", "depotCustomer depotCode region")
        .populate("seatLayout", "layoutName totalSeats seatConfiguration")
        .populate("busService","name")
        .populate({
          path: "trips.trip",
          select: "tripId origin destination originTime destinationTime cycleDay day status route",
          populate: [{ path: "route", select: "routeName" }],
        })
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      ScheduleConfiguration.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
      filters: { date, ...(depot && { depot }) },
    });
  } catch (error) {
    console.error("Error fetching schedules by date:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch schedules by date" });
  }
};


export const getSchedulesByDateAndDepot = async (req, res) => {
  try {
    const {
      date = new Date().toISOString().split("T")[0], // required for this endpoint
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const depot = req.params.depotId;

    if (!depot || !isValidObjectId(depot)) {
      return res.status(400).json({ success: false, error: "Valid 'depot' is required" });
    }

    const target = new Date(date);
    if (isNaN(target.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid 'date' format" });
    }

    const filter = {
      depot,
      startDate: { $lte: target },
      endDate: { $gte: target },
    };

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [items, total] = await Promise.all([
      ScheduleConfiguration.find(filter)
        .populate("depot", "depotCustomer depotCode region")
        .populate("seatLayout", "layoutName totalSeats seatConfiguration")
        .populate("busService", "name")
        .populate({
          path: "trips.trip",
          select: "tripId origin destination originTime destinationTime cycleDay day status route",
          populate: [{ path: "route", select: "routeName" }],
        })
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      ScheduleConfiguration.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
      filters: { date, depot },
    });
  } catch (error) {
    console.error("Error fetching schedules by date+depot:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch schedules" });
  }
};



export const getSchedulesByDateAndRegion = async (req, res) => {
  try {
    const {
      date = new Date().toISOString().split("T")[0],
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
const regionId = req.params.regionId;
    if (!regionId || !isValidObjectId(regionId)) {
      return res.status(400).json({ success: false, error: "Valid 'regionId' is required" });
    }

    const target = new Date(date);
    if (isNaN(target.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid 'date' format" });
    }

    // Date-inclusive base filter
    const baseMatch = {
      startDate: { $lte: target },
      endDate: { $gte: target },
    };

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNum - 1) * limitNum;
    const sortStage = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Use aggregation to enforce depot.region match
    const pipeline = [
      { $match: baseMatch },
      {
        $lookup: {
          from: "depotcustomers",
          localField: "depot",
          foreignField: "_id",
          as: "depot",
          pipeline: [
            { $match: { region: new mongoose.Types.ObjectId(regionId) } },
            { $project: { depotCustomer: 1, depotCode: 1, region: 1 } },
          ],
        },
      },
      { $match: { depot: { $ne: [] } } },
      {
        $lookup: {
          from: "seatlayouts",
          localField: "seatLayout",
          foreignField: "_id",
          as: "seatLayout",
          pipeline: [{ $project: { layoutName: 1, totalSeats: 1, seatConfiguration: 1 } }],
        },
      },
      { $unwind: { path: "$seatLayout", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "servicetypes",
          localField: "busService",
          foreignField: "_id",
          as: "busService",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: { path: "$busService", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "tripconfigs",
          localField: "trips.trip",
          foreignField: "_id",
          as: "tripDocs",
          pipeline: [
            {
              $lookup: {
                from: "routes",
                localField: "route",
                foreignField: "_id",
                as: "route",
                pipeline: [{ $project: { routeName: 1 } }],
              },
            },
            { $unwind: { path: "$route", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                tripId: 1,
                origin: 1,
                destination: 1,
                originTime: 1,
                destinationTime: 1,
                cycleDay: 1,
                day: 1,
                status: 1,
                route: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          trips: {
            $map: {
              input: "$trips",
              as: "t",
              in: {
                $mergeObjects: [
                  "$$t",
                  {
                    trip: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$tripDocs",
                            as: "td",
                            cond: { $eq: ["$$td._id", "$$t.trip"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $unset: "tripDocs" },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limitNum },
    ];

    const countPipeline = [
      { $match: baseMatch },
      {
        $lookup: {
          from: "depotcustomers",
          localField: "depot",
          foreignField: "_id",
          as: "depot",
          pipeline: [{ $match: { region: new mongoose.Types.ObjectId(regionId) } }],
        },
      },
      { $match: { depot: { $ne: [] } } },
      { $count: "total" },
    ];

    const [items, countAgg] = await Promise.all([
      ScheduleConfiguration.aggregate(pipeline),
      ScheduleConfiguration.aggregate(countPipeline),
    ]);

    const total = countAgg[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
      filters: { date, regionId },
    });
  } catch (error) {
    console.error("Error fetching schedules by date+region:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch schedules" });
  }
};

