import PisRegistration from "../../../models/pisRegisrationModel.js";

export const getpisReg= async (req,res) => {
     const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
        const pisReg= await PisRegistration.find({})
        if(!pisReg){
            return res.status(404).json({
            message: "Duty Not Found",
            }); 
        }
          return res.status(200).json({
        message:pisReg,
        log:"ok"
       })
     } catch (error) {
         res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addPisReg=async (req,res) => {
     try {
         const user=req.user
  const {layoutName,seatCapacity,department,servicesLinked,fci}=req.body
  
  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!layoutName||!seatCapacity||!department||!servicesLinked||!fci){
       return res.status(404).json({
            message:"All details Required"
         })
     }
      const pisReg=await PisRegistration.create({
        layoutName,
        seatCapacity,
        department,
        servicesLinked,
        fci
      })
      
      if(!pisReg){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:pisReg
      })

     } catch (error) {
         res.status(500).json({
        message:"Server Error"
         })
     }
} //TODO