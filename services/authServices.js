import User from "../models/userModel.js";
import consoleManager from "../utils/consoleManager.js";
import generateToken from "../utils/generateToken.js";
import passwordCheck from "../utils/passwordCheck.js";
import { sendResetEmail } from "../utils/sendResetEmail.js";
import bcrypt from "bcryptjs";

export const signin = async (req, res) => {
  const { name, email, phone, password, role, region } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "All details required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: name,
      email,
      phone,
      password: hashedPassword,
      region,
      role
    });

    if (!user) {
      return res.status(500).json({ message: "Something went wrong while creating user" });
    }

    const token = generateToken(user._id);

    res
      .status(201)
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      })
      .json({
        message: "User created",
        user
      });
  } catch (error) {
    consoleManager.log(error + " signin");
    res.status(500).json({ message: "Backend error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All details required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const checkedPassword = await passwordCheck(password, user.password);
    if (!checkedPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      })
      .json({
        message: "Login successful",
        user
      });
  } catch (error) {
    consoleManager.log(error + " login");
    res.status(500).json({ message: "Backend error" });
  }
};

export const logout = async (req, res) => {
  try {
    res
      .status(200)
      .clearCookie("token")
      .json({ message: "Logout successful" });
  } catch (error) {
    res
      .status(500)
      .clearCookie("token")
      .json({ message: "Server error" });
  }
};

export const check = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    consoleManager.log(error + " check problem");
    res.status(500).json({ message: "Server error" });
  }
};

const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetCode = generateResetCode();
    user.resetCode = resetCode;
    user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    const emailSent = await sendResetEmail(email, resetCode);
    if (!emailSent) return res.status(500).json({ message: "Failed to send email" });

    res.status(200).json({ message: "Reset code sent to your email" });
  } catch (error) {
    consoleManager.log(error + " forgotPassword");
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

    if (!user) return res.status(400).json({ message: "Invalid or expired code" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = null;
    user.resetCodeExpires = null;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    consoleManager.log(error + " resetPassword");
    res.status(500).json({ message: "Server error" });
  }
};
