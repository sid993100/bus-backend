export const addRoute=async(req,res)=>{
  const {source,destination,via}=req.body()
  if(!source||!destination||!via){
       return res.status(404).json({
                 message:"All details Required"
             })
  }
  try {
    
  } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
  }
}
