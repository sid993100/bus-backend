import Subscription from "../../../models/subscriptionModel.js";
import VltDevice from "../../../models/vltDeviceModel.js";
import consoleManager from "../../../utils/consoleManager.js";
import mongoose from "mongoose";

// Get Subscriptions by Region (checking through VltDevice)
export const getSubscriptionsByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(regionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid region ID format"
      });
    }

    // First, find all VltDevices in the specified region
    const vltDevices = await VltDevice.find({ region: regionId }).select('_id');
    const vltDeviceIds = vltDevices.map(device => device._id);

    if (vltDeviceIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No VLT devices found in this region"
      });
    }

    // Find subscriptions for these VltDevices
    const subscriptions = await Subscription.find({
      vltdDevice: { $in: vltDeviceIds }
    }).populate([
      {
        path: 'plan',
        select: 'planName durationDays price'
      },
      {
        path: "vltdDevice",
        select: "imeiNumber region customer",
        populate: [
          { path: 'region', select: 'name code' },
          { path: 'customer', select: 'depotCustomer depotCode' }
        ]
      }
    ]).sort({ createdAt: -1 });

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subscriptions found for this region"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscriptions retrieved successfully for region",
      data: subscriptions,
      count: subscriptions.length,
      regionId: regionId
    });

  } catch (error) {
    console.error('Error fetching subscriptions by region:', error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Get Subscriptions by Depot (checking through VltDevice)
export const getSubscriptionsByDepot = async (req, res) => {
  try {
    const { depotId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(depotId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid depot ID format"
      });
    }

    // First, find all VltDevices in the specified depot
    const vltDevices = await VltDevice.find({ customer: depotId }).select('_id');
    const vltDeviceIds = vltDevices.map(device => device._id);

    if (vltDeviceIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No VLT devices found in this depot"
      });
    }

    // Find subscriptions for these VltDevices
    const subscriptions = await Subscription.find({
      vltdDevice: { $in: vltDeviceIds }
    }).populate([
      {
        path: 'plan',
        select: 'planName durationDays price'
      },
      {
        path: "vltdDevice",
        select: "imeiNumber region customer",
        populate: [
          { path: 'region', select: 'name code' },
          { path: 'customer', select: 'depotCustomer depotCode' }
        ]
      }
    ]).sort({ createdAt: -1 });

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subscriptions found for this depot"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscriptions retrieved successfully for depot",
      data: subscriptions,
      count: subscriptions.length,
      depotId: depotId
    });

  } catch (error) {
    console.error('Error fetching subscriptions by depot:', error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};



export const getSubscription   = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({}).populate([{
      path: 'plan',
      select: 'planName durationDays'
    },{path:"vltdDevice",select:"imeiNumber"}]);
    
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