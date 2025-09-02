import mongoose from "mongoose";
import VehicleManufacturer from "../../../models/vehiclemanufacturerModel.js";

export const getVehicleManufacturer=async (req,res) => {

     try {
      const vehicleManufacturer= await VehicleManufacturer.find({})
      if (!vehicleManufacturer) {
         return res.status(404).json({
            message: "Vehicle Make Not Found",
            });
      }
        res.status(200).json({
        message:vehicleManufacturer,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addVehicleManufacturer =async (req,res) => {

  const {make,shortName}=req.body

  
     if(!make){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const vehicle = await VehicleManufacturer.create({
        shortName,
        make
      })
      
      if(!vehicle){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:vehicle
      }) 
     } catch (error) {
      if (error.code === 11000) {
      return res.status(409).json({
        message: "Already exists"
      });
    }
        res.status(500).json({
        message:error.message
         })
     }
}
export const updateVehicleManufacturer = async (req, res) => {
  try {
    const { id } = req.params;
    const { make, shortName } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid VehicleManufacturer ID format"
      });
    }

    // Require at least one field to update
    if (make === undefined && shortName === undefined) {
      return res.status(400).json({
        message: "At least one field (make or shortName) is required to update"
      });
    }

    // Build update object
    const updateData = {};
    if (make !== undefined) updateData.make = make;
    if (shortName !== undefined) updateData.shortName = shortName;

    // Update in DB
    const updatedManufacturer = await VehicleManufacturer.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedManufacturer) {
      return res.status(404).json({
        message: "VehicleManufacturer not found"
      });
    }

    res.status(200).json({
      message: "VehicleManufacturer updated successfully",
      data: updatedManufacturer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Already exists"
      });
    }
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server Error"
    });
  }
}

