import Customer from "../../models/customerModel.js"
import generateToken from "../../utils/generateToken.js"
import passwordCheck from "../../utils/passwordCheck.js"
import consoleManager from "../../utils/consoleManager.js";
import { sendResetEmail } from "../../utils/sendResetEmail.js";

export const signup = async (req, res) => {
    const data = req.body;

    if (!data.email || !data.password) {
        return res.status(400).json({
            success: false,
            message: "Email and Password are required"
        });
    }

    try {
        // Check if user already exists
        const existingUser = await Customer.findOne({ email: data.email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Customer with this email already exists"
            });
        }

        // Create new customer
        const user = new Customer(data);
        await user.save();
        
        const token = generateToken(user._id);
        return res.status(201)
            .cookie("token", token, { httpOnly: true })
            .json({
                success: true,
                message: "Customer Registered Successfully",
                token,
                userId: user._id
            });
    } catch (error) {
        consoleManager.log(error + " signup problem");
        return res.status(500).json({
            success: false,
            message: "Backend Error"
        });
    }
}

export const login = async (req, res) => {
    const data = req.body;

    if (!data.email || !data.password) {
        return res.status(400).json({
            success: false,
            message: "Email and Password are required"
        });
    }

    try {
        const user = await Customer.findOne({ email: data.email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Customer not found. Please sign up first."
            });
        }

        const checkedPassword = await passwordCheck(data.password, user.password);

        if (!checkedPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id);
        return res.status(200)
            .cookie("token", token, { httpOnly: true })
            .json({
                success: true,
                message: "Login successful",
                token,
                userId: user._id
            });
    } catch (error) {
        consoleManager.log(error + " login problem");
        return res.status(500).json({
            success: false,
            message: "Backend Error"
        });
    }
}

export const logout = async (req, res) => {
    try {
        res.status(200)
            .clearCookie("token")
            .json({
                message: "logout"
            })
    } catch (error) {
        res.status(500)
            .clearCookie("token")
            .json({
                message: "server error"
            })
    }
}
export const check = async (req, res) => {
    try {
        res.status(200).json({
            user: req.user
        })
    } catch (error) {
        consoleManager.log(error + ' check problem');

        res.status(500)
            .json({
                message: "server error"
            })
    }
}
export const getAllCustomers = async (req, res) => {
    try {
        const {page=1,limit=10}=req.query;
        const skip= (page-1)*limit
        const customers = await Customer.find().skip(skip).limit(limit);
        res.status(200).json({
            success: true,
            data: customers
        })
    } catch (error) {
        consoleManager.log(error);
        res.status(500).json({
            success: false,
            message: "server error"
        })
    }
}
export const updateCustomer = async (req, res) => {
    try {
        const id = req.user._id;
        const data = req.body
        
        // Find customer first
        const customer = await Customer.findById(id);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }
        
        // Update all fields - password will be hashed by pre-save hook
        Object.keys(data).forEach(key => {
            if (key !== '_id' && data[key] !== undefined) {
                customer[key] = data[key];
            }
        });
        
        // Save will trigger pre-save hook to hash password if it was modified
        await customer.save();
        
        res.status(200).json({
            success: true,
            data: customer
        })
    } catch (error) {
        consoleManager.log("Update customer problem: " + error.message);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const updateCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body
        
        // Find customer first
        const customer = await Customer.findById(id);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }
        
        // Update all fields - password will be hashed by pre-save hook
        Object.keys(data).forEach(key => {
            if (key !== '_id' && data[key] !== undefined) {
                customer[key] = data[key];
            }
        });
        
        // Save will trigger pre-save hook to hash password if it was modified
        await customer.save();
        
        res.status(200).json({
            success: true,
            data: customer
        })
    } catch (error) {
        consoleManager.log("Update customer problem: " + error.message);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await Customer.findOne({ email });
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

    const user = await Customer.findOne({
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

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different" });
    }

    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await passwordCheck(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}