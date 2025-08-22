import mongoose from "mongoose";
import BusStop from "../../../models/busStopModel.js";

export const getBusStop= async (req,res)=>{
     const user = req.user;
    
     try {
        const busStop= await BusStop.find({})
        if(!busStop){
             return res.status(404).json({
            message: "Bus Stop Not Found",
          });
        }
         return res.status(200).json({
        message:busStop
       }) 
     } catch (error) {
         return res.status(500).json({
        message:"Backend Error"
         })
     }
};

export const addBusStop = async (req, res) => {
  try {
    const user = req.user;
    const {
      stopCode,
      stopName,
      fareStage,
      stopArea,
      border,
      country,
      state,
      district,
      villageTownName,
      pinCode,
      busStation,
      location,
      stopGrade
    } = req.body;

    // Validate required fields
    if (
      !stopCode ||
      !stopName ||
      fareStage === undefined ||
      !stopArea ||
      border === undefined ||
      !country ||
      !state ||
      busStation === undefined ||
      !location ||
      !stopGrade
    ) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(stopArea)) {
      return res.status(400).json({
        message: "Invalid stopArea ID format"
      });
    }
    if (!mongoose.Types.ObjectId.isValid(country)) {
      return res.status(400).json({
        message: "Invalid country ID format"
      });
    }
    if (!mongoose.Types.ObjectId.isValid(state)) {
      return res.status(400).json({
        message: "Invalid state ID format"
      });
    }
    if (!mongoose.Types.ObjectId.isValid(stopGrade)) {
      return res.status(400).json({
        message: "Invalid stopGrade ID format"
      });
    }

    // Validate location coordinates
    if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({
        message: "Location coordinates must be an array of [longitude, latitude]"
      });
    }

    // Create bus stop
    const busStop = await BusStop.create({
      stopCode,
      stopName,
      fareStage,
      stopArea,
      border,
      country,
      state,
      district,
      villageTownName,
      pinCode,
      busStation,
      location,
      stopGrade
    });

    res.status(201).json({
      message: "BusStop created successfully",
      data: busStop
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};

export const updateBusStop = async (req, res) => {
  try {
   
    const { id } = req.params;

    // Validate BusStop ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid BusStop ID format"
      });
    }

    // Check if at least one field is provided
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    // Validate ObjectIds if provided
    const objectIdFields = ['stopArea', 'country', 'state', 'stopGrade'];
    for (const field of objectIdFields) {
      if (req.body[field] && !mongoose.Types.ObjectId.isValid(req.body[field])) {
        return res.status(400).json({
          message: `Invalid ${field} ID format`
        });
      }
    }

    // Validate location coordinates if provided
    if (req.body.location && req.body.location.coordinates) {
      if (!Array.isArray(req.body.location.coordinates) || req.body.location.coordinates.length !== 2) {
        return res.status(400).json({
          message: "Location coordinates must be an array of [longitude, latitude]"
        });
      }
    }

    // Perform update
    const updatedBusStop = await BusStop.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedBusStop) {
      return res.status(404).json({
        message: "BusStop not found"
      });
    }

    res.status(200).json({
      message: "BusStop updated successfully",
      data: updatedBusStop
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};

