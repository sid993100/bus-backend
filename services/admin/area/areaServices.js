import Area from "../../../models/areaModel.js";


export const addArea= async (req,res) => {
    const user=req.user
  const {area}=req.body
  
  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!area){
       return res.status(404).json({
            message:"All details Required"
         })
     }
  try {
      const stopArea=await Area.create({
        area
      })
      if(!stopArea){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Stop Area "
             })
      }
      res.status(201).json({
        message:"created",
        data:stopArea
      })
  } catch (error) {
    return res.status(500).json({
        message:"Server Error"
         })
  }
}
export const getArea=async (req,res) => {
      const user=req.user
  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     
  try {
      const stopArea=await Area.find({})
      if(!stopArea){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Stop Area "
             })
      }
      res.status(201).json({
         data:stopArea
      })
  } catch (error) {
    return res.status(500).json({
        message:"Server Error"
         })
  }
}