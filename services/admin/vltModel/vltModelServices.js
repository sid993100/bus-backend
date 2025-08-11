import VltdModel from "../../../models/vltdModelModel.js";

export const getVltModel=async (req,res) => {
  const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
      const vltModel= await VltdModel.find({})
      if (!vltModel||vltModel.length===0) {
         return res.status(404).json({
            message: "Vlt Model Not Found",
            });
      }
        res.status(200).json({
        message:vltModel
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addVltModel=async (req,res) => {
  const user=req.user
  const {name,modelName}=req.body

  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!name||!modelName){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const vltModel = await VltdModel.create({
        manufacturerName:name,
        modelName
      })
      
      if(!vltModel){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:vltModel
      }) 
     } catch (error) {
        res.status(500).json({
        message:error.errmsg
         })
     }
}