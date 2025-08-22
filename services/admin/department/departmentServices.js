
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