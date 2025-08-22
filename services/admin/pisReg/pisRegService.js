import mongoose from "mongoose";
import PisRegistration from "../../../models/pisRegisrationModel.js";

export const getpisReg= async (req,res) => {
     const user = req.user;
       
     try {
        const pisReg= await PisRegistration.find({})
        if(!pisReg){
            return res.status(404).json({
            message: "Duty Not Found",
            }); 
        }
          return res.status(200).json({
        message:pisReg,
        log:"ok"
       })
     } catch (error) {
         res.status(500).json({
        message:"Server Error"
         })
     }
}


export const addPisRegistration = async (req, res) => {
  try {

    const {
      stopName,
      screenId,
      serialNumber,
      ipAddress,
      port,
      pisManufacturer,
      pisType,
      pisModel,
      recordsFrame,
      numberOfServices,
      refreshTimeSeconds
    } = req.body;

    // Validate required fields
    if (
      !stopName ||
      !screenId ||
      !serialNumber ||
      !ipAddress ||
      !port ||
      !pisManufacturer ||
      !pisType ||
      !pisModel ||
      !recordsFrame ||
      !numberOfServices ||
      !refreshTimeSeconds
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // Validate stopName ObjectId
    if (!mongoose.Types.ObjectId.isValid(stopName)) {
      return res.status(400).json({
        message: "Invalid stopName (BusStop) ID format"
      });
    }

    // Create PIS registration
    const pisRegistration = await PisRegistration.create({
      stopName,
      screenId,
      serialNumber,
      ipAddress,
      port,
      pisManufacturer,
      pisType,
      pisModel,
      recordsFrame,
      numberOfServices,
      refreshTimeSeconds
    });

    res.status(201).json({
      message: "PisRegistration created successfully",
      data: pisRegistration
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};
 
export const updatePisRegistration = async (req, res) => {
  try {
 
    const { id } = req.params;

    // Validate PisRegistration ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid PisRegistration ID format"
      });
    }

    // Check if at least one field is provided
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    // If stopName is provided, validate ObjectId
    if (req.body.stopName && !mongoose.Types.ObjectId.isValid(req.body.stopName)) {
      return res.status(400).json({
        message: "Invalid stopName (BusStop) ID format"
      });
    }

    // Perform update
    const updatedPisRegistration = await PisRegistration.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedPisRegistration) {
      return res.status(404).json({
        message: "PisRegistration not found"
      });
    }

    res.status(200).json({
      message: "PisRegistration updated successfully",
      data: updatedPisRegistration
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};
