import VehicleManufacturer from "../../../models/vehiclemanufacturerModel.js";

export const getVehicleManufacturer=async (req,res) => {
  const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
      const vehicleManufacturer= await VehicleManufacturer.find({})
      if (!vehicleManufacturer) {
         return res.status(404).json({
            message: "Vlt Device Not Found",
            });
      }
        res.status(200).json({
        message:vehicleManufacturer,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addVehicleManufacturer =async (req,res) => {
  const user=req.user
  const {make,shortName}=req.body

  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!make){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const vehicle = await VehicleManufacturer.create({
        shortName,
        make
      })
      
      if(!vehicle){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:vehicle
      }) 
     } catch (error) {
        res.status(500).json({
        message:error.errmsg
         })
     }
}