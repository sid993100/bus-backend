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
      const tripConfig = await TripConfig.findById(trip.trip).populate("route", "routeLength");
      if (!tripConfig) continue;
      if (!tripConfig.route || !tripConfig.route.routeLength) continue;

      totalKm += trip.day * tripConfig.route.routeLength;
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
      .populate('depot', 'depotCustomer depotCode location')
      .populate('seatLayout', 'layoutName totalSeats seatConfiguration')
      .populate('busService', 'name serviceType fare')
      // .populate([{path:'routeName', select:'routeName routeCode source destination routeLength',
      //   populate:[
      //     {path:"region",select:"name"},
      //     {path:"depot",select:"depotCustomer"}
      //   ]
      // }])
      .populate('scheduledTrips')
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

    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
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
        const tripConfig = await TripConfig.findById(trip.trip).populate("route", "routeLength");
        if (!tripConfig) continue;
        if (!tripConfig.route || !tripConfig.route.routeLength) continue;

        totalKm += trip.day * tripConfig.route.routeLength;
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
      .populate('depot', 'depotName depotCode')
      .populate('seatLayout', 'layoutName totalSeats')
      .populate('busService', 'serviceName serviceType')
      .populate('routeName', 'routeName routeCode source destination')
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