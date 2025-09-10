
import mongoose from "mongoose";
import Plan from "../../../models/planModel.js";
import consoleManager from "../../../utils/consoleManager.js";

export const getPlan=async (req,res) => {
       const populatedFields=[
        {path:"vltdManufacturer",select:"manufacturerName modelName" },
        {path:"vltdModel",select:"modelName" }
       ]
     try {
      const plan= await Plan.find({}).populate(populatedFields)
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

  const {planName,vltdManufacturer,vltdModel,durationDays}=req.body

    
     if(!planName||!vltdManufacturer||!durationDays||!vltdModel){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const plan = await Plan.create({
        planName,
        vltdManufacturer,
        durationDays,
        vltdModel
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
    const { planName, vltdManufacturer, durationDays, vltdModel } = req.body;

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
      durationDays === undefined &&
      vltdModel === undefined
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
    if (vltdModel !== undefined) updateData.vltdModel = vltdModel;

    const updatedPlan = await Plan.findByIdAndUpdate(id, updateData, { new: true })
    .populate([{path:"vltdManufacturer",select:"manufacturerName modelName" },
      {path:"vltdModel",select:"modelName" }
    ])
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
