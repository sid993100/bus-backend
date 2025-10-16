import mongoose from "mongoose";
import VltDevice from "../../../models/vltDeviceModel.js";
import consoleManager from "../../../utils/consoleManager.js";
import VltdManufacturer from "../../../models/vltdManufacturerModel.js";

import { isValidObjectId } from "mongoose";
import { populate } from "dotenv";

const populatedFields = [
  { path: "vlt", select: "manufacturerName modelName",populate:{path:"manufacturerName",select:"shortName manufacturerName"} },
  // { path: "region", select: "name" },
  // { path: "customer", select: "depotCustomer" }
];

// Get VLT Devices by Region
export const getVltDevicesByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(regionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid region ID format"
      });
    }

    const vltDevices = await VltDevice.find({ region: regionId })
      .populate(populatedFields)
      .sort({ imeiNumber: 1 });

    if (!vltDevices || vltDevices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No VLT Devices found for this region"
      });
    }

    // Map async to update manufacturer names with short names
    const updatedVltDevices = await Promise.all(
      vltDevices.map(async (device) => {
        if (device.vlt && device.vlt.manufacturerName) {
          const vltManufacturer = await VltdManufacturer.findOne({ 
            manufacturerName: device.vlt.manufacturerName 
          });
          if (vltManufacturer && vltManufacturer.shortName) {
            device.vlt.manufacturerName = vltManufacturer.shortName;
          }
        }
        return device;
      })
    );

    return res.status(200).json({
      success: true,
      message: "VLT Devices retrieved successfully for region",
      data: updatedVltDevices,
      count: updatedVltDevices.length,
      regionId: regionId
    });

  } catch (error) {
    console.error('Error fetching VLT devices by region:', error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Get VLT Devices by Depot/Customer
export const getVltDevicesByDepot = async (req, res) => {
  try {
    const { depotId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(depotId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid depot ID format"
      });
    }

    const vltDevices = await VltDevice.find({ customer: depotId })
      .populate(populatedFields)
      .sort({ imeiNumber: 1 });

    if (!vltDevices || vltDevices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No VLT Devices found for this depot"
      });
    }

    // Map async to update manufacturer names with short names
    const updatedVltDevices = await Promise.all(
      vltDevices.map(async (device) => {
        if (device.vlt && device.vlt.manufacturerName) {
          const vltManufacturer = await VltdManufacturer.findOne({ 
            manufacturerName: device.vlt.manufacturerName 
          });
          if (vltManufacturer && vltManufacturer.shortName) {
            device.vlt.manufacturerName = vltManufacturer.shortName;
          }
        }
        return device;
      })
    );

    return res.status(200).json({
      success: true,
      message: "VLT Devices retrieved successfully for depot",
      data: updatedVltDevices,
      count: updatedVltDevices.length,
      depotId: depotId
    });

  } catch (error) {
    console.error('Error fetching VLT devices by depot:', error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Enhanced version with query parameters and filters
export const getVltDevicesByRegionAndDepot = async (req, res) => {
  try {
    const { regionId, depotId } = req.query;
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'imeiNumber', 
      sortOrder = 'asc',
      search,
      deviceStatus 
    } = req.query;

    // Build filter object
    const filter = {};
    if (regionId) {
      if (!isValidObjectId(regionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid region ID format"
        });
      }
      filter.region = regionId;
    }

    if (depotId) {
      if (!isValidObjectId(depotId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid depot ID format"
        });
      }
      filter.customer = depotId;
    }

    if (search) {
      filter.$or = [
        { imeiNumber: { $regex: search, $options: 'i' } },
        { iccid: { $regex: search, $options: 'i' } },
        { simNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (deviceStatus) {
      filter.deviceStatus = deviceStatus;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const vltDevices = await VltDevice.find(filter)
      .populate(populatedFields)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await VltDevice.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    if (!vltDevices || vltDevices.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No VLT Devices found for the specified criteria"
      });
    }

    // Map async to update manufacturer names with short names
    const updatedVltDevices = await Promise.all(
      vltDevices.map(async (device) => {
        if (device.vlt && device.vlt.manufacturerName) {
          const vltManufacturer = await VltdManufacturer.findOne({ 
            manufacturerName: device.vlt.manufacturerName 
          });
          if (vltManufacturer && vltManufacturer.shortName) {
            device.vlt.manufacturerName = vltManufacturer.shortName;
          }
        }
        return device;
      })
    );

    return res.status(200).json({
      success: true,
      message: "VLT Devices retrieved successfully",
      data: updatedVltDevices,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      filters: {
        ...(regionId && { regionId }),
        ...(depotId && { depotId })
      }
    });

  } catch (error) {
    console.error('Error fetching VLT devices:', error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};
       
export const getVltDevices = async (req, res) => {
  try {
    const vltDevice = await VltDevice.find({}).populate(populatedFields);

    if (!vltDevice ) {
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

