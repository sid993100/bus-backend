import bcrypt from 'bcrypt';
import User from "../../../models/userModel.js";
import { isValidObjectId } from 'mongoose';

const populateUser = (query) => {
    return query
        .populate('account', 'account')
        .populate('roleName', 'role')
        .populate('hierarchy', 'name level')
        .populate('region', 'name code');
};


export const getUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            search, 
            hierarchy, 
            region, 
            roleName,
            sortBy = 'username',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        let query = {};
        
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { state: { $regex: search, $options: 'i' } }
            ];
        }

        if (hierarchy && isValidObjectId(hierarchy)) {
            query.hierarchy = hierarchy;
        }

        if (region && isValidObjectId(region)) {
            query.region = region;
        }

        if (roleName && isValidObjectId(roleName)) {
            query.roleName = roleName;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Sort configuration
        const sortConfig = {};
        sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const userQuery = User.find(query)
            .select('-password -resetCode -resetCodeExpires')
            .sort(sortConfig)
            .skip(skip)
            .limit(parseInt(limit));

        const users = await populateUser(userQuery);
        const totalCount = await User.countDocuments(query);

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "No users found",
                data: []
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount: totalCount,
                hasNext: skip + users.length < totalCount,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error", 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};


export const getUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const userQuery = User.findById(id).select('-password -resetCode -resetCodeExpires');
        const foundUser = await populateUser(userQuery);
        
        if (!foundUser) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            data: foundUser
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }
        
        return res.status(500).json({ 
            success: false,
            message: "Internal server error", 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};


export const addUser = async (req, res) => {
    try {
        const { 
            username, email, password, phone, hierarchy, region, account, roleName,
            emergencyContact, aadhar, address, state, pinCode
        } = req.body;
        
        // Enhanced validation for all required fields
        const requiredFields = {
            username: 'Username is required',
            email: 'Email is required',
            password: 'Password is required',
            phone: 'Phone number is required',
            hierarchy: 'Hierarchy is required',
            emergencyContact: 'Emergency contact is required',
            aadhar: 'Aadhar number is required',
            address: 'Address is required',
            state: 'State is required',
            pinCode: 'Pin code is required'
        };

        const errors = {};
        
        // Check for missing required fields
        Object.keys(requiredFields).forEach(field => {
            if (!req.body[field] || req.body[field] === '') {
                errors[field] = requiredFields[field];
            }
        });

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed - Missing required fields",
                errors: errors
            });
        }

        // Format and validation checks
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.email = 'Please provide a valid email address';
        }

        // Password validation (minimum 6 characters)
        if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters long';
        }

        // Phone number validation (10 digits)
        if (!/^\d{10}$/.test(phone.toString())) {
            errors.phone = 'Phone number must be exactly 10 digits';
        }

        // Emergency contact validation (10 digits)
        if (!/^\d{10}$/.test(emergencyContact.toString())) {
            errors.emergencyContact = 'Emergency contact must be exactly 10 digits';
        }

        // Aadhar validation (12 digits)
        if (!/^\d{12}$/.test(aadhar.toString())) {
            errors.aadhar = 'Aadhar number must be exactly 12 digits';
        }

        // Pin code validation (6 digits)
        if (!/^\d{6}$/.test(pinCode.toString())) {
            errors.pinCode = 'Pin code must be exactly 6 digits';
        }

        // Username validation (minimum 3 characters)
        if (username.trim().length < 3) {
            errors.username = 'Username must be at least 3 characters long';
        }

        // State validation (minimum 2 characters)
        if (state.trim().length < 2) {
            errors.state = 'State must be at least 2 characters long';
        }

        // Address validation (minimum 10 characters)
        if (address.trim().length < 10) {
            errors.address = 'Address must be at least 10 characters long';
        }

        // Validate ObjectIds
        const objectIdFields = ['hierarchy', 'region', 'account', 'roleName'];
        objectIdFields.forEach(field => {
            if (req.body[field] && !isValidObjectId(req.body[field])) {
                errors[field] = `Invalid ${field} ID format`;
            }
        });

        // Business logic validations
        if (phone.toString() === emergencyContact.toString()) {
            errors.emergencyContact = 'Emergency contact cannot be the same as phone number';
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors
            });
        }

        // Check for existing users
        const existingUsers = await User.find({
            $or: [
                { email: email.toLowerCase() },
                { phone: phone },
                { aadhar: aadhar }
            ]
        }).select('email phone aadhar');

        const conflicts = [];
        existingUsers.forEach(user => {
            if (user.email === email.toLowerCase()) {
                conflicts.push({ field: 'email', message: 'User with this email already exists' });
            }
            if (user.phone == phone) {
                conflicts.push({ field: 'phone', message: 'User with this phone number already exists' });
            }
            if (user.aadhar == aadhar) {
                conflicts.push({ field: 'aadhar', message: 'User with this Aadhar number already exists' });
            }
        });

        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: "User already exists with provided details",
                conflicts: conflicts
            });
        }

        // Create user data object
        const userData = {
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            phone: parseInt(phone),
            hierarchy,
            emergencyContact: parseInt(emergencyContact),
            aadhar: parseInt(aadhar),
            address: address.trim(),
            state: state.trim(),
            pinCode: parseInt(pinCode)
        };

        // Add optional fields if provided
        if (region && isValidObjectId(region)) {
            userData.region = region;
        }
        if (account && isValidObjectId(account)) {
            userData.account = account;
        }
        if (roleName && isValidObjectId(roleName)) {
            userData.roleName = roleName;
        }

        const newUser = new User(userData);
        await newUser.save();

        const userQuery = User.findById(newUser._id).select('-password -resetCode -resetCodeExpires');
        const populatedUser = await populateUser(userQuery);
            
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: populatedUser
        });

    } catch (error) {
        console.error('Error creating user:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            let message = `${field} already exists`;
            
            return res.status(409).json({ 
                success: false,
                message: message,
                field: field
            });
        }
        
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });
            
            return res.status(400).json({ 
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }
        
        return res.status(500).json({ 
            success: false,
            message: "Internal server error", 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};


export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, ...updateData } = req.body;

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        // Check if user exists
        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const errors = {};

        // Validate fields if they are being updated
        if (updateData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updateData.email)) {
                errors.email = 'Please provide a valid email address';
            } else {
                updateData.email = updateData.email.toLowerCase().trim();
            }
        }

        if (updateData.phone && !/^\d{10}$/.test(updateData.phone.toString())) {
            errors.phone = 'Phone number must be exactly 10 digits';
        }

        if (updateData.emergencyContact && !/^\d{10}$/.test(updateData.emergencyContact.toString())) {
            errors.emergencyContact = 'Emergency contact must be exactly 10 digits';
        }

        if (updateData.aadhar && !/^\d{12}$/.test(updateData.aadhar.toString())) {
            errors.aadhar = 'Aadhar number must be exactly 12 digits';
        }

        if (updateData.pinCode && !/^\d{6}$/.test(updateData.pinCode.toString())) {
            errors.pinCode = 'Pin code must be exactly 6 digits';
        }

        if (updateData.username && updateData.username.trim().length < 3) {
            errors.username = 'Username must be at least 3 characters long';
        }

        if (updateData.state && updateData.state.trim().length < 2) {
            errors.state = 'State must be at least 2 characters long';
        }

        if (updateData.address && updateData.address.trim().length < 10) {
            errors.address = 'Address must be at least 10 characters long';
        }

        // Validate ObjectIds if provided
        const objectIdFields = ['hierarchy', 'region', 'account', 'roleName'];
        objectIdFields.forEach(field => {
            if (updateData[field] && !isValidObjectId(updateData[field])) {
                errors[field] = `Invalid ${field} ID format`;
            }
        });

        // Check business logic
        const finalPhone = updateData.phone || existingUser.phone;
        const finalEmergencyContact = updateData.emergencyContact || existingUser.emergencyContact;
        
        if (finalPhone.toString() === finalEmergencyContact.toString()) {
            errors.emergencyContact = 'Emergency contact cannot be the same as phone number';
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors
            });
        }

        // Check for conflicts with other users
        if (updateData.email || updateData.phone || updateData.aadhar) {
            const conflictQuery = { _id: { $ne: id } };
            const orConditions = [];
            
            if (updateData.email) orConditions.push({ email: updateData.email });
            if (updateData.phone) orConditions.push({ phone: updateData.phone });
            if (updateData.aadhar) orConditions.push({ aadhar: updateData.aadhar });
            
            if (orConditions.length > 0) {
                conflictQuery.$or = orConditions;
                
                const conflictingUser = await User.findOne(conflictQuery);
                if (conflictingUser) {
                    const conflicts = [];
                    if (conflictingUser.email === updateData.email) {
                        conflicts.push({ field: 'email', message: 'Email already exists' });
                    }
                    if (conflictingUser.phone == updateData.phone) {
                        conflicts.push({ field: 'phone', message: 'Phone number already exists' });
                    }
                    if (conflictingUser.aadhar == updateData.aadhar) {
                        conflicts.push({ field: 'aadhar', message: 'Aadhar number already exists' });
                    }
                    
                    return res.status(409).json({
                        success: false,
                        message: "Conflict with existing user",
                        conflicts: conflicts
                    });
                }
            }
        }

        // Handle password update separately
        if (password && password.trim() !== "") {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters long"
                });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Normalize data
        if (updateData.username) updateData.username = updateData.username.trim();
        if (updateData.address) updateData.address = updateData.address.trim();
        if (updateData.state) updateData.state = updateData.state.trim();

        await User.findByIdAndUpdate(id, updateData, { runValidators: true });

        const updatedUserQuery = User.findById(id).select('-password -resetCode -resetCodeExpires');
        const updatedUser = await populateUser(updatedUserQuery);
        
        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({ 
                success: false,
                message: `${field} already exists`
            });
        }
        
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });
            
            return res.status(400).json({ 
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }
        
        return res.status(500).json({ 
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};


export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const deletedUser = await User.findByIdAndDelete(id).select('-password -resetCode -resetCodeExpires');
        
        if (!deletedUser) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        return res.status(200).json({ 
            success: true,
            message: "User deleted successfully",
            deletedUser: {
                id: deletedUser._id,
                username: deletedUser.username,
                email: deletedUser.email
            }
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }
        
        return res.status(500).json({ 
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};
