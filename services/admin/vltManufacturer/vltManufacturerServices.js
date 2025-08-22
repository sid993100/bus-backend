import mongoose from "mongoose";
import VltdManufacturer from "../../../models/vltdManufacturerModel.js";

export const getVltdManufacturer=async (req,res) => {
  const user = req.user;
     
     try {
      const vltdManufacturer= await VltdManufacturer.find({})
      if (!vltdManufacturer) {
         return res.status(404).json({
            message: "Vltd Manufacturer Not Found",
            });
      }
        res.status(200).json({
        message:vltdManufacturer,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export async function addVltdManufacturer(req, res) {
    const user = req.user;
    const { name, shortName } = req.body;

    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: " Not Admin",
        });
    }
    if (!name || !shortName) {
        return res.status(404).json({
            message: "All details Required"
        });
    }
    try {

        const vltdManufacturer = await VltdManufacturer.create({
            manufacturerName: name,
            shortName
        });

        if (!vltdManufacturer) {
            res.status(500).json({
                message: "Somthing went Wrong while Creating A Account "
            });
        }
        res.status(201).json({
            message: "created",
            data: vltdManufacturer
        });
    } catch (error) {
        res.status(500).json({
            message: error.errmsg
        });
    }
}

export async function updateVltdManufacturer(req, res) {
  try {
    const { id } = req.params;
    const { name, shortName } = req.body;


    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid VltdManufacturer ID format"
      });
    }

    // Require at least one field to update
    if (name === undefined && shortName === undefined) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.manufacturerName = name;
    if (shortName !== undefined) updateData.shortName = shortName;

    // Perform update
    const updatedManufacturer = await VltdManufacturer.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedManufacturer) {
      return res.status(404).json({
        message: "VltdManufacturer not found"
      });
    }

    res.status(200).json({
      message: "VltdManufacturer updated successfully",
      data: updatedManufacturer
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
}
