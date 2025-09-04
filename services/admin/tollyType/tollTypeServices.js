import TollType from "../../../models/tollTypeModel.js";


export const getTollType= async(req,res)=>{

     try {
        const tollType=await TollType.find({})
        if (!tollType) {
        return res.status(404).json({
           message: "Toll Type Not Found",
         });
      }
      return res.status(200).json({
       message:tollType
      })
     } catch (error) {
        return res.status(500).json({
        message:"Backend Error"
    })
     }
};
export const addTollType=async (req,res) => {

  const {name,description}=req.body
  
 
     if(!name){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {
      const tollType= await TollType.create({
       tollType:name,
        description
      })
      if(!tollType){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:tollType
      })
     } catch (error) {
      if (error.code === 11000) {
      return res.status(409).json({
        message: "Toll Type already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
     }
};
export const updateTollType = async (req, res) => {
  try {
    const { id } = req.params; // TollType ID from URL
    const { name, description } = req.body;

    // ID validation
    if (!id) {
      return res.status(400).json({
        message: "TollType ID is required",
      });
    }

    // Ensure at least one field to update
    if (!name && !description) {
      return res.status(400).json({
        message: "At least one field (name or description) is required to update",
      });
    }

    // Update TollType
    const updatedTollType = await TollType.findByIdAndUpdate(
      id,
      {
        ...(name && { tollType: name }),
        ...(description && { description }),
      },
      { new: true } // return updated document
    );

    if (!updatedTollType) {
      return res.status(404).json({
        message: "TollType not found",
      });
    }

    res.status(200).json({
      message: "TollType updated successfully",
      data: updatedTollType,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Toll Type already exists"
      });
    }
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

