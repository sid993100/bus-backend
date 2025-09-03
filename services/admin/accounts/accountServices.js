import Account from "../../../models/accountModel.js";
import consoleManager from "../../../utils/consoleManager.js";



export const addAccount=async (req,res) => {
  const {accountCode,name,description}=req.body

     if(!accountCode||!name){
       return res.status(404).json({
            message:"All details Required"
         })
     }
     try {     
 
        const account= await Account.create({
        accountCode,
        account:name,
        description
      })
      
      if(!account){
         res.status(500).json({
                 message:"Somthing went Wrong while Creating A Department "
             })
      }
      res.status(201).json({
        message:"created",
        data:account
      }) 
     } catch (error) {
      
       if (error.code === 11000) {
      return res.status(409).json({
        message: "Department already exists"
      });
    }
    
    return res.status(500).json({
      message: "Server Error"
    });
     }
}
export const getAccount = async (req, res) => {
 try {
      const accounts = await Account.find({});
      if (!accounts||accounts.length===0) {
        return res.status(404).json({
           message: "Department Not Found",
         });
      }
   
      return res.status(200).json({
       message:accounts
      })
 } catch (error) {
    return res.status(500).json({
        message:"Backend Error"
    })
 }
};
export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params; // account ID from URL
    consoleManager.log(id);
    
    const { accountCode, name, description } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({
        message: "Department ID is required",
      });
    }

    if (!accountCode && !name && !description) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    // Find and update
    const updatedAccount = await Account.findByIdAndUpdate(
      id,
      {
        ...(accountCode && { accountCode }),
        ...(name && { account: name }),
        ...(description && { description }),
      },
      { new: true } // return updated document
    );

    if (!updatedAccount) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.status(200).json({
      message: "Department updated successfully",
      data: updatedAccount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
