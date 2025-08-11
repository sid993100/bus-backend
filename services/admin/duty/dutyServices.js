import Duty from "../../../models/dutyModel.js";

export const getDuty= async (req,res) => {
    const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
        const duty=await Duty.find({})
        if(!duty){
             return res.status(404).json({
            message: "Duty Not Found",
            });
        }
         return res.status(200).json({
        message:duty
       })
     } catch (error) {
         return res.status(500).json({
        message:"Backend Error"
         })
     }
}
export const addDuty=async (req,res) => {
    
 const user=req.user
  const { dutyDate,
         vehicleNumber,
         conductorName,
         driverName,
         supportDriver,
         dutyType,
        scheduleNumber,
        dutyNumber,
        serviceType,
        scheduledKM,
        scheduledTrips,
        nightOuts,
        accountStatus,
        creationDate}=req.body
  
  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(! dutyDate||
         !vehicleNumber||
         !conductorName||
         !driverName||
         !supportDriver||
        !dutyType||
        !scheduleNumber||
        !dutyNumber||
        !serviceType||
        !scheduledKM||
        !scheduledTrips||
        !nightOuts||
        !accountStatus||
        !creationDate){
       return res.status(404).json({
            message:"All details Required"
         })
     }

  try {
      const duty=await Duty.create({
        dutyDate,
         vehicleNumber,
         conductorName,
         driverName,
         supportDriver,
         dutyType,
        scheduleNumber,
        dutyNumber,
        serviceType,
        scheduledKM,
        scheduledTrips,
        nightOuts,
        accountStatus,
        creationDate
    })
      
      if(!duty){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Duty"
             })
      }
      res.status(201).json({
        message:"created",
        data:duty
      })
  } catch (error) {
    return res.status(500).json({
        message:"Server Error"
         })
  }
}
