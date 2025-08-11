import VltdManufacturer from "../../../models/vltdManufacturerModel.js";

export const getVltdManufacturer=async (req,res) => {
  const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
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