import TripConfig from "../../../models/tripModel.js";
import { isValidObjectId, Types } from "mongoose";

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
      return res
        .status(400)
        .json({ success: false, message: "Invalid region ID" });
    }

    const regionObjId = new Types.ObjectId(regionId);
    const { pageNum, limitNum, skip, sort, textFilter } =
      buildTripQueryParams(req);

    // Use the same $match for both data and count pipelines to keep totals accurate
    const matchStage = [{ $match: { ...textFilter } }];

    const dataPipeline = [
      ...matchStage,
      {
        $lookup: {
          from: "routes", // ensure this matches Route collection name
          localField: "route",
          foreignField: "_id",
          as: "route",
        },
      },
      { $unwind: "$route" },
      { $match: { "route.region": regionObjId } },
      // Optional lookups
      {
        $lookup: {
          from: "depotcustomers", // actual collection name for Depot model
          localField: "depot",
          foreignField: "_id",
          as: "depot",
        },
      },
      { $unwind: { path: "$depot", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "seatlayouts", // actual collection name for SeatLayout
          localField: "seatLayout",
          foreignField: "_id",
          as: "seatLayout",
        },
      },
      { $unwind: { path: "$seatLayout", preserveNullAndEmptyArrays: true } },
      { $sort: sort },
      { $skip: skip },
      { $limit: limitNum },
      {
        $project: {
          tripName: 1,
          tripCode: 1,
          createdAt: 1,
          depot: { depotCustomer: 1, code: 1, _id: 1 },
          seatLayout: { layoutName: 1, _id: 1 },
          route: { routeName: 1, depot: 1, region: 1, _id: 1 },
        },
      },
    ];

    const countPipeline = [
      ...matchStage,
      {
        $lookup: {
          from: "routes",
          localField: "route",
          foreignField: "_id",
          as: "route",
        },
      },
      { $unwind: "$route" },
      { $match: { "route.region": regionObjId } },
      { $count: "total" },
    ];

    const [items, countAgg] = await Promise.all([
      TripConfig.aggregate(dataPipeline),
      TripConfig.aggregate(countPipeline),
    ]);

    const total = countAgg[0]?.total || 0;

    // Always return success with data array; empty is not an error
    const totalPages = Math.ceil(total / limitNum);
    return res.status(200).json({
      success: true,
      message: items.length
        ? "Trips retrieved successfully"
        : "No trips found for region",
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
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal server error",
      });
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
    // Parse date
    const todayParam = req.query.today;
    const today = todayParam ? new Date(todayParam) : new Date();

    if (isNaN(today)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid date format. Please use YYYY-MM-DD or a valid ISO date.",
      });
    }

    // Convert today into start and end of the day
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Pagination setup
    const page = parseInt(req.query.page) || 1; // default page = 1
    const limit = parseInt(req.query.limit) || 10; // default limit = 10
    const skip = (page - 1) * limit;

    // Query filter
    const filter = {
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay },
      status: "APPROVED",
    };

    // Total count before pagination
    const total = await TripConfig.countDocuments(filter);

    // Get paginated trips
    const trips = await TripConfig.find(filter)
      .populate(tripPopulate)
      .skip(skip)
      .limit(limit)
      .sort({ startDate: 1 }); // optional sorting

    // Response
    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    console.error("Error fetching today's trips:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching today's trips",
      error: error.message,
    });
  }
};
