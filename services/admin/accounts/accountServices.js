import Account from "../../../models/accountModel.js";


export const addAccount=async (req,res) => {
  const user=req.user
  const {accountCode,name,description}=req.body
  console.log(accountCode,name,description);
  
  if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
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
      console.log(error);
      
       return res.status(500).json({
        message:"Server Error"
         })
     }
}
export const getAccount = async (req, res) => {
 try {
     const user = req.user;
     if (user.hierarchy !== "ADMIN") {
       return res.status(403).json({
         message: " Not Admin",
       });
     }
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