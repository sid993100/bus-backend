import mongoose from "mongoose";
import Conductor from "../../../models/conductorModel.js";


export const getConductor = async (req, res) => {
  try {
    const user = req.user;

    // Admin-only check
    if (user?.hierarchy !== "ADMIN") {
      return res.status(403).json({
        message: "Not Admin"
      });
    }

    const conductors = await Conductor.find({});

    if (!conductors || conductors.length === 0) {
      return res.status(404).json({
        message: "No conductors found"
      });
    }

    return res.status(200).json({
      message: "Conductors retrieved successfully",
      data: conductors
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};

export const addConductor = async (req, res) => {
  try {

    const {
      payrollId,
      departmentSection,
      zoneRegion,
      depotCustomer,
      driverName,
      gender,
      mobileNumber,
      employment,
      dateOfBirth,
      fatherName,
      photoIdCard,
      idCardNumber,
      localAddress,
      permanentAddress,
      clNumber,
      clExpiryDate,
      emergencyContactNumber
    } = req.body;

    // Validate required fields
    if (!payrollId || !driverName || !gender || !mobileNumber || !employment || !dateOfBirth || !fatherName) {
      return res.status(400).json({
        message: "payrollId, driverName, gender, mobileNumber, employment, dateOfBirth, and fatherName are required"
      });
    }

    // Create conductor
    const conductor = await Conductor.create({
      payrollId,
      departmentSection,
      zoneRegion,
      depotCustomer,
      driverName,
      gender,
      mobileNumber,
      employment,
      dateOfBirth,
      fatherName,
      photoIdCard,
      idCardNumber,
      localAddress,
      permanentAddress,
      clNumber,
      clExpiryDate,
      emergencyContactNumber
    });

    res.status(201).json({
      message: "Conductor created successfully",
      data: conductor
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};

export const updateConductor = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid Conductor ID format"
      });
    }

    // Check if at least one field is provided
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    // Perform update
    const updatedConductor = await Conductor.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedConductor) {
      return res.status(404).json({
        message: "Conductor not found"
      });
    }

    res.status(200).json({
      message: "Conductor updated successfully",
      data: updatedConductor
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};

