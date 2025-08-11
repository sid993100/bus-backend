import ServiceCategory from "../../../models/serviceCategoryModel.js";

export const getServiceCategory= async (req,res)=>{
    const user = req.user
    if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
   try {
      const serviceCategory=await ServiceCategory.find({})
      if(!serviceCategory){
          return res.status(404).json({
            message: "Service Category Type Not Found",
          });
      }
 
      return res.status(200).json({
        message:serviceCategory
       }) 
   } catch (error) {
      return res.status(500).json({
        message:"Backend Error"
    })
   }

};
export const addServiceCategory=async (req,res) => {
   const user=req.user
  const {name,description}=req.body
  
  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!name){
       return res.status(404).json({
            message:"All details Required"
         })
     }

  try {    
      const serviceCategory= await ServiceCategory.create({
       serviceCategory:name,
        description
      })
      
      
      if(!serviceCategory){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:serviceCategory
      })
  } catch (error) {
    return res.status(500).json({
        message:"Server Error"
         })
  }
};