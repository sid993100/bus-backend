import mongoose from "mongoose";
import VltDevice from "../../../models/vltDeviceModel.js";
import consoleManager from "../../../utils/consoleManager.js";
import VltdManufacturer from "../../../models/vltdManufacturerModel.js";


const populatedFields=[
        {path:"vlt",select:"manufacturerName modelName" },
        // {path:"region",select:"regionName" },
        // {path:"customer",select:"depotCustomer" }
       ]
       
export const getVltDevices = async (req, res) => {
  try {
    const vltDevice = await VltDevice.find({}).populate(populatedFields);

    if (!vltDevice || vltDevice.length === 0) {
      return res.status(404).json({
        message: "Vlt Device Not Found",
      });
    }

    // Await all async mapping and assign the result!
    const newVltd = await Promise.all(
      vltDevice.map(async v => {
        const vltM = await VltdManufacturer.findOne({ manufacturerName: v.vlt.manufacturerName });
        if (vltM && vltM.shortName) {
          v.vlt.manufacturerName = vltM.shortName;
        }
        return v;
      })
    );

    return res.status(200).json({
      message: newVltd,
      log:"ok"
    });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const addVltDevices=async (req,res) => {

  const {vlt,
        imeiNumber,
        iccid,
        region,
    customer}=req.body

  
     if(!vlt||!imeiNumber||!iccid||!region||!customer){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try { 
      const existVltd= await VltDevice.findOne({imeiNumber})
      if(existVltd){
        return res.status(409).json({
           message:"Vltd Exists"
        })
      }    
 
        const vltDevice= await VltDevice.create({
        vlt,
        imeiNumber,
        iccid,
        region,
        customer
      })
      
      if(!vltDevice){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Vlt Device "
             })
      }
      res.status(201).json({
        message:"created",
        data:vltDevice
      }) 
     } catch (error) {
      consoleManager.log(error);
      
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

    // Only check for duplicate IMEI if imeiNumber is provided in update
    if (imeiNumber !== undefined) {
      // Make sure no other device (with a different id) has this imeiNumber
      const existVltd = await VltDevice.findOne({ imeiNumber, _id: { $ne: id } });
      if (existVltd) {
        return res.status(409).json({
          message: "IMEI already exists for another device"
        });
      }
    }

    // Update in DB
    const updatedDevice = await VltDevice.findByIdAndUpdate(id, updateData, { new: true }).populate(populatedFields);

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

