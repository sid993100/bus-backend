import State from "../../../models/stateModel.js";

export const getState = async(req,res)=>{

     try {
        const state= await State.find({})
        if(!state){
             return res.status(404).json({
            message: "Service Category Type Not Found",
          });
        }
           return res.status(200).json({
        message:state
       }) 

     } catch (error) {
         return res.status(500).json({
        message:"Backend Error"
    })
     }
};
export const addState = async (req, res) => {
  const { stateCode, state, stateType, country } = req.body;
  
  if (!stateCode || !state || !country) {
    return res.status(400).json({
      message: "All details Required (stateCode, state, country)"
    });
  }

  try {
    // Check for duplicate stateCode or state
    const existingState = await State.findOne({
      $or: [
        { stateCode: stateCode },
        { state: state }
      ]
    });

    if (existingState) {
      return res.status(409).json({
        message: "State code or state name already exists"
      });
    }

    const newState = await State.create({
      stateCode,
      state,
      stateType,
      country
    });
    
    if (!newState) {
      return res.status(500).json({
        message: "Something went wrong while creating a State"
      });
    }

    res.status(201).json({
      message: "created",
      data: newState
    });
  } catch (error) {
    console.log(error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry found"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Updating state:", id);
    
    const { stateCode, state, stateType, country } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({
        message: "State ID is required"
      });
    }

    if (!stateCode && !state && !stateType && !country) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    // Check for duplicate stateCode or state (excluding current record)
    if (stateCode || state) {
      const duplicateQuery = {
        _id: { $ne: id },
        $or: []
      };
      
      if (stateCode) duplicateQuery.$or.push({ stateCode: stateCode });
      if (state) duplicateQuery.$or.push({ state: state });

      const duplicate = await State.findOne(duplicateQuery);
      if (duplicate) {
        return res.status(409).json({
          message: "State code or state name already exists"
        });
      }
    }

    // Find and update
    const updatedState = await State.findByIdAndUpdate(
      id,
      {
        ...(stateCode && { stateCode }),
        ...(state && { state }),
        ...(stateType && { stateType }),
        ...(country && { country })
      },
      { new: true }
    );

    if (!updatedState) {
      return res.status(404).json({
        message: "State not found"
      });
    }

    res.status(200).json({
      message: "State updated successfully",
      data: updatedState
    });
  } catch (error) {
    console.error(error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry found"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
  }
};
 