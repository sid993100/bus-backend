import PisModel from "../../models/pisModelModel.js";


// CREATE
export const addPisModel = async (req, res) => {
  try {
    const { make, vehicleType, vehicleModel } = req.body;

    if (!make || !vehicleType || !vehicleModel) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const existsPisModel = await PisModel.findOne({
  make: make,
  vehicleType: vehicleType,  
  vehicleModel: vehicleModel.toUpperCase(), 
});


    if(existsPisModel){
      return res.status(409).json({
        message: "Pis Model already exists"
      })
    }
    
    const pisModel = new PisModel({ make, vehicleType, vehicleModel });
    const savedModel = await pisModel.save();

    res.status(201).json({ success: true, data: savedModel });
  } catch (error) {
     if (error.code === 11000) {
      return res.status(409).json({
        message: "Pis Model already exists"
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// READ ALL
export const getAllPisModels = async (req, res) => {
  try {
    const models = await PisModel.find()
      .populate('make', 'name')
      .populate('vehicleType', 'name')
      .sort({ vehicleModel: 1 });
    res.status(200).json({ success: true, data: models });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// READ BY ID
export const getPisModelById = async (req, res) => {
  try {
    const { id } = req.params;
    const model = await PisModel.findById(id)
      .populate('make', 'name')
      .populate('vehicleType', 'name');
    if (!model) {
      return res.status(404).json({ success: false, error: 'Pis Model not found' });
    }
    res.status(200).json({ success: true, data: model });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// UPDATE
export const updatePisModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { make, vehicleType, vehicleModel } = req.body;

    // Validate required fields
    if (!make || !vehicleType || !vehicleModel) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    // Check if a PisModel with the same combination already exists (excluding current record)
    const existsPisModel = await PisModel.findOne({
      make: make,
      vehicleType: vehicleType,  
      vehicleModel: vehicleModel.toUpperCase(),
      _id: { $ne: id } // Exclude current record from duplicate check
    });

    if (existsPisModel) {
      return res.status(409).json({
        success: false,
        message: "Pis Model already exists with this combination"
      });
    }

    // Update the PisModel
    const updated = await PisModel.findByIdAndUpdate(
      id,
      { 
        make, 
        vehicleType, 
        vehicleModel: vehicleModel.toUpperCase() // Ensure consistency with create
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        error: 'Pis Model not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Pis Model updated successfully',
      data: updated 
    });

  } catch (error) {
    console.error('Error updating PisModel:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid PisModel ID format'
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// DELETE
export const deletePisModel = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PisModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Pis Model not found' });
    }
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
