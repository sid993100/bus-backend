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
      consoleManager.log(error);
      
         res.status(500).json({
        message:error.errmsg
         })
     }
}
import mongoose from "mongoose";
import consoleManager from "../../../utils/consoleManager.js";

export const updateSeatLayout = async (req, res) => {
  try {
    const { id } = req.params; // seat layout ID from URL
    const { layoutName, seatCapacity, department, servicesLinked, fci } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid SeatLayout ID format",
      });
    }

    // Require at least one field to update
    if (
      layoutName === undefined &&
      seatCapacity === undefined &&
      department === undefined &&
      servicesLinked === undefined &&
      fci === undefined
    ) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    // Build update object dynamically
    const updateData = {};
    if (layoutName !== undefined) updateData.layoutName = layoutName;
    if (seatCapacity !== undefined) updateData.seatCapacity = seatCapacity;
    if (department !== undefined) updateData.department = department;
    if (servicesLinked !== undefined) updateData.servicesLinked = servicesLinked;
    if (fci !== undefined) updateData.fci = fci;

    // Perform the update
    const updatedSeatLayout = await SeatLayout.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedSeatLayout) {
      return res.status(404).json({
        message: "SeatLayout not found",
      });
    }

    res.status(200).json({
      message: "SeatLayout updated successfully",
      data: updatedSeatLayout,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};
