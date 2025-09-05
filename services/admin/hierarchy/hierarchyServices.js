import Hierarchy from "../../../models/hierarchyModel.js";

export const addHierarchy = async (req, res) => {
  try {
  
    const { name, level, description } = req.body;
 

    if (!name || level === undefined) {
      return res.status(400).json({
        message: "All details Required (name, level)"
      });
    }

    // Check for duplicate name
    const existingName = await Hierarchy.findOne({ 
      name: name.trim() 
    });
    if (existingName) {
      return res.status(409).json({
        message: "Hierarchy name already exists"
      });
    }

    // Check for duplicate level
    const existingLevel = await Hierarchy.findOne({ level });
    if (existingLevel) {
      return res.status(409).json({
        message: "Hierarchy level already exists"
      });
    }

    const hierarchy = await Hierarchy.create({
      name: name.trim(),
      level,
      description: description?.trim()
    });

    if (!hierarchy) {
      return res.status(500).json({
        message: "Something went wrong while creating Hierarchy"
      });
    }

    res.status(201).json({
      message: "created",
      data: hierarchy
    });

  } catch (error) {
    console.log(error);

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      let message = "Duplicate entry detected.";

      switch (duplicatedField) {
        case 'name':
          message = "Hierarchy name already exists.";
          break;
        case 'level':
          message = "Hierarchy level already exists.";
          break;
        default:
          message = `${duplicatedField} already exists.`;
      }

      return res.status(409).json({ message });
    }

    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const getHierarchy = async (req, res) => {
  try {
    const hierarchies = await Hierarchy.find()
      .sort({ level: 1 });

    if (!hierarchies) {
      return res.status(404).json({
        message: "Hierarchy Not Found"
      });
    }

    return res.status(200).json({
      message: hierarchies
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const getHierarchyById = async (req, res) => {
  try {
    const { id } = req.params;
   

    if (!id) {
      return res.status(400).json({
        message: "Hierarchy ID is required"
      });
    }

    const hierarchy = await Hierarchy.findById(id);

    if (!hierarchy) {
      return res.status(404).json({
        message: "Hierarchy not found"
      });
    }

    return res.status(200).json({
      message: hierarchy
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const updateHierarchy = async (req, res) => {
  try {
    const { id } = req.params;
  

    const { name } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Hierarchy ID is required"
      });
    }

    if (!name ) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    // Check for duplicate name (excluding current record)
    if (name) {
      const existingName = await Hierarchy.findOne({
        name: name.trim(),
        _id: { $ne: id }
      });
      if (existingName) {
        return res.status(409).json({
          message: "Hierarchy name already exists"
        });
      }
    }

    

    const updatedHierarchy = await Hierarchy.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() })
      },
      { new: true, runValidators: true }
    );

    if (!updatedHierarchy) {
      return res.status(404).json({
        message: "Hierarchy not found"
      });
    }

    res.status(200).json({
      message: "Hierarchy updated successfully",
      data: updatedHierarchy
    });

  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      let message = "Duplicate entry detected.";

      switch (duplicatedField) {
        case 'name':
          message = "Hierarchy name already exists.";
          break;
        case 'level':
          message = "Hierarchy level already exists.";
          break;
        default:
          message = `${duplicatedField} already exists.`;
      }

      return res.status(409).json({ message });
    }

    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const deleteHierarchy = async (req, res) => {
  try {
    const { id } = req.params;


    if (!id) {
      return res.status(400).json({
        message: "Hierarchy ID is required"
      });
    }

    const deletedHierarchy = await Hierarchy.findByIdAndDelete(id);

    if (!deletedHierarchy) {
      return res.status(404).json({
        message: "Hierarchy not found"
      });
    }

    res.status(200).json({
      message: "Hierarchy deleted successfully",
      data: deletedHierarchy
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const getHierarchyByLevel = async (req, res) => {
  try {
    const { level } = req.params;
 

    if (!level) {
      return res.status(400).json({
        message: "Level is required"
      });
    }

    const hierarchy = await Hierarchy.findOne({ 
      level: parseInt(level), 
      isActive: true 
    });

    if (!hierarchy) {
      return res.status(404).json({
        message: "Hierarchy not found for this level"
      });
    }

    return res.status(200).json({
      message: hierarchy
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};
