import Route from "../../../models/routemodel.js" 

export const addRoute=async(req,res)=>{
  const {source,destination,via,routeName,routeCode,routeLength}=req.body
  if(!source||!destination||!via||!routeCode||!routeLength||!routeName){
       return res.status(404).json({
                 message:"All details Required"
             })
  }
  try {
    const route=await Route.create({
      source,
      destination,
      via,
      routeCode,
      routeName,
      routeLength
    })
    if (!route) {
     res.status(500).json({
                 message:"Somthing went Wrong while Creating A Department "
             })
    }
     res.status(201).json({
        message:"created",
        data:route
      }) 
  } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
  }
}

export const getRoute=async (req,res) => {

     try {
      const route= await Route.find({})
      if (!route||route.length==0) {
         return res.status(404).json({
            message: "Department Not Found",
            });
      }
        res.status(200).json({
        message:route,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
