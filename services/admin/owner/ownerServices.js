import OwnerType from "../../../models/ownerModel.js";

export const getOwnerType=async (req,res) => {

     try {
      const owners= await OwnerType.find({})
      if (!owners||owners.length===0) {
         return res.status(404).json({
            message: "Owners Not Found",
            });
      }
       return res.status(200).json({
        message:owners,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:error.errmsg
         })
     }
}
export const addOwnerType=async (req,res) => {

  const {ownerType,description}=req.body

    
     if(!ownerType){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const owner= await OwnerType.create({
        ownerType,
        description,
      })
      
      if(!owner){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Owner Type "
             })
      }
      res.status(201).json({
        message:"created",
        data:owner
      }) 
     } catch (error) {
      
       return res.status(500).json({
        message:error.errmsg
         })
     }
}
export const updateOwnerType = async (req, res) => {
  try {
  
    const { id } = req.params; // OwnerType ID from URL
    const { ownerType, description } = req.body;
    
    // Validate ID
    if (!id) {
      return res.status(400).json({
        message: "OwnerType ID is required",
      });
    }

    // Require at least one field to update
    if (!ownerType && !description) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    // Perform the update
    const updatedOwnerType = await OwnerType.findByIdAndUpdate(
      id,
      {
        ...(ownerType && { ownerType }),
        ...(description && { description }),
      },
      { new: true } // return updated document
    );

    if (!updatedOwnerType) {
      return res.status(404).json({
        message: "OwnerType not found",
      });
    }

    res.status(200).json({
      message: "OwnerType updated successfully",
      data: updatedOwnerType,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};


