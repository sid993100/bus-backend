import PisModel from "../../models/pisModelModel.js";


// CREATE
export const addPisModel = async (req, res) => {
  try {
    const { make, vehicleType, vehicleModel } = req.body;

    if (!make || !vehicleType || !vehicleModel) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const pisModel = new PisModel({ make, vehicleType, vehicleModel });
    const savedModel = await pisModel.save();

    res.status(201).json({ success: true, data: savedModel });
  } catch (error) {
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

    const updated = await PisModel.findByIdAndUpdate(
      id,
      { make, vehicleType, vehicleModel },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Pis Model not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
