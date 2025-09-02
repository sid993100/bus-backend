
import mongoose from "mongoose";
import Plan from "../../../models/planModel.js";
import consoleManager from "../../../utils/consoleManager.js";

export const getPlan=async (req,res) => {
  const user = req.user;
       
     try {
      const plan= await Plan.find({})
      if (!plan) {
         return res.status(404).json({
            message: "Plan Not Found",
            });
      }
        res.status(200).json({
        message:plan,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addPlan =async (req,res) => {

  const {planName,vltdManufacturer,durationDays}=req.body

    
     if(!planName||!vltdManufacturer||!durationDays){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const plan = await Plan.create({
        planName,
        vltdManufacturer,
        durationDays
      })
      
      if(!plan){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Plan "
             })
      }
      res.status(201).json({
        message:"created",
        data:plan
      }) 
     } catch (error) {
      consoleManager.log(error);
      
        if (error.code === 11000) {
      return res.status(409).json({
        message: "Already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
     }
}
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params; // Plan ID from URL
    const { planName, vltdManufacturer, durationDays } = req.body;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        message: "Plan ID is required",
      });
    }

    // Require at least one field to update
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Plan ID format" });
    }

      if (
      planName === undefined &&
      vltdManufacturer === undefined &&
      durationDays === undefined
    ) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    // Update Plan
      const updateData = {};
    if (planName !== undefined) updateData.planName = planName;
    if (vltdManufacturer !== undefined) updateData.vltdManufacturer = vltdManufacturer;
    if (durationDays !== undefined) updateData.durationDays = durationDays;

    const updatedPlan = await Plan.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedPlan) {
      return res.status(404).json({
        message: "Plan not found",
      });
    }

    res.status(200).json({
      message: "Plan updated successfully",
      data: updatedPlan,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
