import SeatLayout from "../../../models/seatLayoutModel.js";
import mongoose from "mongoose";

export const getSeatLayout = async (req, res) => {
  try {
    // Populate the servicesLinked field to get service details
    const seatLayouts = await SeatLayout.find({}).populate('servicesLinked', 'name');
    if (!seatLayouts) {
      return res.status(200).json({
        message: [], // Return empty array if not found
      });
    }
    console.log(seatLayouts);
    
    res.status(200).json({
      message: seatLayouts
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

export const addSeatLayout = async (req, res) => {
  try {
    const { layoutName, seatCapacity, department, servicesLinked, fci, floors } = req.body;

    // Correct validation based on the updated model
    if (!layoutName || !seatCapacity || !department || !servicesLinked || !fci || !floors) {
      return res.status(400).json({
        message: "All fields are required: layoutName, seatCapacity, department, servicesLinked, fci, floors."
      });
    }

    const newSeatLayout = new SeatLayout({
      layoutName,
      seatCapacity,
      department,
      servicesLinked,
      fci,
      floors
    });

    const savedLayout = await newSeatLayout.save();
    
    // Populate the newly created layout to send back full data
    const populatedLayout = await SeatLayout.findById(savedLayout._id).populate('servicesLinked', 'name');

    res.status(201).json({
      message: "SeatLayout created successfully",
      data: populatedLayout
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation Error",
        errors: error.message
      });
    }
     if (error.code === 11000) { // Handle duplicate key error for layoutName
      return res.status(409).json({ message: 'A seat layout with this name already exists.' });
    }
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

export const updateSeatLayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { layoutName, seatCapacity, department, servicesLinked, fci, floors } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid SeatLayout ID format",
      });
    }

    const updateData = {
      layoutName,
      seatCapacity,
      department,
      servicesLinked,
      fci,
      floors
    };

    const updatedSeatLayout = await SeatLayout.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('servicesLinked', 'name');

    if (!updatedSeatLayout) {
      return res.status(404).json({
        message: "SeatLayout not found",
      });
    }

    res.status(200).json({
      message: "SeatLayout updated successfully",
      data: updatedSeatLayout,
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation Error",
        errors: error.message,
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A seat layout with this name already exists.' });
    }
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};