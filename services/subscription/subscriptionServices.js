import Subscription from "../../models/subscriptionModel.js";

export const getSubscription=async (req,res) => {
  
     try {
      const subscription= await Subscription.find({})
      if (!subscription||subscription.length==0) {
         return res.status(404).json({
            message: "Subscription Not Found",
            });
      }
        res.status(200).json({
        message:subscription,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addSubscription =async (req,res) => {
  const {vehicleNumber,vltdDevice,plan,activePlan,expiry}=req.body

     if(!vehicleNumber||!vltdDevice||!plan||!activePlan||!expiry){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const subscription = await Subscription.create({
            vehicleNumber,
            vltdDevice,
            plan,
            activePlan,
            expiry
      })
      
      if(!subscription){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Subscription "
             })
      }
      res.status(201).json({
        message:"created",
        data:subscription
      }) 
     } catch (error) {
      console.log(error);
      
        res.status(500).json({
        message:error.errmsg
         })
     }
}