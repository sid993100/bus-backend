import VltDevice from "../../../models/vltDeviceModel.js";

export const getVltDevices=async (req,res) => {
  const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
      const vltDevice= await VltDevice.find({})
      if (!vltDevice||vltDevice.length===0) {
         return res.status(404).json({
            message: "Vlt Device Not Found",
            });
      }
       return res.status(200).json({
        message:vltDevice,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addVltDevices=async (req,res) => {
  const user=req.user
  const {vlt,
        imeiNumber,
        iccid,
        region,
    customer}=req.body

  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!vlt||!imeiNumber||!iccid||!region||!customer){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const vltDevice= await VltDevice.create({
        vlt,
        imeiNumber,
        iccid,
        region,
        customer
      })
      
      if(!vltDevice){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:vltDevice
      }) 
     } catch (error) {
      console.log(error);
      
       return res.status(500).json({
        message:"Server Error"
         })
     }
}