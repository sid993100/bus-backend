import jwt from "jsonwebtoken"
import User from "../models/userModel.js";
import Customer from "../models/customerModel.js";


export const isLogin=async(req,res,next)=>{

    const token=req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    try {
        if(!token){
           return res.status(404).json({
                message:"No Token"
            })
        }
        const tokenUser=jwt.verify(token,process.env.JWT_TOKEN)
        if(!tokenUser){
            res.status(401).json({
                message:"Invalide"
            })
        }
        const user=await User.findOne({_id:tokenUser.id}).populate("roleName").populate("hierarchy").populate("region").populate("depot").select("-password")
        if(!user){
            const customerExists = await Customer.findById(tokenUser.id);
            if(customerExists){
                req.user=customerExists
                return next()
            }else{
            res.status(401).json({
                message:"Not Found"
            })}
        }
        
        req.user=user
        next()

    } catch (error) {
       
        res.status(500).clearCookie("token").json({message:"islogin error"})
    }

}