import bcrypt from 'bcrypt';
import Account from "../../../models/accountModel.js";
import Role from "../../../models/roleModel.js";
import User from "../../../models/userModel.js";
import Hierarchy from '../../../models/hierarchyModel.js';
import Region from '../../../models/regionModel.js';

const populateUser = (query) => {
    return query
        .populate('account', 'account')
        .populate('roleName', 'role')
        .populate('hierarchy', 'name')
        .populate('region', 'name');
};

export const getUsers = async (req, res) => {
    try {
        const userQuery = User.find({}).select('-password').sort({ username: 1 });
        const users = await populateUser(userQuery);

        if (!users) {
            return res.status(404).json({ message: "Users Not Found" });
        }
        
        return res.status(200).json({
            message: "Users Retrieved Successfully",
            data: users,
            count: users.length
        });
    } catch (error) {
        return res.status(500).json({ message: "Backend Error", error: error.message });
    }
};

export const getUser = async (req, res) => {
    const { id } = req.params;
    try {
        const userQuery = User.findById(id).select('-password');
        const foundUser = await populateUser(userQuery);
        
        if (!foundUser) {
            return res.status(404).json({ message: "User Not Found" });
        }
        
        return res.status(200).json({
            message: "User Retrieved Successfully",
            data: foundUser
        });
    } catch (error) {
        return res.status(500).json({ message: "Backend Error", error: error.message });
    }
};

export const addUser = async (req, res) => {
    const { username, email, password, phone, hierarchy, region, account, roleName } = req.body;
    
    if (!username || !email || !password || !phone || !hierarchy) {
        return res.status(400).json({ message: "Username, Email, Password, Phone, and Hierarchy are Required" });
    }
    
    try {
        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
            return res.status(409).json({ message: "User with this email already exists" });
        }
        
        const existingPhoneUser = await User.findOne({ phone });
        if (existingPhoneUser) {
            return res.status(409).json({ message: "User with this phone number already exists" });
        }
        
        const newUser = new User({
            username, email, password, phone,
            hierarchy, region, account, roleName
        });
        await newUser.save();

        const userQuery = User.findById(newUser._id).select('-password');
        const populatedUser = await populateUser(userQuery);
            
        return res.status(201).json({
            message: "User Created Successfully",
            data: populatedUser
        });

    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({ message: `${field} must be unique` });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { password, ...updateData } = req.body;

    try {
        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        await User.findByIdAndUpdate(id, updateData, { runValidators: true });

        const updatedUserQuery = User.findById(id).select('-password');
        const updatedUser = await populateUser(updatedUserQuery);
        
        if (!updatedUser) {
            return res.status(404).json({ message: "User Not Found" });
        }
        
        return res.status(200).json({
            message: "User Updated Successfully",
            data: updatedUser
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({ message: `${field} must be unique` });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedUser = await User.findByIdAndDelete(id).select('-password');
        if (!deletedUser) {
            return res.status(404).json({ message: "User Not Found" });
        }
        return res.status(200).json({ message: "User Deleted Successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server Error" });
    }
};