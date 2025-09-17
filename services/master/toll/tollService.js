import Toll from "../../../models/tollModel.js";
import consoleManager from "../../../utils/consoleManager.js";

export const addToll = async (req, res) => {
  const { code, tollName, typeA, typeB, state, country, coordinates } = req.body;
  consoleManager.log(code, tollName, typeA, typeB, state, country);
  
      
  
  if (!code || !tollName || !typeA || !typeB || !state) {
    return res.status(404).json({
      message: "All details Required (code, tollName, typeA, typeB, state)"
    });
  }
  
  try {
    const toll = await Toll.create({
      code,
      tollName,
      typeA,
      typeB,
      state,
      country: country || "India",
      coordinates
    });
    
    if (!toll) {
      res.status(500).json({
        message: "Something went Wrong while Creating A Toll"
      });
    }
    
    res.status(201).json({
      message: "created",
      data: toll
    });
  } catch (error) {
    consoleManager.log(error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Toll code already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const getToll = async (req, res) => {
  try {
    const tolls = await Toll.find({ isActive: true }).populate([
  { path: "state", select: "stateCode" },
  { path: "country", select: "countryCode" }
]);

    if (!tolls) {
      return res.status(404).json({
        message: "Toll Not Found",
      });
    }

    return res.status(200).json({
      message: tolls
    });
  } catch (error) {
    console.log(error.message);
    
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const updateToll = async (req, res) => {
  try {
    const { id } = req.params; // toll ID from URL
    consoleManager.log(id);
    
    const { code, tollName, typeA, typeB, state, country, coordinates } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({
        message: "Toll ID is required",
      });
    }

    if (!code && !tollName && !typeA && !typeB && !state && !country && !coordinates) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    // Find and update
    const updatedToll = await Toll.findByIdAndUpdate(
      id,
      {
        ...(code && { code }),
        ...(tollName && { tollName }),
        ...(typeA && { typeA }),
        ...(typeB && { typeB }),
        ...(state && { state }),
        ...(country && { country }),
        ...(coordinates && { coordinates }),
      },
      { new: true } // return updated document
    );

    if (!updatedToll) {
      return res.status(404).json({
        message: "Toll not found",
      });
    }

    res.status(200).json({
      message: "Toll updated successfully",
      data: updatedToll,
    });
  } catch (error) {
    console.error(error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Toll code already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const deleteToll = async (req, res) => {
  try {
    const { id } = req.params;
    consoleManager.log(id);

    if (!id) {
      return res.status(400).json({
        message: "Toll ID is required",
      });
    }

    // Soft delete by setting isActive to false
    const deletedToll = await Toll.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedToll) {
      return res.status(404).json({
        message: "Toll not found",
      });
    }

    res.status(200).json({
      message: "Toll deleted successfully",
      data: deletedToll,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getTollById = async (req, res) => {
  try {
    const { id } = req.params;
  

    if (!id) {
      return res.status(400).json({
        message: "Toll ID is required",
      });
    }

    // Try to find by ID first, then by code
    let toll = await Toll.findById(id);
    
    if (!toll) {
      toll = await Toll.findOne({ code: id.toUpperCase(), isActive: true });
    }

    if (!toll) {
      return res.status(404).json({
        message: "Toll not found",
      });
    }

    return res.status(200).json({
      message: toll
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const getTollsByState = async (req, res) => {
  try {
    const { state } = req.params;
    consoleManager.log(state);

    if (!state) {
      return res.status(400).json({
        message: "State is required",
      });
    }

    const tolls = await Toll.find({ 
      state: new RegExp(state, 'i'), 
      isActive: true 
    }).sort({ tollName: 1 });

    if (!tolls || tolls.length === 0) {
      return res.status(404).json({
        message: "No tolls found for this state",
      });
    }

    return res.status(200).json({
      message: tolls
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const bulkAddTolls = async (req, res) => {
  const user = req.user;
  const { tolls } = req.body;
  consoleManager.log("Bulk adding tolls:", tolls?.length);


  if (!tolls || !Array.isArray(tolls) || tolls.length === 0) {
    return res.status(400).json({
      message: "Please provide an array of tolls"
    });
  }

  try {
    const createdTolls = await Toll.insertMany(tolls, { ordered: false });

    res.status(201).json({
      message: `${createdTolls.length} tolls created successfully`,
      data: createdTolls
    });
  } catch (error) {
    consoleManager.log(error);
    
    return res.status(500).json({
      message: "Server Error",
      details: error.writeErrors || []
    });
  }
};

export const getTollStats = async (req, res) => {
  try {
    const stats = await Toll.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalTolls: { $sum: 1 },
          avgTypeA: { $avg: '$typeA' },
          avgTypeB: { $avg: '$typeB' },
          maxTypeA: { $max: '$typeA' },
          maxTypeB: { $max: '$typeB' },
          minTypeA: { $min: '$typeA' },
          minTypeB: { $min: '$typeB' },
          stateCount: { $addToSet: '$state' }
        }
      },
      {
        $project: {
          _id: 0,
          totalTolls: 1,
          avgTypeA: { $round: ['$avgTypeA', 2] },
          avgTypeB: { $round: ['$avgTypeB', 2] },
          maxTypeA: 1,
          maxTypeB: 1,
          minTypeA: 1,
          minTypeB: 1,
          uniqueStates: { $size: '$stateCount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalTolls: 0,
      avgTypeA: 0,
      avgTypeB: 0,
      maxTypeA: 0,
      maxTypeB: 0,
      minTypeA: 0,
      minTypeB: 0,
      uniqueStates: 0
    };

    return res.status(200).json({
      message: result
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};

export const getStates = async (req, res) => {
  try {
    const states = await Toll.distinct('state', { isActive: true });

    if (!states || states.length === 0) {
      return res.status(404).json({
        message: "No states found",
      });
    }

    return res.status(200).json({
      message: states.sort()
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Backend Error"
    });
  }
};
