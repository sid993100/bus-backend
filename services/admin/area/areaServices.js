import mongoose from "mongoose";
import Area from "../../../models/areaModel.js";


export const addArea= async (req,res) => {
   
  const {area}=req.body

     if(!area){
       return res.status(404).json({
            message:"All details Required"
         })
     }
  try {
      const stopArea=await Area.create({
        area
      })
      if(!stopArea){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Stop Area "
             })
      }
      res.status(201).json({
        message:"created",
        data:stopArea
      })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Stop Area already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
  }
}

export const getArea=async (req,res) => {
      const user=req.user
   
  try {
      const stopArea=await Area.find({})
      if(!stopArea){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Stop Area "
             })
      }
      res.status(201).json({
         data:stopArea
      })
  } catch (error) {
    return res.status(500).json({
        message:"Server Error"
         })
  }
}

export const updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { area } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid Area ID format",
      });
    }

    // Check if area field is provided
    if (!area) {
      return res.status(400).json({
        message: "Area field is required to update",
      });
    }

    // Update the area
    const updatedArea = await Area.findByIdAndUpdate(
      id, 
      { area }, 
      { new: true } // Return the updated document
    );

    if (!updatedArea) {
      return res.status(404).json({
        message: "Area not found",
      });
    }

    res.status(200).json({
      message: "Area updated successfully",
      data: updatedArea,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};

export const updateAreaByName = async (req, res) => {
  try {
    const { name } = req.params;
    const { area } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Area name is required",
      });
    }

    if (!area) {
      return res.status(400).json({
        message: "Area field is required to update",
      });
    }

    const updatedArea = await Area.findOneAndUpdate(
      { area: name },
      { area },
      { new: true }
    );

    if (!updatedArea) {
      return res.status(404).json({
        message: "Area not found",
      });
    }

    res.status(200).json({
      message: "Area updated successfully",
      data: updatedArea,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};
