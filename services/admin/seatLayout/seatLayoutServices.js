import SeatLayout from "../../../models/seatLayoutModel.js";

export const getSeatLayout= async (req,res) => {
     const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: "Not Admin",
       });
     }
     try {
        const seatLayout= await SeatLayout.find({})
        if(!seatLayout){
            return res.status(404).json({
            message: "Duty Not Found",
            }); 
        }
           res.status(200).json({
        message:seatLayout,
        log:"ok"
       })
     } catch (error) {
         res.status(500).json({
        message:"Server Error"
         })
     }
}

export const addSeatLayout=async (req,res) => {
   try {
         const user=req.user
  const {layoutName,seatCapacity,department,servicesLinked,fci}=req.body
  
  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
     if(!layoutName||!seatCapacity||!department||!servicesLinked||!fci){
       return res.status(404).json({
            message:"All details Required"
         })
     }
      const seatLayout=await SeatLayout.create({
        layoutName,
        seatCapacity,
        department,
        servicesLinked,
        fci
      })
      
      if(!seatLayout){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:seatLayout
      })

     } catch (error) {
      console.log(error);
      
         res.status(500).json({
        message:error.errmsg
         })
     }
}