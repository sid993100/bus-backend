import TollType from "../../../models/tollTypeModel.js";


export const getTollType= async(req,res)=>{
     const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
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
  const user=req.user
  const {name,description}=req.body
  
  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
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
      return res.status(500).json({
        message:"Server Error"
         })
     }
};