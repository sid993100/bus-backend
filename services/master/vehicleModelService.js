import VehicalModel from "../../models/vehicleModelModel.js";


export const addVehicleModel = async (req, res) => {
  try {
    const { make, vehicleType, vehicleModel } = req.body;
    console.log(make, vehicleType, vehicleModel);

    if (!make || !vehicleType || !vehicleModel) {
      return res.status(400).json({
        message: "All details Required (make, vehicleType, vehicleModel)"
      });
    }

    // Check for duplicate
    const existing = await VehicalModel.findOne({
      make: make.toUpperCase(),
      vehicleType: vehicleType.toUpperCase(),
      vehicleModel: vehicleModel.toUpperCase()
    });

    if (existing) {
      return res.status(409).json({
        message: "Vehicle model already exists"
      });
    }

    const newVehicleModel = await VehicalModel.create({
      make: make.toUpperCase(),
      vehicleType: vehicleType.toUpperCase(),
      vehicleModel: vehicleModel.toUpperCase()
    });

    if (!newVehicleModel) {
      return res.status(500).json({
        message: "Something went Wrong while Creating Vehicle Model"
      });
    }

    res.status(201).json({
      message: "created",
      data: newVehicleModel
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const getVehicleModels = async (req, res) => {
  try {
    const vehicleModels = await VehicalModel.find({}).sort({ make: 1, vehicleType: 1 });
    
    if (!vehicleModels || vehicleModels.length === 0) {
      return res.status(404).json({
        message: "Vehicle Models Not Found"
      });
    }

    return res.status(200).json({
      message: vehicleModels
    });
  } catch (error) {
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const getVehicleModelById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Getting vehicle model by ID:", id);

    if (!id) {
      return res.status(400).json({
        message: "Vehicle Model ID is required"
      });
    }

    const vehicleModel = await VehicalModel.findById(id);

    if (!vehicleModel) {
      return res.status(404).json({
        message: "Vehicle Model not found"
      });
    }

    return res.status(200).json({
      message: vehicleModel
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const updateVehicleModel = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Updating vehicle model:", id);

    const { make, vehicleType, vehicleModel } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Vehicle Model ID is required"
      });
    }

    if (!make && !vehicleType && !vehicleModel) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    const updatedVehicleModel = await VehicalModel.findByIdAndUpdate(
      id,
      {
        ...(make && { make: make.toUpperCase() }),
        ...(vehicleType && { vehicleType: vehicleType.toUpperCase() }),
        ...(vehicleModel && { vehicleModel: vehicleModel.toUpperCase() })
      },
      { new: true }
    );

    if (!updatedVehicleModel) {
      return res.status(404).json({
        message: "Vehicle Model not found"
      });
    }

    res.status(200).json({
      message: "Vehicle Model updated successfully",
      data: updatedVehicleModel
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const deleteVehicleModel = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting vehicle model:", id);

    if (!id) {
      return res.status(400).json({
        message: "Vehicle Model ID is required"
      });
    }

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
    console.error(error);
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const getVehicleModelsByMake = async (req, res) => {
  try {
    const { make } = req.params;
    console.log("Getting vehicle models by make:", make);

    if (!make) {
      return res.status(400).json({
        message: "Make is required"
      });
    }

    const vehicleModels = await VehicalModel.find({ 
      make: new RegExp(make, 'i') 
    }).sort({ vehicleType: 1, vehicleModel: 1 });

    if (!vehicleModels || vehicleModels.length === 0) {
      return res.status(404).json({
        message: "No vehicle models found for this make"
      });
    }

    return res.status(200).json({
      message: vehicleModels
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};
