import TripConfig from "../../../models/tripModel.js";
import mongoose, { isValidObjectId } from "mongoose";

export const getTrips = async (req, res) => {
  try {
    const trips = await TripConfig.find()
      .populate("depot", "depotCustomer code ")
      .populate("seatLayout", "layoutName")
      .populate([
        {
          path: "route",
          select: "routeName depot",
          populate: [{ path: "depot", select: "depotCustomer code " }],
        },
      ]);
    if (!trips) {
      return res.status(404).json({ message: "No trips found" });
    }
    return res.status(200).json({
      message: "Trips retrieved successfully",
      data: trips,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

// Common populate used in getTrips
const tripPopulate = [
  { path: "depot", select: "depotCustomer code" },
  { path: "seatLayout", select: "layoutName" },
  {
    path: "route",
    select: "routeName depot region", // include region here for region filter if needed
    populate: [{ path: "depot", select: "depotCustomer code" }],
  },
];

// Helper to build query params
function buildTripQueryParams(req) {
  const {
    page = "1",
    limit = "20",
    sortBy = "createdAt",
    sortOrder = "desc",
    search, // optional: matches by tripName or code fields if present
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = Math.max(parseInt(limit, 10), 1);
  const skip = (pageNum - 1) * limitNum;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const textFilter = search
    ? {
        $or: [
          { tripName: { $regex: search, $options: "i" } },
          { tripCode: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  return { pageNum, limitNum, skip, sort, textFilter };
}

// GET /api/trips/by-depot/:depotId
export const getTripsByDepot = async (req, res) => {
  try {
    const { depotId } = req.params;
    if (!isValidObjectId(depotId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid depot ID" });
    }

    const { pageNum, limitNum, skip, sort, textFilter } =
      buildTripQueryParams(req);

    // Assuming TripConfig has a direct depot field (ObjectId -> Depot model)
    // If not, and depot comes via route.depot, switch to aggregation below.
    const filter = { depot: depotId, ...textFilter };

    const [items, total] = await Promise.all([
      TripConfig.find(filter)
        .populate(tripPopulate)
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      TripConfig.countDocuments(filter),
    ]);

    if (items.length === 0) {
      return res
        .status(200)
        .json({
          success: true,
          message: "No trips found for depot",
          data: items,
        });
    }

    const totalPages = Math.ceil(total / limitNum);
    return res.status(200).json({
      success: true,
      message: "Trips retrieved successfully",
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
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal server error",
      });
  }
};

export const getTripsByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;
    if (!isValidObjectId(regionId)) {
      return res.status(400).json({ success: false, message: "Invalid region ID" });
    }

    const { pageNum, limitNum, skip, sort, textFilter } = buildTripQueryParams(req);

    // Base filter only uses text; region is applied via populate match
    const filter = { ...textFilter };

    // Fetch a page and populate with match on route.region
    const itemsRaw = await TripConfig.find(filter)
      .populate([
        { path: "depot", select: "depotCustomer code" },
        { path: "seatLayout", select: "layoutName" },
        {
          path: "route",
          select: "routeName depot region",
          match: { region: regionId },
          populate: [{ path: "depot", select: "depotCustomer code" }],
        },
      ])
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Keep only docs whose populated route matched the region
    const items = itemsRaw.filter((t) => t.route);

    // For an approximate total consistent enough for paging without aggregation:
    // do a second lightweight query to count ids with the same filter and match
    const idsForCount = await TripConfig.find(filter)
      .select("_id")
      .populate({ path: "route", select: "_id region", match: { region: regionId } })
      .lean();

    const total = idsForCount.filter((d) => d.route).length;
    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      message: items.length ? "Trips retrieved successfully" : "No trips found for region",
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
    console.error(error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const addTrip = async (req, res) => {
  try {
    const {
      tripId,
      depot,
      seatLayout,
      busService,
      route,
      origin,
      destination,
      originTime,
      destinationTime,
      arrivalDay,
      cycleDay,
      reservation,
      currentBooking,
      fareType,
      configuredStops,
      day,
    } = req.body;

    // Enhanced validation - base required fields
    const requiredFields = {
      depot: "Depot is required",
      seatLayout: "Seat layout is required",
      busService: "Bus service is required",
      route: "Route is required",
      origin: "Origin is required",
      destination: "Destination is required",
      originTime: "Origin time is required",
      destinationTime: "Destination time is required",
      configuredStops: "Configured stops are required",
      cycleDay: "Cycle day is required",
    };

    const errors = {};
    Object.keys(requiredFields).forEach((field) => {
      if (
        !req.body[field] ||
        (Array.isArray(req.body[field]) && req.body[field].length === 0)
      ) {
        errors[field] = requiredFields[field];
      }
    });

    // **CONDITIONAL VALIDATION: day is only required when cycleDay is 'Weekly'**
    if (cycleDay === "Weekly") {
      if (!day || !Array.isArray(day) || day.length === 0) {
        errors.day =
          "At least one operating day is required when cycle day is Weekly";
      }
    }
    //  else if (cycleDay === 'Daily') {

    // } else if (cycleDay === 'Alternative') {

    // }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    // Validate ObjectIds
    const objectIdFields = ["depot", "seatLayout", "route"];
    objectIdFields.forEach((field) => {
      if (!isValidObjectId(req.body[field])) {
        errors[field] = `Invalid ${field} ID format`;
      }
    });

    // Validate cycleDay enum
    const validCycleDays = ["Daily", "Alternative", "Weekly"];
    if (!validCycleDays.includes(cycleDay)) {
      errors.cycleDay = `Cycle day must be one of: ${validCycleDays.join(
        ", "
      )}`;
    }

    // Validate day array only if cycleDay is Weekly
    if (cycleDay === "Weekly" && day && Array.isArray(day)) {
      const validDays = [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ];
      const invalidDays = day.filter(
        (d) => !validDays.includes(d.toUpperCase())
      );
      if (invalidDays.length > 0) {
        errors.day = `Invalid day(s): ${invalidDays.join(", ")}`;
      }
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(originTime)) {
      errors.originTime = "Origin time must be in HH:MM format";
    }
    if (!timeRegex.test(destinationTime)) {
      errors.destinationTime = "Destination time must be in HH:MM format";
    }

    // Validate configured stops
    if (configuredStops && Array.isArray(configuredStops)) {
      configuredStops.forEach((stop, index) => {
        if (!stop.stop || !isValidObjectId(stop.stop)) {
          errors[`configuredStops.${index}.stop`] = "Invalid stop ID";
        }
        if (stop.arrivalTime && !timeRegex.test(stop.arrivalTime)) {
          errors[`configuredStops.${index}.arrivalTime`] =
            "Invalid arrival time format";
        }
        if (stop.departureTime && !timeRegex.test(stop.departureTime)) {
          errors[`configuredStops.${index}.departureTime`] =
            "Invalid departure time format";
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    // Build conflict check query based on cycleDay
    let conflictQuery = {
      busService,
      route,
      originTime,
      status: { $nin: ['REJECTED', 'CANCELLED'] },
      $or: [
        { origin, destination },
        { origin: destination, destination: origin },
      ],
    };

    // **CONDITIONAL CONFLICT CHECK: Only check day conflicts for Weekly trips**
    if (cycleDay === "Weekly" && day && Array.isArray(day)) {
      conflictQuery.day = { $in: day.map((d) => d.toUpperCase()) };
      conflictQuery.cycleDay = "Weekly";
    } else if (cycleDay === "Daily") {
      conflictQuery.cycleDay = "Daily";
    } else if (cycleDay === "Alternative") {
      conflictQuery.cycleDay = "Alternative";
    }

    const existingTrip = await TripConfig.findOne(conflictQuery);

    if (existingTrip) {
      let conflictMessage = `A trip with service ${busService} already exists for similar route and time`;

      if (cycleDay === "Weekly") {
        conflictMessage += ` on overlapping days`;
      } else {
        conflictMessage += ` with ${cycleDay} cycle`;
      }

      return res.status(409).json({
        success: false,
        message: conflictMessage,
        conflictingTrip: {
          tripId: existingTrip.tripId,
          route: `${existingTrip.origin} to ${existingTrip.destination}`,
          time: existingTrip.originTime,
          cycleDay: existingTrip.cycleDay,
          ...(existingTrip.day && { days: existingTrip.day }),
        },
      });
    }

    // Prepare trip data based on cycleDay
    const tripData = {
      tripId,
      depot,
      seatLayout,
      busService,
      route,
      origin,
      destination,
      originTime,
      destinationTime,
      arrivalDay,
      cycleDay,
      reservation,
      currentBooking,
      fareType,
      configuredStops,
      status: "PENDING",
    };

    // **CONDITIONAL FIELD: Only add day field if cycleDay is Weekly**
    if (cycleDay === "Weekly" && day && Array.isArray(day)) {
      tripData.day = day.map((d) => d.toUpperCase());
    }
    // For Daily and Alternative, day field is omitted/undefined

    const trip = await TripConfig.create(tripData);

    // Populate the created trip for response
    const populatedTrip = await TripConfig.findById(trip._id)
      .populate("depot", "depotCustomer")
      .populate("seatLayout", "layoutName totalSeats")
      .populate("route", "routeName routeCode routeLength")
      .populate("configuredStops.stop", "stopName location");

    return res.status(201).json({
      success: true,
      message: "Trip created successfully",
      data: populatedTrip,
    });
  } catch (error) {
    console.error("Error creating trip:", error);

    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Trip with this configuration already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ID
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid trip ID is required",
      });
    }

    // Check if trip exists
    const existingTrip = await TripConfig.findById(id);
    if (!existingTrip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Validate update data
    const errors = {};

    // Validate ObjectIds if provided
    const objectIdFields = ["depot", "seatLayout", "route"];
    objectIdFields.forEach((field) => {
      if (updateData[field] && !isValidObjectId(updateData[field])) {
        errors[field] = `Invalid ${field} ID format`;
      }
    });

    // Validate cycleDay if provided
    if (updateData.cycleDay) {
      const validCycleDays = ["Daily", "Alternative", "Weekly"];
      if (!validCycleDays.includes(updateData.cycleDay)) {
        errors.cycleDay = `Cycle day must be one of: ${validCycleDays.join(
          ", "
        )}`;
      }
    }

    // **CONDITIONAL VALIDATION: day is only required/validated when cycleDay is 'Weekly'**
    const finalCycleDay = updateData.cycleDay || existingTrip.cycleDay;

    if (finalCycleDay === "Weekly") {
      if (updateData.day !== undefined) {
        if (!Array.isArray(updateData.day) || updateData.day.length === 0) {
          errors.day =
            "At least one operating day is required when cycle day is Weekly";
        } else {
          const validDays = [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
          ];
          const invalidDays = updateData.day.filter(
            (d) => !validDays.includes(d.toUpperCase())
          );
          if (invalidDays.length > 0) {
            errors.day = `Invalid day(s): ${invalidDays.join(", ")}`;
          }
        }
      } else if (!existingTrip.day || existingTrip.day.length === 0) {
        errors.day = "Day field is required for Weekly cycle trips";
      }
    } else if (
      updateData.cycleDay &&
      (updateData.cycleDay === "Daily" || updateData.cycleDay === "Alternative")
    ) {
      // If changing from Weekly to Daily/Alternative, we should clear the day field
      updateData.day = undefined;
    }

    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (updateData.originTime && !timeRegex.test(updateData.originTime)) {
      errors.originTime = "Origin time must be in HH:MM format";
    }
    if (
      updateData.destinationTime &&
      !timeRegex.test(updateData.destinationTime)
    ) {
      errors.destinationTime = "Destination time must be in HH:MM format";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    // Check for conflicts if key fields are being updated
    if (
      updateData.busService ||
      updateData.originTime ||
      updateData.origin ||
      updateData.destination ||
      updateData.day ||
      updateData.cycleDay
    ) {
      let conflictQuery = {
        _id: { $ne: id },
        busService: updateData.busService || existingTrip.busService,
        route: updateData.route || existingTrip.route,
        originTime: updateData.originTime || existingTrip.originTime,
        $or: [
          {
            origin: updateData.origin || existingTrip.origin,
            destination: updateData.destination || existingTrip.destination,
          },
        ],
      };

      const finalCycleDayForConflict =
        updateData.cycleDay || existingTrip.cycleDay;
      conflictQuery.cycleDay = finalCycleDayForConflict;

      // **CONDITIONAL CONFLICT CHECK: Only check day conflicts for Weekly trips**
      if (finalCycleDayForConflict === "Weekly") {
        const dayToCheck = updateData.day || existingTrip.day;
        if (dayToCheck && Array.isArray(dayToCheck) && dayToCheck.length > 0) {
          conflictQuery.day = { $in: dayToCheck.map((d) => d.toUpperCase()) };
        }
      }

      const conflictingTrip = await TripConfig.findOne(conflictQuery);
      if (conflictingTrip) {
        return res.status(409).json({
          success: false,
          message: "Update would create a conflict with existing trip",
          conflictingTrip: {
            tripId: conflictingTrip.tripId,
            route: `${conflictingTrip.origin} to ${conflictingTrip.destination}`,
            time: conflictingTrip.originTime,
            cycleDay: conflictingTrip.cycleDay,
            ...(conflictingTrip.day && { days: conflictingTrip.day }),
          },
        });
      }
    }

    // **CONDITIONAL PROCESSING: Handle day field based on cycleDay**
    if (updateData.day && Array.isArray(updateData.day)) {
      updateData.day = updateData.day.map((d) => d.toUpperCase());
    }

    // If changing cycleDay from Weekly to Daily/Alternative, remove day field
    if (
      updateData.cycleDay &&
      updateData.cycleDay !== "Weekly" &&
      existingTrip.cycleDay === "Weekly"
    ) {
      updateData.$unset = { day: 1 };
    }

    // Update trip
    const updatedTrip = await TripConfig.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("depot", "depotCustomer")
      .populate("seatLayout", "layoutName totalSeats")
      .populate("route", "routeName routeCode routeLength")
      .populate("configuredStops.stop", "stopName location");

    return res.status(200).json({
      success: true,
      message: "Trip updated successfully",
      data: updatedTrip,
    });
  } catch (error) {
    console.error("Error updating trip:", error);

    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

export const getTodayTrips = async (req, res) => {
  try {
    const { startDay, endDay } = req.query;

    const toStartOfDay = (d) => { 
      const x = new Date(d); 
      x.setHours(0, 0, 0, 0); 
      return x; 
    };
    
    const toEndOfDay = (d) => { 
      const x = new Date(d); 
      x.setHours(23, 59, 59, 999); 
      return x; 
    };

    let rangeStart, rangeEnd;

    if (!startDay && !endDay) {
      const now = new Date();
      rangeStart = toStartOfDay(now);
      rangeEnd = toEndOfDay(now);
    } else if (startDay && !endDay) {
      const d = new Date(startDay);
      if (isNaN(d)) return res.status(400).json({ success: false, message: "Invalid startDay format" });
      rangeStart = toStartOfDay(d);
      rangeEnd = toEndOfDay(d);
    } else if (!startDay && endDay) {
      const d = new Date(endDay);
      if (isNaN(d)) return res.status(400).json({ success: false, message: "Invalid endDay format" });
      rangeStart = toStartOfDay(d);
      rangeEnd = toEndOfDay(d);
    } else {
      const s = new Date(startDay);
      const e = new Date(endDay);
      if (isNaN(s) || isNaN(e))
        return res.status(400).json({ success: false, message: "Invalid startDay or endDay format" });
      rangeStart = toStartOfDay(s);
      rangeEnd = toEndOfDay(e);
    }

    if (rangeStart > rangeEnd) {
      return res.status(400).json({ success: false, message: "startDay must be <= endDay" });
    }

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;

    const filter = {
      startDate: { $lte: rangeEnd },
      endDate: { $gte: rangeStart },
      status: "APPROVED",
    };

    const allTrips = await TripConfig.find(filter)
      .populate('route', 'routeName routeCode routeLength source destination')
      .populate('depot', 'depotName depotCode region')
      .populate('seatLayout', 'layoutName totalSeats')
      .populate('busService', 'serviceName serviceType')
      .sort({ startDate: -1 })
      .lean();

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    // Filter trips based on logic
    const eligibleTrips = allTrips.filter(trip => {
      const tripStart = toStartOfDay(trip.startDate);
      const tripEnd = toEndOfDay(trip.endDate);
      const cycle = trip.cycleDay || 'Daily';

      // For Daily and Alternative: check only first day
      if (cycle === 'Daily' || cycle === 'Alternative') {
        const checkDate = toStartOfDay(rangeStart);

        // Must be within trip's valid range
        if (checkDate < tripStart || checkDate > tripEnd) {
          return false;
        }

        // Check cancellation
        const isCancelled = Array.isArray(trip.cancel) && trip.cancel.some(cancelDate => {
          const cd = toStartOfDay(new Date(cancelDate));
          return cd.getTime() === checkDate.getTime();
        });

        if (isCancelled) return false;

        // Check breakdown
        const isBreakdown = Array.isArray(trip.breakdown) && trip.breakdown.some(breakdownDate => {
          const bd = toStartOfDay(new Date(breakdownDate));
          return bd.getTime() === checkDate.getTime();
        });

        if (isBreakdown) return false;

        if (cycle === 'Daily') {
          return true;
        }

        if (cycle === 'Alternative') {
          const MS_PER_DAY = 24 * 60 * 60 * 1000;
          const daysDiff = Math.floor((checkDate.getTime() - tripStart.getTime()) / MS_PER_DAY);
          return daysDiff % 2 === 0;
        }
      }

      // For Weekly: check ALL days in the requested range
      if (cycle === 'Weekly') {
        if (!Array.isArray(trip.day) || trip.day.length === 0) {
          return false;
        }

        // Check each day in the range
        for (let currentDate = new Date(rangeStart); currentDate <= rangeEnd; currentDate.setDate(currentDate.getDate() + 1)) {
          const checkDate = toStartOfDay(currentDate);
          
          // Skip if outside trip's date range
          if (checkDate < tripStart || checkDate > tripEnd) {
            continue;
          }

          // Check cancellation for this specific day
          const isCancelled = Array.isArray(trip.cancel) && trip.cancel.some(cancelDate => {
            const cd = toStartOfDay(new Date(cancelDate));
            return cd.getTime() === checkDate.getTime();
          });

          if (isCancelled) continue;

          // Check breakdown for this specific day
          const isBreakdown = Array.isArray(trip.breakdown) && trip.breakdown.some(breakdownDate => {
            const bd = toStartOfDay(new Date(breakdownDate));
            return bd.getTime() === checkDate.getTime();
          });

          if (isBreakdown) continue;

          // Check if this day matches trip's configured days
          const checkDayName = dayNames[checkDate.getDay()];
          if (trip.day.includes(checkDayName)) {
            return true; // Found at least one matching day
          }
        }

        return false; // No matching days found
      }

      return false;
    });

    // Apply pagination
    const total = eligibleTrips.length;
    const paginatedTrips = eligibleTrips.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      range: { startDay: rangeStart, endDay: rangeEnd },
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: paginatedTrips.length,
      data: paginatedTrips,
    });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching trips by day range",
      error: error.message,
    });
  }
};

export const updateTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ID
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid trip ID is required",
      });
    }

    // Check if trip exists
    const existingTrip = await TripConfig.findById(id);
    if (!existingTrip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Update status
    existingTrip.status = status;
    await existingTrip.save();

    return res.status(200).json({
      success: true,
      message: "Trip status updated successfully",
      data: {
        tripId: existingTrip.tripId,
        status: existingTrip.status,
      },
    });
  } catch (error) {
    console.error("Error updating trip status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
}

export const deleteTrips = async (req, res) => {
  try {
    const deleteAll=await TripConfig.deleteMany({});
    return res.status(200).json({
      success: true,
      message: "All trips deleted successfully",
      deletedCount: deleteAll.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting trips:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting trips",
      error: error.message,
    });
  }
}
export const cancelTrip= async (req, res) => {
  try {
    const { id } = req.params;
    const { cancel } = req.body;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid trip ID is required",
      });
    }
    const trip = await TripConfig.findByIdAndUpdate(id,{cancel},{new:true});
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Trip Cancel dates updated successfully",
      data: trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
}
export const breakdownTrip= async (req, res) => {
  try {
    const { id } = req.params;
    const { breakdown } = req.body;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid trip ID is required",
      });
    }
    const newDate = new Date(breakdown)
    const trip = await TripConfig.findByIdAndUpdate(id, { $addToSet: { breakdown: newDate } },{new:true});
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Trip breakdown dates updated successfully",
      data: trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
}
export const delayTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { delay } = req.body;

    // Validate trip ID
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid trip ID is required",
      });
    }

    // Validate input
    if (!delay.date || delay.delayDuration === undefined) {
      return res.status(400).json({
        success: false,
        message: "Both date and delayDuration are required",
      });
    }

    // Normalize date to start of day
    const delayDate = new Date(delay.date);
    delayDate.setHours(0, 0, 0, 0);

    if (isNaN(delayDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Find the trip
    const trip = await TripConfig.findById(id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Check if delay for this date already exists
    const existingDelayIndex = trip.delay.findIndex(d => {
      const existingDate = new Date(d.date);
      existingDate.setHours(0, 0, 0, 0);
      return existingDate.getTime() === delayDate.getTime();
    });

    if (existingDelayIndex !== -1) {
      // Update existing delay duration
      trip.delay[existingDelayIndex].delayDuration = delay.delayDuration;
      
    } else {
      // Add new delay entry
      trip.delay.push({
        date: delayDate,
        delayDuration: Number(delay.delayDuration)
      });
     
    }

    // Save the trip
    await trip.save();

    // Populate and return
    const updatedTrip = await TripConfig.findById(id)
      .populate('route', 'routeName routeCode')
      .populate('depot', 'depotName depotCode')
      .populate('seatLayout', 'layoutName totalSeats');

    return res.status(200).json({
      success: true,
      message: existingDelayIndex !== -1 
        ? "Delay duration updated successfully" 
        : "Delay added successfully",
      data: updatedTrip,
    });

  } catch (error) {
    console.error("Error updating trip delay:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

export const getArrivalDeparture  = async (req, res) => {
  try {
    const { 
      startDay, 
      endDay, 
      scheduleId, 
      regionId, 
      depotId, 
      vehicleNumber, 
      routeId,
      page = 1,
      limit = 10
    } = req.query;

    // Normalize date to start or end of the day
    const toStartOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    const toEndOfDay = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

    let rangeStart, rangeEnd;

    // Handle date range logic
    if (!startDay && !endDay) {
      // Default: today
      const now = new Date();
      rangeStart = toStartOfDay(now);
      rangeEnd = toEndOfDay(now);
    } else if (startDay && !endDay) {
      const d = new Date(startDay);
      if (isNaN(d)) return res.status(400).json({ success: false, message: "Invalid startDay format" });
      rangeStart = toStartOfDay(d);
      rangeEnd = toEndOfDay(d);
    } else if (!startDay && endDay) {
      const d = new Date(endDay);
      if (isNaN(d)) return res.status(400).json({ success: false, message: "Invalid endDay format" });
      rangeStart = toStartOfDay(d);
      rangeEnd = toEndOfDay(d);
    } else {
      const s = new Date(startDay);
      const e = new Date(endDay);
      if (isNaN(s) || isNaN(e))
        return res.status(400).json({ success: false, message: "Invalid startDay or endDay format" });
      rangeStart = toStartOfDay(s);
      rangeEnd = toEndOfDay(e);
    }

    if (rangeStart > rangeEnd) {
      return res.status(400).json({ success: false, message: "startDay must be <= endDay" });
    }

    // Parse pagination params
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    // Build dynamic filter object
    const filter = {
      startDate: { $lte: rangeEnd },
      endDate: { $gte: rangeStart },
      status: "APPROVED"
    };

    // Add optional filters conditionally
    if (scheduleId && scheduleId.trim() !== '') {
      filter.scheduleLabel = scheduleId.trim();
    }

    if (routeId && routeId.trim() !== '') {
      filter.route = routeId.trim();
    }

    if (vehicleNumber && vehicleNumber.trim() !== '') {
      // Case-insensitive search for vehicle number
      filter.vehicleNumber = { $regex: new RegExp(vehicleNumber.trim(), 'i') };
    }

    // For regionId and depotId, we need to use aggregation or populate+filter
    // Since these are in related collections, we'll use aggregation for efficiency
    
    let query;
    
    if (regionId || depotId) {
      // Use aggregation pipeline when filtering by region or depot
      const pipeline = buildAggregationPipeline(filter, regionId, depotId, skip, limitNum);
      
      const [results, countResult] = await Promise.all([
        TripConfig.aggregate(pipeline),
        TripConfig.aggregate([
          { $match: filter },
          ...(depotId ? [{
            $lookup: {
              from: 'depotcustomers',
              localField: 'depot',
              foreignField: '_id',
              as: 'depotData'
            }
          }, {
            $match: { 'depotData._id': new mongoose.Types.ObjectId(depotId) }
          }] : []),
          ...(regionId ? [{
            $lookup: {
              from: 'depotcustomers',
              localField: 'depot',
              foreignField: '_id',
              as: 'depotData'
            }
          }, {
            $match: { 'depotData.region': new mongoose.Types.ObjectId(regionId) }
          }] : []),
          { $count: 'total' }
        ])
      ]);

      const total = countResult[0]?.total || 0;
      const totalPages = Math.ceil(total / limitNum);

      return res.status(200).json({
        success: true,
        range: { startDay: rangeStart, endDay: rangeEnd },
        filters: {
          scheduleId: scheduleId || undefined,
          regionId: regionId || undefined,
          depotId: depotId || undefined,
          vehicleNumber: vehicleNumber || undefined,
          routeId: routeId || undefined
        },
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        count: results.length,
        data: results
      });
    } else {
      // Simple query without region/depot filters
      const [total, trips] = await Promise.all([
        TripConfig.countDocuments(filter),
        TripConfig.find(filter)
          .populate('route', 'routeName routeCode routeLength source destination')
          .populate('depot', 'depotName depotCode region')
          .populate('scheduleLabel', 'scheduleLabel scheduleKm')
          .skip(skip)
          .limit(limitNum)
          .sort({ startDate: -1 })
          .lean()
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return res.status(200).json({
        success: true,
        range: { startDay: rangeStart, endDay: rangeEnd },
        filters: {
          scheduleId: scheduleId || undefined,
          regionId: regionId || undefined,
          depotId: depotId || undefined,
          vehicleNumber: vehicleNumber || undefined,
          routeId: routeId || undefined
        },
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        count: trips.length,
        data: trips
      });
    }
  } catch (error) {
    console.error("Error fetching trips by day range:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching trips by day range",
      error: error.message
    });
  }
};


function buildAggregationPipeline(baseFilter, regionId, depotId, skip, limit) {
  const pipeline = [
    { $match: baseFilter }
  ];

  // Lookup depot information
  if (depotId || regionId) {
    pipeline.push({
      $lookup: {
        from: 'depotcustomers',
        localField: 'depot',
        foreignField: '_id',
        as: 'depotData'
      }
    });

    pipeline.push({
      $unwind: {
        path: '$depotData',
        preserveNullAndEmptyArrays: false
      }
    });

    // Filter by depotId if provided
    if (depotId) {
      pipeline.push({
        $match: {
          'depotData._id': new mongoose.Types.ObjectId(depotId)
        }
      });
    }

    // Filter by regionId if provided
    if (regionId) {
      pipeline.push({
        $match: {
          'depotData.region': new mongoose.Types.ObjectId(regionId)
        }
      });
    }
  }

  // Lookup route information
  pipeline.push({
    $lookup: {
      from: 'routes',
      localField: 'route',
      foreignField: '_id',
      as: 'routeData'
    }
  });

  pipeline.push({
    $unwind: {
      path: '$routeData',
      preserveNullAndEmptyArrays: true
    }
  });

  // Sort, skip, and limit
  pipeline.push(
    { $sort: { startDate: -1 } },
    { $skip: skip },
    { $limit: limit }
  );

  // Project fields to match populate output
  pipeline.push({
    $project: {
      tripId: 1,
      origin: 1,
      destination: 1,
      originTime: 1,
      destinationTime: 1,
      startDate: 1,
      endDate: 1,
      cycleDay: 1,
      day: 1,
      status: 1,
      vehicleNumber: 1,
      scheduleLabel: 1,
      route: '$routeData',
      depot: {
        _id: '$depotData._id',
        depotName: '$depotData.depotName',
        depotCode: '$depotData.depotCode',
        region: '$depotData.region'
      },
      createdAt: 1,
      updatedAt: 1
    }
  });

  return pipeline;
}
