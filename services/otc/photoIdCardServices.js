import PhotoIdCard from "../../models/photoIdModel.js";

export const addPhotoIdCard = async (req, res) => {
  try {
    const { name } = req.body;


    if (!name) {
      return res.status(400).json({
        message: "All details Required (name)"
      });
    }

    // Check for duplicate
    const existingGender = await PhotoIdCard.findOne({ 
      name: name.toUpperCase() 
    });

    if (existingGender) {
      return res.status(409).json({
        message: "Id already exists"
      });
    }

    const gender = await PhotoIdCard.create({
      name: name.toUpperCase()
    });

    if (!gender) {
      return res.status(500).json({
        message: "Something went wrong while creating Photo Id Card"
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
        message: "Photo Id Card already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const getPhotoIdCard = async (req, res) => {
  try {
    const genders = await PhotoIdCard.find({}).sort({ name: 1 });
    
    if (!genders) {
      return res.status(404).json({
        message: "Photo Id Card Not Found"
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

export const updatePhotoIdCard = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { name } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({
        message: " ID is required"
      });
    }

    if (!name) {
      return res.status(400).json({
        message: "Photo Id Card name is required to update"
      });
    }

    // Check for duplicate name (excluding current record)
    const existingGender = await PhotoIdCard.findOne({
      name: name.toUpperCase(),
      _id: { $ne: id }
    });

    if (existingGender) {
      return res.status(409).json({
        message: "Photo Id Card already exists"
      });
    }

    // Find and update
    const updatedGender = await PhotoIdCard.findByIdAndUpdate(
      id,
      { name: name.toUpperCase() },
      { new: true }
    );

    if (!updatedGender) {
      return res.status(404).json({
        message: "Photo Id Card not found"
      });
    }

    res.status(200).json({
      message: "Photo Id Card updated successfully",
      data: updatedGender
    });
  } catch (error) {
    console.error(error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Photo Id Card already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const getPhotoIdCardById = async (req, res) => {
  try {
    const { id } = req.params;
 

    if (!id) {
      return res.status(400).json({
        message: "Gender ID is required"
      });
    }

    const gender = await PhotoIdCard.findById(id);

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

export const deletePhotoIdCard = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting gender:", id);

    if (!id) {
      return res.status(400).json({
        message: "Gender ID is required"
      });
    }

    const deletedGender = await PhotoIdCard.findByIdAndDelete(id);

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