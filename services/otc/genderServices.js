import Gender from "../../models/genderModel.js";


export const addGender = async (req, res) => {
  try {
    const { name } = req.body;
    console.log("Adding gender:", name);

    if (!name) {
      return res.status(400).json({
        message: "All details Required (name)"
      });
    }

    // Check for duplicate
    const existingGender = await Gender.findOne({ 
      name: name.toUpperCase() 
    });

    if (existingGender) {
      return res.status(409).json({
        message: "Gender already exists"
      });
    }

    const gender = await Gender.create({
      name: name.toUpperCase()
    });

    if (!gender) {
      return res.status(500).json({
        message: "Something went wrong while creating Gender"
      });
    }

    res.status(201).json({
      message: "created",
      data: gender
    });
  } catch (error) {
    console.log(error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Gender already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const getGender = async (req, res) => {
  try {
    const genders = await Gender.find({}).sort({ name: 1 });
    
    if (!genders || genders.length === 0) {
      return res.status(404).json({
        message: "Gender Not Found"
      });
    }

    return res.status(200).json({
      message: genders
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const updateGender = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Updating gender:", id);
    
    const { name } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({
        message: "Gender ID is required"
      });
    }

    if (!name) {
      return res.status(400).json({
        message: "Gender name is required to update"
      });
    }

    // Check for duplicate name (excluding current record)
    const existingGender = await Gender.findOne({
      name: name.toUpperCase(),
      _id: { $ne: id }
    });

    if (existingGender) {
      return res.status(409).json({
        message: "Gender already exists"
      });
    }

    // Find and update
    const updatedGender = await Gender.findByIdAndUpdate(
      id,
      { name: name.toUpperCase() },
      { new: true }
    );

    if (!updatedGender) {
      return res.status(404).json({
        message: "Gender not found"
      });
    }

    res.status(200).json({
      message: "Gender updated successfully",
      data: updatedGender
    });
  } catch (error) {
    console.error(error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Gender already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const getGenderById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Getting gender by ID:", id);

    if (!id) {
      return res.status(400).json({
        message: "Gender ID is required"
      });
    }

    const gender = await Gender.findById(id);

    if (!gender) {
      return res.status(404).json({
        message: "Gender not found"
      });
    }

    return res.status(200).json({
      message: gender
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const deleteGender = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting gender:", id);

    if (!id) {
      return res.status(400).json({
        message: "Gender ID is required"
      });
    }

    const deletedGender = await Gender.findByIdAndDelete(id);

    if (!deletedGender) {
      return res.status(404).json({
        message: "Gender not found"
      });
    }

    res.status(200).json({
      message: "Gender deleted successfully",
      data: deletedGender
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error"
    });
  }
};
