import SeatLayout from "../../../models/seatLayoutModel.js";
import consoleManager from "../../../utils/consoleManager.js";

export const getSeatLayout= async (req,res) => {
     const user = req.user;
     
     try {
        const seatLayout= await SeatLayout.find({})
        if(!seatLayout){
            return res.status(404).json({
            message: "Duty Not Found",
            }); 
        }
           res.status(200).json({
        message:seatLayout,
        log:"ok"
       })
     } catch (error) {
         res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addSeatLayout = async (req, res) => {
  try {
    
    const { layoutName, seatCapacity, department, servicesLinked, fci, layers } = req.body;
    
    // Validate required fields
    if(!layoutName || !seatCapacity || !department || !servicesLinked || !fci) {
      return res.status(400).json({
        message: "All details Required: layoutName, seatCapacity, department, servicesLinked, fci"
      });
    }

    // Optional: Validate layers structure if provided
    if(layers) {
      const isValidLayers = layers.every(layer => 
        layer.name && 
        typeof layer.rows === 'number' && 
        typeof layer.columns === 'number' &&
        Array.isArray(layer.seats)
      );
      
      if(!isValidLayers) {
        return res.status(400).json({
          message: "Invalid layers structure. Each layer must have name, rows, columns, and seats array"
        });
      }
    }

    const seatLayoutData = {
      layoutName,
      seatCapacity,
      department,
      servicesLinked,
      fci
    };

    // Add layers if provided
    if(layers) {
      seatLayoutData.layers = layers;
    }

    const seatLayout = await SeatLayout.create(seatLayoutData);

    if(!seatLayout) {
      return res.status(500).json({
        message: "Something went wrong while creating SeatLayout"
      });
    }

    res.status(201).json({
      message: "SeatLayout created successfully",
      data: seatLayout
    });

  } catch (error) {
    console.error(error);
    
    // Handle validation errors specifically
    if(error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation Error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};



export const updateSeatLayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { layoutName, seatCapacity, department, servicesLinked, fci, layers } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid SeatLayout ID format",
      });
    }

    // Require at least one field to update
    if (
      layoutName === undefined &&
      seatCapacity === undefined &&
      department === undefined &&
      servicesLinked === undefined &&
      fci === undefined &&
      layers === undefined
    ) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    // Build update object dynamically
    const updateData = {};
    if (layoutName !== undefined) updateData.layoutName = layoutName;
    if (seatCapacity !== undefined) updateData.seatCapacity = seatCapacity;
    if (department !== undefined) updateData.department = department;
    if (servicesLinked !== undefined) updateData.servicesLinked = servicesLinked;
    if (fci !== undefined) updateData.fci = fci;
    if (layers !== undefined) {
      // Validate layers structure if provided
      const isValidLayers = layers.every(layer => 
        layer.name && 
        typeof layer.rows === 'number' && 
        typeof layer.columns === 'number' &&
        Array.isArray(layer.seats)
      );
      
      if(!isValidLayers) {
        return res.status(400).json({
          message: "Invalid layers structure. Each layer must have name, rows, columns, and seats array"
        });
      }
      updateData.layers = layers;
    }

    // Perform the update
    const updatedSeatLayout = await SeatLayout.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true } // runValidators ensures schema validation
    );

    if (!updatedSeatLayout) {
      return res.status(404).json({
        message: "SeatLayout not found",
      });
    }

    res.status(200).json({
      message: "SeatLayout updated successfully",
      data: updatedSeatLayout,
    });

  } catch (error) {
    console.error(error);
    
    // Handle validation errors
    if(error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation Error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    return res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};

