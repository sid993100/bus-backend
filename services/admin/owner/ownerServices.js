import OwnerType from "../../../models/ownerModel.js";

export const getOwnerType=async (req,res) => {
  const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
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
  const user=req.user
  const {ownerType,description}=req.body

  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
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
