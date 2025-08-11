import StopGrade from "../../../models/stopGradeModel.js";

export const addStopGrade= async (req,res) => {
     const user=req.user
  const {gradeName,geoFence}=req.body
  
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
    return res.status(500).json({
        message:"Server Error"
         })
  }
}
export const getStopGrade=async (req,res) => {
    const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
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