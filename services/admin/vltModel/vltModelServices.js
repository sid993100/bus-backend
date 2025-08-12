import mongoose from "mongoose";
import VltdModel from "../../../models/vltdModelModel.js";

export const getVltModel=async (req,res) => {
  const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
      const vltModel= await VltdModel.find({})
      if (!vltModel||vltModel.length===0) {
         return res.status(404).json({
            message: "Vlt Model Not Found",
            });
      }
        res.status(200).json({
        message:vltModel
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addVltModel=async (req,res) => {
  const user=req.user
  const {name,modelName}=req.body

  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!name||!modelName){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const vltModel = await VltdModel.create({
        manufacturerName:name,
        modelName
      })
      
      if(!vltModel){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:vltModel
      }) 
     } catch (error) {
        res.status(500).json({
        message:error.errmsg
         })
     }
}

export const updateVltModel = async (req, res) => {
  try {
 
    const { id } = req.params;
    const { name, modelName } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid VltModel ID format"
      });
    }

    // Require at least one field to update
    if (name === undefined && modelName === undefined) {
      return res.status(400).json({
        message: "At least one field (name or modelName) is required to update"
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.manufacturerName = name;
    if (modelName !== undefined) updateData.modelName = modelName;

    // Perform update
    const updatedVltModel = await VltdModel.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedVltModel) {
      return res.status(404).json({
        message: "VltModel not found"
      });
    }

    res.status(200).json({
      message: "VltModel updated successfully",
      data: updatedVltModel
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};
