import mongoose from "mongoose";
import ServiceType from "../../../models/serviceTypeModel.js";
import consoleManager from "../../../utils/consoleManager.js";

export const getServiceType=async (req,res) => {
     try {
      const serviceType= await ServiceType.find({})
      if(!serviceType){
          return res.status(404).json({
            message: "Service Type Not Found",
            });
      }
      return res.status(200).json({
        message:serviceType,
        log:"ok"
       })

     } catch (error) {
      return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addServiceType=async (req,res) => {
   const user=req.user
  const {code,name,tollType,sleeperCharges,resCharge,reservationCharges,childDiscount,perKmFare,account,fare,category}=req.body
  
  
     if(!code||!name||!tollType||!sleeperCharges||!resCharge||!reservationCharges||!childDiscount||!perKmFare||!account||!fare||!category){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {
      const serviceType=await ServiceType.create({
        code,
        name,
        tollType,
        sleeperCharges,
        resCharge,
        reservationCharges,
        childDiscount,
        perKmFare,
        account,
        fare,
        category
      })
      if(!serviceType){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }


     return res.status(201).json({
        message:"created",
        data:serviceType
      })
     } catch (error) {
      consoleManager.log(error);
      
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const updateServiceType = async (req, res) => {
  try {

    const { id } = req.params;
    const {
      code,
      name,
      tollType,
      sleeperCharges,
      resCharge,
      reservationCharges,
      childDiscount,
      perKmFare,
      account,
      fare,
      category
    } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ServiceType ID format"
      });
    }

    // Require at least one field to update
    if (
      code === undefined &&
      name === undefined &&
      tollType === undefined &&
      sleeperCharges === undefined &&
      resCharge === undefined &&
      reservationCharges === undefined &&
      childDiscount === undefined &&
      perKmFare === undefined &&
      account === undefined &&
      fare === undefined &&
      category === undefined
    ) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    // Build dynamic update object
    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (tollType !== undefined) updateData.tollType = tollType;
    if (sleeperCharges !== undefined) updateData.sleeperCharges = sleeperCharges;
    if (resCharge !== undefined) updateData.resCharge = resCharge;
    if (reservationCharges !== undefined) updateData.reservationCharges = reservationCharges;
    if (childDiscount !== undefined) updateData.childDiscount = childDiscount;
    if (perKmFare !== undefined) updateData.perKmFare = perKmFare;
    if (account !== undefined) updateData.account = account;
    if (fare !== undefined) updateData.fare = fare;
    if (category !== undefined) updateData.category = category;

    // Update in DB
    const updatedServiceType = await ServiceType.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedServiceType) {
      return res.status(404).json({
        message: "ServiceType not found"
      });
    }

    res.status(200).json({
      message: "ServiceType updated successfully",
      data: updatedServiceType
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};
