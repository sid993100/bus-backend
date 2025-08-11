import Vehicle from "../../../models/vehicleModel.js";

export const getVehicle=async (req,res) => {
  const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
      const vehicles= await Vehicle.find({})
      if (!vehicles||vehicles.length===0) {
         return res.status(404).json({
            message: "Vehicle Not Found",
            });
      }
        res.status(200).json({
        message:vehicles,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:error.errmsg
         })
     }
}
// export const addPlan =async (req,res) => {
//   const user=req.user
//   const {planName,vltdManufacturer,durationDays}=req.body

//   if (user.hierarchy !== "ADMIN") {
//        return res.status(403).json({
//          message: " Not Admin",
//        });
//      }
//      if(!planName||!vltdManufacturer||!durationDays){
//        return res.status(404).json({
//             message:"All details Required"
//          })
//      }
//      try {     
 
//         const plan = await Plan.create({
//         planName,
//         vltdManufacturer,
//         durationDays
//       })
      
//       if(!plan){
//          res.status(500).json({
//                  message:"Somthing went Wrong while Creating A Plan "
//              })
//       }
//       res.status(201).json({
//         message:"created",
//         data:plan
//       }) 
//      } catch (error) {
//       console.log(error);
      
//         res.status(500).json({
//         message:error.errmsg
//          })
//      }
// }