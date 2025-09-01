import Route from "../models/routemodel.js";

export const getRoutes= async (req,res) => {

     try {
          const route= await Route.find({})
        if(!route){
            return res.status(404).json({
            message: "Route Not Found",
            }); 
        }
          return res.status(200).json({
        message:route,
        log:"ok"
       })
     } catch (error) {
        return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const getRoute= async (req,res) => {
    const {id:routeId}=req.params
    if(!routeId)  return res.status(404).json({message:"Invalide"})
        
}