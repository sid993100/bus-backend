import Account from "../../../models/accountModel.js";
import consoleManager from "../../../utils/consoleManager.js";
import responseManager from "../../../utils/responseManager.js";


export const addAccount=async (req,res) => {
  const user=req.user
  const {accountCode,name,description}=req.body
  consoleManager.log(accountCode,name,description);
  

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
                 message:"Somthing went Wrong while Creating A Account "
             })
      }
      res.status(201).json({
        message:"created",
        data:account
      }) 
     } catch (error) {
      consoleManager.log(error);
      
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const getAccount = async (req, res) => {
 try {
      const accounts = await Account.find({});
      if (!accounts) {
        return res.status(404).json({
           message: "Account Not Found",
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
        message: "Account ID is required",
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
        message: "Account not found",
      });
    }

    res.status(200).json({
      message: "Account updated successfully",
      data: updatedAccount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};
