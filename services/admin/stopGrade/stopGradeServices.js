import StopGrade from "../../../models/stopGradeModel.js";

export const addStopGrade= async (req,res) => {
     const user=req.user
  const {gradeName,geoFence}=req.body
  
     if(!gradeName||!geoFence){
       return res.status(404).json({
            message:"All details Required"
         })
     }
  try {
      const stopeGrade=await StopGrade.create({
        stopGradeName:gradeName,
        geoFence
      })
      if(!stopeGrade){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Stop Area "
             })
      }
      res.status(201).json({
        message:"created",
        data:stopeGrade
      })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
  }
}
export const getStopGrade=async (req,res) => {
    const user = req.user;
     try {
        const stopGrade= await StopGrade.find({})
        if (!stopGrade) {
             return res.status(404).json({
            message: "Bus Stop Not Found",
            });
        }
        return res.status(200).json({
        message:stopGrade
       }) 
     } catch (error) {
        return res.status(500).json({
        message:"Backend Error"
         })
     }
}
export const updateStopGrade = async (req, res) => {

  const { id } = req.params;
  const { gradeName, geoFence } = req.body || {};

  // Reject empty updates
  if (gradeName === undefined && geoFence === undefined) {
    return res.status(400).json({
      message: "Nothing to update. Provide at least one of: gradeName, geoFence",
    });
  }

  // Build update object only with provided fields
  const update = {};
  if (gradeName !== undefined) update.stopGradeName = gradeName;
  if (geoFence !== undefined) update.geoFence = geoFence;

  try {
    const updated = await StopGrade.findByIdAndUpdate(id, update, { new: true });

    if (!updated) {
      return res.status(404).json({
        message: "Stop grade not found",
      });
    }

    return res.status(200).json({
      message: "updated",
      data: updated,
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        message: "Already exists",
      });
    }

    if (error && error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid id",
      });
    }

    return res.status(500).json({
      message: "Server Error",
    });
  }
}