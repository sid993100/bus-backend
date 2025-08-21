import User from "../models/userModel.js";
import consoleManager from "../utils/consoleManager.js";
import generateToken from "../utils/generateToken.js";
import passwordCheck from "../utils/passwordCheck.js";

import { sendResetEmail } from "../utils/sendResetEmail.js";

export const signin=async (req,res)=>{
   
    
    const {name,email,phone,password,}=req.body
    if(!name||!email||!phone||!password){
        return res.status(404).json({
                 message:"All details Required"
             })
    }
try {
    
        const existingUser=await User.findOne({email})
        consoleManager.log(existingUser);
        
        if(existingUser){
             return res.status(404).json({
                 message:"User Exist"
             })
        }
        let user 
        if(!role){
              user = await User.create({
            username:name,
            email,
            phone,
            password,
            region,
        })
        }
        
        if(role){
             user = await User.create({
            username:name,
            email,
            phone,
            password,
            region,
            role
        })
        }
        if(!user){
              res.status(500).json({
                 message:"Somthing went Wrong Whil Creating A User "
             })
        }
        const token=generateToken(user._id)
          res.status(201).cookie("token",token).json({
             message:"User Created"
         })
} catch (error) {
    consoleManager.log(error +" signin");
    res.status(500).json({
        message:"Backend Error"
    })
}

}

export const login= async(req,res)=>{
    const {email,password}=req.body
    
    if(!email||!password){
        res.status(403).json({
            message:"All Detail Required"
        })
    }

    try {
        const user = await User.findOne({email})
     
        
        if(!user){
            res.status(404).json({
                message:"User Not Found"
            })
        }
        const checkedPassword = await passwordCheck(password,user.password)
 
        
        if(!checkedPassword){
            res.status(404).json({
                message:" Detail Wrong"
            })
        }
          const token = generateToken(user._id)
          
        res.status(200).cookie("token",token).json({
            message:"login"
        })
    } catch (error) {
        consoleManager.log("login problem");
        res.status(500).json({
            message:"Backend Error"
        })
    }
}

export const logout = async (req,res)=>{
     try {
        res.status(200)
        .clearCookie("token")
        .json({
         message:"logout"
        })
    } catch (error) {
        res.status(500)
        .clearCookie("token")
        .json({
         message:"server error"
        })
    }
}
export const check=async(req,res)=>{
    try {
        res.status(200).json({
            user:req.user
        })
    } catch (error) {
        consoleManager.log(error +' check problem');
        
        res.status(500)
        .json({
         message:"server error"
        })
    }
}

// Generate 6-digit code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit code
    const resetCode = generateResetCode();
    
    // Save code and expiration (10 minutes)
    user.resetCode = resetCode;
    user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    await user.save();
    
    const emailSent = await sendResetEmail(email, resetCode);
    


    
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send email" });
    }

    res.status(200).json({ message: "Reset code sent to your email" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;


    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({
      email,
      resetCode,
      resetCodeExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    // Update password and clear reset code
    user.password = newPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};
