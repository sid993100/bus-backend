import bcrypt from 'bcrypt';
import User from "../../../models/userModel.js";
import { isValidObjectId } from 'mongoose';
import Role from "../../../models/roleModel.js"
import Account from "../../../models/accountModel.js"

const populateUser = (query) => {
    return query
        .populate('account', 'account')
        .populate('roleName', 'role')
        .populate('hierarchy', 'name level')
        .populate('region', 'name code')
        .populate('depot', 'depotCustomer code');
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
      emergencyContact, aadhar, address, state, pinCode,depot
    } = req.body;

    // ✅ Required field check
    const requiredFields = {
      username: "Username is required",
      email: "Email is required",
      password: "Password is required",
      phone: "Phone number is required",
      hierarchy: "Hierarchy is required",
    };

    const errors = {};
    Object.keys(requiredFields).forEach((field) => {
      if (!req.body[field] || req.body[field].toString().trim() === "") {
        errors[field] = requiredFields[field];
      }
    });

    // ✅ Format checks
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format";
    }
    if (password && password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }
    if (phone && !/^\d{10}$/.test(phone.toString())) {
      errors.phone = "Phone must be exactly 10 digits";
    }
    if (emergencyContact && !/^\d{10}$/.test(emergencyContact.toString())) {
      errors.emergencyContact = "Emergency contact must be exactly 10 digits";
    }
    if (aadhar && !/^\d{12}$/.test(aadhar.toString())) {
      errors.aadhar = "Aadhar must be exactly 12 digits";
    }
    if (pinCode && !/^\d{6}$/.test(pinCode.toString())) {
      errors.pinCode = "Pin code must be exactly 6 digits";
    }
    if (username && username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters long";
    }
    if (state && state.trim().length < 2) {
      errors.state = "State must be at least 2 characters long";
    }
    if (address && address.trim().length < 10) {
      errors.address = "Address must be at least 10 characters long";
    }

    // ✅ ObjectId validation
    ["hierarchy", "region", "account", "roleName"].forEach((field) => {
      if (req.body[field] && !isValidObjectId(req.body[field])) {
        errors[field] = `Invalid ${field} ID format`;
      }
    });

    // ✅ Business rule
    if (phone && emergencyContact && phone.toString() === emergencyContact.toString()) {
      errors.emergencyContact = "Emergency contact cannot be the same as phone";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    // ✅ Check conflicts
    const existingUsers = await User.find({
      $or: [{ email: email.toLowerCase() }, { phone }]
    }).select("email phone aadhar");

    const conflicts = [];
    existingUsers.forEach((user) => {
      if (user.email === email.toLowerCase()) {
        conflicts.push({ field: "email", message: "Email already exists" });
      }
      if (user.phone == phone) {
        conflicts.push({ field: "phone", message: "Phone already exists" });
      }
      if (user.aadhar == aadhar) {
        conflicts.push({ field: "aadhar", message: "Aadhar already exists" });
      }
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
        conflicts,
      });
    }

    // ✅ Create new user
    const newUser = new User({
      username: username.trim().toUpperCase(),
      email: email.toLowerCase().trim(),
      password,
      phone,
      hierarchy,
      emergencyContact,
      aadhar,
      address,
      state,
      pinCode,
      region,
      account,
      roleName,
      depot
    });

    await newUser.save();
    const userQuery = User.findById(newUser._id).select("-password -resetCode -resetCodeExpires");
    const populatedUser = await populateUser(userQuery);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: populatedUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
        field,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};



export const updateUser = async (req, res) => {
 
    const { id } = req.params;
    const {
        username,
        email,
        password,
        phone,
        hierarchy,
        region,
        depot,
        account,
        roleName
    } = req.body;
    


    if (!username || !email || !phone) {
        return res.status(400).json({
            message: "Username, Email, and Phone are Required"
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: "Invalid email format"
        });
    }

    // Validate phone number
    if (phone.toString().length !== 10) {
        return res.status(400).json({
            message: "Phone number should be 10 digits"
        });
    }

    try {
        // Check if email already exists (excluding current user)
        const existingEmailUser = await User.findOne({
            _id: { $ne: id },
            email
        });
        if (existingEmailUser) {
            return res.status(409).json({
                message: "User with this email already exists"
            });
        }

        // Check if phone already exists (excluding current user)
        const existingPhoneUser = await User.findOne({
            _id: { $ne: id },
            phone
        });
        if (existingPhoneUser) {
            return res.status(409).json({
                message: "User with this phone number already exists"
            });
        }

        // Validate referenced documents if provided
        if (account) {
            const existingAccount = await Account.findById(account);
            if (!existingAccount) {
                return res.status(404).json({
                    message: "Account Not Found"
                });
            }
        }

        if (roleName) {
            const existingRole = await Role.findById(roleName);
            if (!existingRole) {
                return res.status(404).json({
                    message: "Role Not Found"
                });
            }
        }

        // Prepare update data
        const updateData = {
            username,
            email,
            phone,
            hierarchy,
            region,
            account,
            roleName,depot
        };

        // Hash password if provided
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    message: "Password should be at least 6 characters long"
                });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('account', 'accountName accountNumber')
        .populate('roleName', 'roleName permissions')
        .select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        return res.status(200).json({
            message: "User Updated Successfully",
            data: updatedUser
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                message: `${field} must be unique`
            });
        }
        return res.status(500).json({
            message: error.message
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



export const setActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }

    // Validate isActive field
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "isActive field is required and must be a boolean value"
      });
    }

    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true, select: "-password" }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Log the activity (optional)
    console.log(`User ${updatedUser.username} status changed to: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);

    return res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({
      success: false,
      message: "Server error occurred",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};


