import SimService from "../../../models/simServiceModel.js";

export const getSim=async (req,res) => {
  const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
      const sim= await SimService.find({})
      if (!sim) {
         return res.status(404).json({
            message: "Sim Not Found",
            });
      }
       return res.status(200).json({
        message:sim,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addSim=async (req,res) => {
  const user=req.user
  const {name,shortName}=req.body

  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!name||!shortName){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const sim= await SimService.create({
       serviceProviderName:name,
       shortName,
      })
      
      if(!sim){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Sim "
             })
      }
      res.status(201).json({
        message:"created",
        data:sim
      }) 
     } catch (error) {
      console.log(error);
      
       return res.status(500).json({
        message:"Server Error"
         })
     }
}