import EmployType from '../../../models/empolyTypeModel.js';

// GET ALL
export const getAllEmployTypes = async (req, res) => {
  try {
    const employTypes = await EmployType.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: employTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// CREATE
export const createEmployType = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    const employType = new EmployType({ name });
    const savedEmployType = await employType.save();
    
    res.status(201).json({
      success: true,
      data: savedEmployType
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Employment type already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// UPDATE
export const updateEmployType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updatedEmployType = await EmployType.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updatedEmployType) {
      return res.status(404).json({
        success: false,
        error: 'Employment type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedEmployType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// DELETE
export const deleteEmployType = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedEmployType = await EmployType.findByIdAndDelete(id);

    if (!deletedEmployType) {
      return res.status(404).json({
        success: false,
        error: 'Employment type not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employment type deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
