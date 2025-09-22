import Subscription from "../../../models/subscriptionModel.js";
import consoleManager from "../../../utils/consoleManager.js";
import mongoose from "mongoose";

export const getSubscription   = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({}).populate({
      path: 'plan',
      select: 'planName durationDays'
    },{path:"VltDevice",select:"VltDevice"});
    
    if (!subscriptions) {
      return res.status(404).json({ message: "No Subscriptions Found" });
    }
    
    return res.status(200).json({
      message: subscriptions // Sending in 'message' to match your other services
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


export const addSubscription =async (req,res) => {
  const {vehicleNumber,vltdDevice,plan,activePlan,expiry}=req.body

     if(!vehicleNumber||!vltdDevice||!plan||!activePlan||!expiry){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const subscription = await Subscription.create({
            vehicleNumber,
            vltdDevice,
            plan,
            activePlan,
            expiry
      })
      
      if(!subscription){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Subscription "
             })
      }
      res.status(201).json({
        message:"created",
        data:subscription
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

export const updateSubscription = async (req, res) => {
  const { id } = req.params;
  const { vehicleNumber, vltdDevice, plan, activePlan, expiry } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Subscription ID format" });
  }

  try {
    const updateData = { vehicleNumber, vltdDevice, plan, activePlan, expiry };

    const updatedSubscription = await Subscription.findByIdAndUpdate(id, updateData, { new: true })
      .populate({
        path: 'plan',
        select: 'planName durationDays'
      });

    if (!updatedSubscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    
    return res.status(200).json({
      message: "Subscription updated successfully",
      data: updatedSubscription
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};