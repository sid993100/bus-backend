import Country from "../../../models/countryModel.js";


export const getCountry = async (req,res) => {
    const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     try {
        const country= await Country.find({})
        if (!country) {
             return res.status(404).json({
            message: "Bus Stop Not Found",
            });
        }
        return res.status(200).json({
        message:country
       }) 
     } catch (error) {
        return res.status(500).json({
        message:"Backend Error"
         })
     }
};
export const addCountry= async (req,res) => {
    const user=req.user
  const {code,name}=req.body
  
  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!name||!code){
       return res.status(404).json({
            message:"All details Required"
         })
     }

  try {
      const country=await Country.create({
        countryCode:code,
        country:name
      })
      
      if(!country){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:country
      })
  } catch (error) {
    return res.status(500).json({
        message:"Server Error"
         })
  }
}