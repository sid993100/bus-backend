import mongoose from "mongoose";
import VltDevice from "../../../models/vltDeviceModel.js";

export const getVltDevices=async (req,res) => {
  const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
      const vltDevice= await VltDevice.find({})
      if (!vltDevice||vltDevice.length===0) {
         return res.status(404).json({
            message: "Vlt Device Not Found",
            });
      }
       return res.status(200).json({
        message:vltDevice,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addVltDevices=async (req,res) => {
  const user=req.user
  const {vlt,
        imeiNumber,
        iccid,
        region,
    customer}=req.body

  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!vlt||!imeiNumber||!iccid||!region||!customer){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const vltDevice= await VltDevice.create({
        vlt,
        imeiNumber,
        iccid,
        region,
        customer
      })
      
      if(!vltDevice){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:vltDevice
      }) 
     } catch (error) {
      console.log(error);
      
       return res.status(500).json({
        message:"Server Error"
         })
     }
}

export const updateVltDevices = async (req, res) => {
  try {
    const { id } = req.params;
    const { vlt, imeiNumber, iccid, region, customer } = req.body;


    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid VltDevice ID format"
      });
    }

    // Require at least one field to update
    if (
      vlt === undefined &&
      imeiNumber === undefined &&
      iccid === undefined &&
      region === undefined &&
      customer === undefined
    ) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    // Build update object dynamically
    const updateData = {};
    if (vlt !== undefined) updateData.vlt = vlt;
    if (imeiNumber !== undefined) updateData.imeiNumber = imeiNumber;
    if (iccid !== undefined) updateData.iccid = iccid;
    if (region !== undefined) updateData.region = region;
    if (customer !== undefined) updateData.customer = customer;

    // Update in DB
    const updatedDevice = await VltDevice.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedDevice) {
      return res.status(404).json({
        message: "VltDevice not found"
      });
    }

    res.status(200).json({
      message: "VltDevice updated successfully",
      data: updatedDevice
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};
