import BusStop from "../../../models/busStopModel.js";

export const getBusStop= async (req,res)=>{
     const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
        const busStop= await BusStop.find({})
        if(!busStop){
             return res.status(404).json({
            message: "Bus Stop Not Found",
          });
        }
         return res.status(200).json({
        message:busStop
       }) 
     } catch (error) {
         return res.status(500).json({
        message:"Backend Error"
         })
     }
};
export const addBusStop=async (req,res) => {
    const user=req.user
  const {}=req.body
  
  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!gradeName||!geoFence){
       return res.status(404).json({
            message:"All details Required"
         })
     }
  try {
      const busStop=await BusStop.create({
        stopGradeName:gradeName,
        geoFence
      })
      if(!busStop){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Stop Area "
             })
      }
      res.status(201).json({
        message:"created",
        data:busStop
      })
  } catch (error) {
    return res.status(500).json({
        message:"Server Error"
         })
  }
}
export const updateBusStop = async (req, res) => {
  try {
    const { id } = req.params; // BusStop ID from URL
    const { gradeName, geoFence } = req.body;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        message: "BusStop ID is required",
      });
    }

    // Require at least one field to update
    if (!gradeName && !geoFence) {
      return res.status(400).json({
        message: "At least one field (gradeName or geoFence) is required to update",
      });
    }

    // Perform the update
    const updatedBusStop = await BusStop.findByIdAndUpdate(
      id,
      {
        ...(gradeName && { stopGradeName: gradeName }),
        ...(geoFence && { geoFence }),
      },
      { new: true } // return updated document
    );

    if (!updatedBusStop) {
      return res.status(404).json({
        message: "BusStop not found",
      });
    }

    res.status(200).json({
      message: "BusStop updated successfully",
      data: updatedBusStop,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
