import mongoose from "mongoose";
import Vehicle from "../../../models/vehicleModel.js";

export const getVehicle=async (req,res) => {
     
     try {
      const vehicles= await Vehicle.find({})
      if (!vehicles) {
         return res.status(404).json({
            message: "Vehicle Not Found",
            });
      }
        res.status(200).json({
        message:vehicles,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:error.errmsg
         })
     }
}
export const addVehicle = async (req, res) => {
  try {
    
   const {
      vehicleNumber,
      seatLayout,
      hierarchy,
      regionZone,
      depotCustomer,
      serviceType,
      seatCapacity,
      registrationDate,
      vehicleManufacturer,
      vehicleType,
      vehicleModel,
      ownerType,
      engineNumber,
      chassisNumber,
      manufacturingYear,
      purchaseDate,
      permitName,
      permitDueDate,
      pucDate,
      pucExpiryDate,
      fitness,
      vltdDevice
    } = req.body;

    // Validate required fields
    if (!vehicleNumber || !seatLayout || !ownerType) {
      return res.status(400).json({
        message: "vehicleNumber, seatLayout, ownerType are required"
      });
    }

    // Validate seatLayout ObjectId
    if (!mongoose.Types.ObjectId.isValid(seatLayout)) {
      return res.status(400).json({ message: "Invalid seatLayout ID format" });
    }

    // Create vehicle
    const vehicle = await Vehicle.create({
      vehicleNumber,
      seatLayout,
      hierarchy,
      regionZone,
      depotCustomer,
      serviceType,
      seatCapacity,
      registrationDate,
      vehicleManufacturer,
      vehicleType,
      vehicleModel,
      ownerType,
      engineNumber,
      chassisNumber,
      manufacturingYear,
      purchaseDate,
      permitName,
      permitDueDate,
      pucDate,
      pucExpiryDate,
      fitness,
      vltdDevice
    });

    res.status(201).json({
      message: "Vehicle created successfully",
      data: vehicle
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate vehicle ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Vehicle ID format" });
    }

    // No update fields case
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    // If seatLayout is provided, validate ObjectId
    if (req.body.seatLayout && !mongoose.Types.ObjectId.isValid(req.body.seatLayout)) {
      return res.status(400).json({ message: "Invalid seatLayout ID format" });
    }

    // Perform update
    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json({
      message: "Vehicle updated successfully",
      data: updatedVehicle
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};



