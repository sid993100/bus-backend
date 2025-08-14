import mongoose from "mongoose";
import SimService from "../../../models/simServiceModel.js";

export const getSim=async (req,res) => {
  const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
      const sim= await SimService.find({})
      if (!sim) {
         return res.status(404).json({
            message: "Sim Not Found",
            });
      }
        res.status(200).json({
        message:sim,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addSim=async (req,res) => {
  const user=req.user
  const {name,shortName}=req.body

  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!name||!shortName){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const sim= await SimService.create({
       serviceProviderName:name,
       shortName,
      })
      
      if(!sim){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Sim "
             })
      }
      res.status(201).json({
        message:"created",
        data:sim
      }) 
     } catch (error) {
      console.log(error);
      
       return res.status(500).json({
        message:"Server Error"
         })
     }
}

export const updateSim = async (req, res) => {
  try {
  
    const { id } = req.params;
    const { name, shortName } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid Sim ID format",
      });
    }

    // Require at least one field to update
    if (name === undefined && shortName === undefined) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    // Build dynamic update object
    const updateData = {};
    if (name !== undefined) updateData.serviceProviderName = name;
    if (shortName !== undefined) updateData.shortName = shortName;

    // Perform the update
    const updatedSim = await SimService.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedSim) {
      return res.status(404).json({
        message: "Sim not found",
      });
    }

    res.status(200).json({
      message: "Sim updated successfully",
      data: updatedSim,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};
