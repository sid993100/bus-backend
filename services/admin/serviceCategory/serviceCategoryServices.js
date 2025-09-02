import mongoose from "mongoose";
import ServiceCategory from "../../../models/serviceCategoryModel.js";

export const getServiceCategory= async (req,res)=>{
     
   try {
      const serviceCategory=await ServiceCategory.find({})
      if(!serviceCategory){
          return res.status(404).json({
            message: "Service Category Type Not Found",
          });
      }
 
      return res.status(200).json({
        message:serviceCategory
       }) 
   } catch (error) {
    
      return res.status(500).json({
        message:"Backend Error"
    })
   }

};
export const addServiceCategory=async (req,res) => {
   const user=req.user
  const {name,description}=req.body
  
   
     if(!name){
       return res.status(404).json({
            message:"All details Required"
         })
     }

  try {    
      const serviceCategory= await ServiceCategory.create({
       serviceCategory:name,
        description
      })
      
      
      if(!serviceCategory){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:serviceCategory
      })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Service Category already exists"
      });
    }
    return res.status(500).json({
        message:"Server Error"
         })
  }
};

export const updateServiceCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ServiceCategory ID format",
      });
    }

    // Require at least one field
    if (name === undefined && description === undefined) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.serviceCategory = name;
    if (description !== undefined) updateData.description = description;

    // Update in DB
    const updatedServiceCategory = await ServiceCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedServiceCategory) {
      return res.status(404).json({
        message: "ServiceCategory not found",
      });
    }

    res.status(200).json({
      message: "ServiceCategory updated successfully",
      data: updatedServiceCategory,
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Service Category already exists"
      });
    }
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};
