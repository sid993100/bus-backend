import VehicalModel from "../../models/vehicleModelModel.js";
import VehicleManufacturer from "../../models/vehiclemanufacturerModel.js";
import VehicleType from "../../models/vehicleTypeModel.js";

const populateModel = (query) => {
    return query
        .populate('make', 'make shortName')
        .populate('vehicleType', 'vehicleType');
};

export const getVehicleModels = async (req, res) => {
  try {
    const modelQuery = VehicalModel.find({}).sort({ make: 1 });
    const vehicleModels = await populateModel(modelQuery);

    if (!vehicleModels) {
      return res.status(404).json({
        message: "Vehicle Models Not Found"
      });
    }

    return res.status(200).json({
      message: "Vehicle Models Retrieved Successfully",
      data: vehicleModels
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

export const addVehicleModel = async (req, res) => {
  try {
    const { make, vehicleType, vehicleModel } = req.body;

    if (!make || !vehicleType || !vehicleModel) {
      return res.status(400).json({
        message: "All details Required (make, vehicleType, vehicleModel)"
      });
    }

    const foundMake = await VehicleManufacturer.findById(make);
    if (!foundMake) return res.status(404).json({ message: "Vehicle Manufacturer (Make) not found" });

    const foundType = await VehicleType.findById(vehicleType);
    if (!foundType) return res.status(404).json({ message: "Vehicle Type not found" });

    const existingModel = await VehicalModel.findOne({ make, vehicleType, vehicleModel });
    if (existingModel) {
      return res.status(409).json({ message: "This exact vehicle model already exists" });
    }

    const newModel = new VehicalModel({
      make,
      vehicleType,
      vehicleModel
    });
    await newModel.save();

    const modelQuery = VehicalModel.findById(newModel._id);
    const populatedModel = await populateModel(modelQuery);

    res.status(201).json({
      message: "Vehicle Model created successfully",
      data: populatedModel
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A model with these details already exists." });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

export const getVehicleModelById = async (req, res) => {
  try {
    const { id } = req.params;

    const modelQuery = VehicalModel.findById(id);
    const vehicleModel = await populateModel(modelQuery);

    if (!vehicleModel) {
      return res.status(404).json({
        message: "Vehicle Model not found"
      });
    }

    return res.status(200).json({
      message: "Vehicle Model retrieved successfully",
      data: vehicleModel
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

export const updateVehicleModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { make, vehicleType, vehicleModel } = req.body;
    
    const updateData = { make, vehicleType, vehicleModel };

    if (make) {
        const foundMake = await VehicleManufacturer.findById(make);
        if (!foundMake) return res.status(404).json({ message: "Vehicle Manufacturer (Make) not found" });
    }
    if (vehicleType) {
        const foundType = await VehicleType.findById(vehicleType);
        if (!foundType) return res.status(404).json({ message: "Vehicle Type not found" });
    }

    const modelQuery = VehicalModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    const updatedModel = await populateModel(modelQuery);

    if (!updatedModel) {
      return res.status(404).json({
        message: "Vehicle Model not found"
      });
    }

    res.status(200).json({
      message: "Vehicle Model updated successfully",
      data: updatedModel
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A model with these details already exists." });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

export const deleteVehicleModel = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedVehicleModel = await VehicalModel.findByIdAndDelete(id);

    if (!deletedVehicleModel) {
      return res.status(404).json({
        message: "Vehicle Model not found"
      });
    }

    res.status(200).json({
      message: "Vehicle Model deleted successfully",
      data: deletedVehicleModel
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

export const getVehicleModelsByMake = async (req, res) => {
  try {
    const { makeId } = req.params;

    const modelQuery = VehicalModel.find({ make: makeId }).sort({ vehicleType: 1 });
    const vehicleModels = await populateModel(modelQuery);

    if (!vehicleModels || vehicleModels.length === 0) {
      return res.status(404).json({
        message: "No vehicle models found for this make"
      });
    }

    return res.status(200).json({
      message: "Vehicle Models retrieved successfully",
      data: vehicleModels
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};