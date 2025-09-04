
import TripConfig from "../../../models/tripModel.js";


export const addTrip = async (req, res) => {
  const {
    tripId,
    scheduleLabel,
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
  } = req.body;

  // Updated validation to include all required fields from schema
  if (
    // !tripId ||
    !depot ||
    !seatLayout ||
    !busService ||
    !route ||
    !origin ||
    !destination ||
    !originTime ||
    !destinationTime
  ) {
    return res.status(400).json({
      message: "All required details must be provided",
    });
  }

  try {
    const trip = await TripConfig.create({
      tripId: tripId,
      scheduleLabel: scheduleLabel?.toUpperCase(),
      depot,
      seatLayout,
      busService,
      route,
      origin,
      destination,
      originTime,
      destinationTime,
      arrivalDay: arrivalDay || 1,
      cycleDay: cycleDay || 'Daily',
      reservation: reservation || 'Yes',
      currentBooking: currentBooking || 'Yes',
      fareType: fareType || 'KM Based',
      status: 'PENDING'
    });

    if (!trip) {
      return res.status(500).json({
        message: "Something went wrong while creating the trip",
      });
    }

    return res.status(201).json({
      message: "Trip created successfully",
      data: trip,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message || "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Get all trips
export const getTrip = async (req, res) => {
  try {
    const trips = await TripConfig.find()

  if (!trips) {
      return res.status(404).json({
        message: "No trips found",
      });
    }

    return res.status(200).json({
      message: "Trips retrieved successfully",
      data: trips,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

// Get trip by ID
export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const trip = await TripConfig.findById(id)


    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      message: "Trip retrieved successfully",
      data: trip,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

// Update trip
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Convert strings to uppercase if needed
    if (updateData.tripId) updateData.tripId = updateData.tripId.toUpperCase();
    if (updateData.scheduleLabel) updateData.scheduleLabel = updateData.scheduleLabel.toUpperCase();

    const trip = await TripConfig.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      message: "Trip updated successfully",
      data: trip,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

// Delete trip
export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await TripConfig.findByIdAndDelete(id);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};



