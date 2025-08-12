import mongoose from "mongoose";
import Trip from "../../../models/tripModel.js";

export const getTrip = async (req, res) => {
  try {
    const trips = await Trip.find({});
    if (!trips || trips.length == 0) {
      return res.status(404).json({
        message: "Trip Not Found",
      });
    }
    res.status(200).json({
      message: trips,
      log: "ok",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
export const addTrip = async (req, res) => {
  const {
    tripId,
    scheduleLabel,
    depot,
    seatLayout,
    busService,
    route,
    originTime,
    destinationTime,
  } = req.body;

  if (
    !tripId ||
    !depot ||
    !seatLayout ||
    !busService ||
    !route ||
    !originTime ||
    !destinationTime
  ) {
    return res.status(404).json({
      message: "All details Required",
    });
  }
  try {
    const trip = await Trip.create({
      tripId,
      scheduleLabel,
      depot,
      seatLayout,
      busService,
      route,
      originTime,
      destinationTime,
    });

    if (!trip) {
      res.status(500).json({
        message: "Somthing went Wrong while Creating A Trip ",
      });
    }
    res.status(201).json({
      message: "created",
      data: trip,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.errmsg,
    });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      tripId,
      scheduleLabel,
      depot,
      seatLayout,
      busService,
      route,
      originTime,
      destinationTime,
      status
    } = req.body;


    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid Trip ID format",
      });
    }

    // Ensure at least one field is provided to update
    if (
      tripId === undefined &&
      scheduleLabel === undefined &&
      depot === undefined &&
      seatLayout === undefined &&
      busService === undefined &&
      route === undefined &&
      originTime === undefined &&
      destinationTime === undefined &&
      status===undefined
    ) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    // Build dynamic update object
    const updateData = {};
    if (tripId !== undefined) updateData.tripId = tripId;
    if (scheduleLabel !== undefined) updateData.scheduleLabel = scheduleLabel;
    if (depot !== undefined) updateData.depot = depot;
    if (seatLayout !== undefined) updateData.seatLayout = seatLayout;
    if (busService !== undefined) updateData.busService = busService;
    if (route !== undefined) updateData.route = route;
    if (originTime !== undefined) updateData.originTime = originTime;
    if (destinationTime !== undefined) updateData.destinationTime = destinationTime;
    if (status !== undefined) updateData.status = status

    // Update in DB
    const updatedTrip = await Trip.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedTrip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    res.status(200).json({
      message: "Trip updated successfully",
      data: updatedTrip,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};


