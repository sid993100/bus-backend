
import Department from "../../../models/departmentModel.js";
import consoleManager from "../../../utils/consoleManager.js";

export const getDepartment=async (req,res) => {
  
     try {
      const department= await Department.find({})
      if (!department||department.length==0) {
         return res.status(404).json({
            message: "Department Not Found",
            });
      }
        res.status(200).json({
        message:department,
        log:"ok"
       })

     } catch (error) {
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const addDepartment =async (req,res) => {
  
  const {name}=req.body

     if(!name){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const department = await Department.create({
            name
      })
      
      if(!department){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Department "
             })
      }
      res.status(201).json({
        message:"created",
        data:department
      }) 
     } catch (error) {
      consoleManager.log(error);
      
        res.status(500).json({
        message:error.errmsg
         })
     }
}

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid Department ID format",
      });
    }

    // Check if name field is provided
    if (!name) {
      return res.status(400).json({
        message: "Name field is required to update",
      });
    }

    // Update the department
    const updatedDepartment = await Department.findByIdAndUpdate(
      id, 
      { name }, 
      { new: true } // Return the updated document
    );

    if (!updatedDepartment) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.status(200).json({
      message: "Department updated successfully",
      data: updatedDepartment,
    });

  } catch (error) {
    consoleManager.log(error);
    res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};

export const updateDepartmentByName = async (req, res) => {
  try {
    const { departmentName } = req.params;
    const { name } = req.body;

    if (!departmentName) {
      return res.status(400).json({
        message: "Department name is required",
      });
    }

    if (!name) {
      return res.status(400).json({
        message: "Name field is required to update",
      });
    }

    const updatedDepartment = await Department.findOneAndUpdate(
      { name: departmentName },
      { name },
      { new: true }
    );

    if (!updatedDepartment) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.status(200).json({
      message: "Department updated successfully",
      data: updatedDepartment,
    });

  } catch (error) {
    consoleManager.log(error);
    res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};
