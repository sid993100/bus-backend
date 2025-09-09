import mongoose from "mongoose";
import PisManufacturer from "../../models/pisManufacturerModel.js";




export const getPisManufacturer=async (req,res) => {

     try {
      const pisManufacturer= await PisManufacturer.find({})
      if (!pisManufacturer) {
         return res.status(404).json({
            message: "Pis Make Not Found",
            });
      }
        res.status(200).json({
        message:pisManufacturer,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:error.name
         })
     }
}
export const addPisManufacturer =async (req,res) => {

  const {name,shortName}=req.body

  
     if(!name){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const pis = await PisManufacturer.create({
        shortName,
        name
      })
      
      if(!pis){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Pis "
             })
      }
      res.status(201).json({
        message:"created",
        data:pis
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
export const updatePisManufacturer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, shortName } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid VehicleManufacturer ID format"
      });
    }

    // Require at least one field to update
    if (name === undefined && shortName === undefined) {
      return res.status(400).json({
        message: "At least one field (name or shortName) is required to update"
      });
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (shortName !== undefined) updateData.shortName = shortName;

    // Update in DB
    const updatedManufacturer = await PisManufacturer.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedManufacturer) {
      return res.status(404).json({
        message: "PisManufacturer not found"
      });
    }

    res.status(200).json({
      message: "PisManufacturer updated successfully",
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

