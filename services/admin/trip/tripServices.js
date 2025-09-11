import TripConfig from "../../../models/tripModel.js";

export const addTrip = async (req, res) => {
  const {
    depot, seatLayout, busService, route, origin, destination,
    originTime, destinationTime, arrivalDay, cycleDay,
    reservation, currentBooking, fareType, configuredStops
  } = req.body;

  if (!depot || !seatLayout || !busService || !route || !origin || !destination || !originTime || !destinationTime || !configuredStops) {
    return res.status(400).json({ message: "All required details must be provided" });
  }

  try {
    const existingTrip = await TripConfig.findOne({
      busService,
      originTime,
      origin,
      destination
    });

    if (existingTrip) {
      return res.status(409).json({ message: `A trip with service ${busService} already exists for ${origin} to ${destination} at ${originTime}.` });
    }

    const trip = await TripConfig.create({
      depot, seatLayout, busService, route, origin, destination,
      originTime, destinationTime, arrivalDay, cycleDay,
      reservation, currentBooking, fareType, configuredStops,
      status: 'PENDING'
    });

    if (!trip) {
      return res.status(500).json({ message: "Something went wrong while creating the trip" });
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

export const getTrips = async (req, res) => {
  try {
    const trips = await TripConfig.find()
      .populate('depot', 'depotCustomer')
      .populate('seatLayout', 'layoutName')
      .populate('route', 'routeName');

    if (!trips) {
      return res.status(404).json({ message: "No trips found" });
    }

    return res.status(200).json({
      message: "Trips retrieved successfully",
      data: trips,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};


export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const trip = await TripConfig.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    return res.status(200).json({
      message: "Trip updated successfully",
      data: trip,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Internal server error" });
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

// export const delayTrip = async(req,res)=>{

//  try {
//     const { id } = req.params;
//     const updateData = req.body;

//     const trip = await TripConfig.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     if (!trip) {
//       return res.status(404).json({ message: "Trip not found" });
//     }

//     return res.status(200).json({
//       message: "Trip Delay successfully",
//       data: trip,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: error.message || "Internal server error" });
//   }

  
// }



