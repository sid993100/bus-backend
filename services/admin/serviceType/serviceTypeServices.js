import ServiceType from "../../../models/serviceTypeModel.js";

export const getServiceType=async (req,res) => {
  const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
      const serviceType= await ServiceType.find({})
      if(!serviceType){
          return res.status(404).json({
            message: "Service Type Not Found",
            });
      }
      return res.status(200).json({
        message:serviceType,
        log:"ok"
       })

     } catch (error) {
      return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addServiceType=async (req,res) => {
   const user=req.user
  const {code,name,tollType,sleeperCharges,resCharge,reservationCharges,childDiscount,perKmFare,account,fare,category}=req.body
  
  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!code||!name||!tollType||!sleeperCharges||!resCharge||!reservationCharges||!childDiscount||!perKmFare||!account||!fare||!category){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {
      const serviceType=await ServiceType.create({
        code,
        name,
        tollType,
        sleeperCharges,
        resCharge,
        reservationCharges,
        childDiscount,
        perKmFare,
        account,
        fare,
        category
      })
      if(!serviceType){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
console.log(serviceType);

     return res.status(201).json({
        message:"created",
        data:serviceType
      })
     } catch (error) {
      console.log(error);
      
       return res.status(500).json({
        message:"Server Error"
         })
     }
}