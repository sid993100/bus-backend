import jwt from "jsonwebtoken"
import User from "../models/userModel.js";
import consoleManager from "../utils/consoleManager.js";

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
        const user=await User.findOne({_id:tokenUser.id}).populate("roleName").select("-password")
        consoleManager.log(user)
        if(!user){
            res.status(401).json({
                message:"Not Found"
            })
        }
        
        req.user=user
        next()

    } catch (error) {
        console.log(error);
        res.status(500).clearCookie("token").json({message:"islogin error"})
    }

}