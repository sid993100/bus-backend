import State from "../../../models/stateModel.js";

export const getState = async(req,res)=>{

     try {
        const state= await State.find({})
        if(!state){
             return res.status(404).json({
            message: "Service Category Type Not Found",
          });
        }
           return res.status(200).json({
        message:state
       }) 

     } catch (error) {
         return res.status(500).json({
        message:"Backend Error"
    })
     }
};
export const addState =async (req,res) => {
    const user=req.user
  const {stateCode,state,stateType,country}=req.body
  
  
     if(!stateCode||!state||!country){
       return res.status(404).json({
            message:"All details Required"
         })
     }

  try {
      const state=await State.create({
        stateCode,
        state,
        stateType,
        country
      })
      
      if(!state){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:state
      })
  } catch (error) {
    return res.status(500).json({
        message:"Server Error"
         })
  }
}