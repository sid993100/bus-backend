import mongoose, { isValidObjectId } from "mongoose";
import ScheduleConfiguration from "../../models/scheduleModel.js";
import TripConfig from "../../models/tripModel.js";



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
      days,
      cycleDay = "Daily",
    } = req.body;

    if (!depot || !scheduleLabel || !seatLayout || !busService || !trips || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: "All required fields must be provided" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid startDate or endDate" });
    }
    if (start >= end) {
      return res.status(400).json({ success: false, error: "Start date must be before end date" });
    }

    // Helpers
    const addDays = (d, n) => {
      const x = new Date(d);
      x.setDate(x.getDate() + n);
      return x;
    };

  
    const weeklyDayToJs = (weeklyDay) => {
    
      return weeklyDay % 7;
    };

    const nextWeekdayOnOrAfter = (base, weeklyDay) => {
      const targetJs = weeklyDayToJs(weeklyDay);
      const baseJs = base.getDay();
      const delta = (targetJs - baseJs + 7) % 7; 
      return addDays(base, delta);
    };

    let totalKm = 0;

    for (const t of trips) {
      // Resolve the trip document and its route for distance
      const tripDoc = await TripConfig.findById(t.trip).populate("route", "routeLength");
      if (!tripDoc) continue;

      const routeLen = tripDoc.route?.routeLength || 0;
      totalKm += Number(routeLen) || 0;

      // Determine effective start for this trip based on cycleDay and t.day
      let effectiveStart;

      if (cycleDay === "Weekly") {
      
        effectiveStart = nextWeekdayOnOrAfter(start, Number(t.day));
      } else {
     
        const offset = Math.max(Number(t.day) - 1, 0);
        effectiveStart = addDays(start, offset);
      }


      if (effectiveStart < start) effectiveStart = start;
      if (effectiveStart > end) effectiveStart = end;

      const effectiveEnd = end < effectiveStart ? effectiveStart : end;

      
      await TripConfig.findByIdAndUpdate(
        t.trip,
        {
          $set: {
            startDate: effectiveStart,
            endDate: effectiveEnd,
            scheduleLabel,
          },
        },
        { new: true }
      );
    }

    // Create schedule
    const scheduleConfig = new ScheduleConfiguration({
      depot,
      scheduleLabel: String(scheduleLabel).toUpperCase(),
      seatLayout,
      busService,
      trips,
      scheduleKm: totalKm,
      startDate: start,
      endDate: end,
      cycleDay,
      days,
    });

    const savedSchedule = await scheduleConfig.save();

    const populatedSchedule = await ScheduleConfiguration.findById(savedSchedule._id)
      .populate("depot", "depotName depotCode")
      .populate("seatLayout", "layoutName totalSeats")
      .populate("busService", "serviceName serviceType")
      .populate({
        path: "trips.trip",
        populate: { path: "route", select: "routeName routeCode routeLength source destination" },
      });

    return res.status(201).json({
      success: true,
      message: "Schedule configuration created successfully",
      data: populatedSchedule,
    });
  } catch (error) {
    console.error("createScheduleConfiguration error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};


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


export const getSchedulesByDateAndDepot = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const depot = req.params.depotId;

    if (!depot || !isValidObjectId(depot)) {
      return res.status(400).json({ success: false, error: "Valid 'depot' is required" });
    }

    let start = normalizeDate(startDate);
    let end = normalizeDate(endDate);

    if (!start || !end) {
      const defaults = getDefaultDateRange();
      start = defaults.startDate;
      end = defaults.endDate;
    }

    const filter = {
      depot,
      startDate: { $lte: end },
      endDate: { $gte: start },
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
      filters: { startDate: start, endDate: end, depot },
    });
  } catch (error) {
    console.error("Error fetching schedules by date+depot:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch schedules" });
  }
};


export const getSchedulesByDateAndRegion = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const regionId = req.params.regionId;

    if (!regionId || !isValidObjectId(regionId)) {
      return res.status(400).json({ success: false, error: "Valid 'regionId' is required" });
    }

    let start = normalizeDate(startDate);
    let end = normalizeDate(endDate);

    if (!start || !end) {
      const defaults = getDefaultDateRange();
      start = defaults.startDate;
      end = defaults.endDate;
    }

    const baseMatch = {
      startDate: { $lte: end },
      endDate: { $gte: start },
    };

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNum - 1) * limitNum;
    const sortStage = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

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
      filters: { startDate: start, endDate: end, regionId },
    });
  } catch (error) {
    console.error("Error fetching schedules by date+region:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch schedules" });
  }
};


// Helpers
function normalizeDate(input) {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function getDefaultDateRange() {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { startDate: start, endDate: end };
}

function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  return Math.floor((b - a) / MS);
}

const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export const getSchedulesByDate = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      depot,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Parse range (defaults to today)
    let start = normalizeDate(startDate);
    let end = normalizeDate(endDate);
    if (!start || !end) {
      const def = getDefaultDateRange();
      start = def.startDate;
      end = def.endDate;
    }
    const startBound = start;
    const endBound = endOfDay(end);

    // Base overlap filter
    const baseFilter = {
      startDate: { $lte: endBound },
      endDate: { $gte: startBound },
    };
    if (depot) baseFilter.depot = depot;

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Fetch a superset by overlap; apply cycle semantics in memory
    const [rawItems, totalOverlap] = await Promise.all([
      ScheduleConfiguration.find(baseFilter)
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
        .limit(limitNum)
        .lean(),
      ScheduleConfiguration.countDocuments(baseFilter),
    ]);

    // To compute accurate pagination respecting cycle semantics, a second pass is needed for total.
    // For simplicity, compute eligibility for current page and also count on a separate query without skip/limit.
    const allOverlap = await ScheduleConfiguration.find(baseFilter).select("startDate endDate cycleDay days").lean();

    const isEligibleOnAnyDay = (sch) => {
      // Iterate each day in requested window, clamp to schedule range
      const from = new Date(Math.max(startBound.getTime(), new Date(sch.startDate).setHours(0,0,0,0)));
      const to = new Date(Math.min(endBound.getTime(), endOfDay(new Date(sch.endDate)).getTime()));
      if (from > to) return false;

      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const d0 = new Date(d); d0.setHours(0,0,0,0);

        if (sch.cycleDay === "Daily" || !sch.cycleDay) {
          return true;
        }

        if (sch.cycleDay === "Alternative") {
          // Include only when offset from schedule start is even
          const schStart0 = new Date(sch.startDate); schStart0.setHours(0,0,0,0);
          const delta = daysBetween(schStart0, d0);
          if (delta % 2 === 0) return true;
        }

        if (sch.cycleDay === "Weekly") {
          const wdName = WEEKDAYS[d0.getDay()];
          // Include if schedule.days includes this weekday
          if (Array.isArray(sch.days) && sch.days.includes(wdName)) {
            return true;
          }
        }
      }
      return false;
    };

    // Page items have the full document; check eligibility on rawItems for response
    const pageEligible = rawItems.filter(isEligibleOnAnyDay);

    // Accurate total respecting cycle semantics
    const totalEligible = allOverlap.filter(isEligibleOnAnyDay).length;

    return res.status(200).json({
      success: true,
      data: pageEligible,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalEligible / limitNum),
        totalItems: totalEligible,
        itemsPerPage: limitNum,
        hasNextPage: pageNum * limitNum < totalEligible,
        hasPrevPage: pageNum > 1,
      },
      filters: { startDate: startBound, endDate: endBound, ...(depot && { depot }) },
    });
  } catch (error) {
    console.error("Error fetching schedules by date:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch schedules by date" });
  }
};

export const updateCancel = async (req, res) => {
  try {
    const { id:scheduleId } = req.params;
    const tripUpdates = req.body;

    for (const { id, date } of tripUpdates) {

      const newDate = new Date(date);

   await ScheduleConfiguration.updateOne(
    {
      _id: scheduleId,
      'trips.trip': new mongoose.Types.ObjectId(id),
    },
    {
      $addToSet: {
        'trips.$[elem].cancelDates': newDate,
      },
    },
    {
      arrayFilters: [
        { 'elem.trip': new mongoose.Types.ObjectId(id) },
      ],
    }
  );


await TripConfig.updateOne(
  { _id: id } ,
  { $addToSet: { cancel: newDate } },
  { new: true }
);

}
    const schedule = await ScheduleConfiguration.findById(scheduleId)

    if (!schedule) {
      return res.status(404).json({ success: false, error: "Schedule not found" });
    }
    return res.status(200).json({ success: true, message: "Cancel date added", data: schedule });
  } catch (error) {
    console.error("Error updating cancel date:", error);
    return res.status(500).json({ success: false, error: "Failed to update cancel date" });
  }
};
