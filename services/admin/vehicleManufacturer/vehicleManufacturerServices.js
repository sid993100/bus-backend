import mongoose from "mongoose";
import VehicleManufacturer from "../../../models/vehiclemanufacturerModel.js";

export const getVehicleManufacturer=async (req,res) => {
  const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
      const vehicleManufacturer= await VehicleManufacturer.find({})
      if (!vehicleManufacturer) {
         return res.status(404).json({
            message: "Vlt Device Not Found",
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
  const user=req.user
  const {make,shortName}=req.body

  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
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
        res.status(500).json({
        message:error.errmsg
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
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server Error"
    });
  }
}

