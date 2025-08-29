import Account from "../../../models/accountModel.js";
import Role from "../../../models/roleModel.js";
import User from "../../../models/userModel.js";



export const getUsers = async (req, res) => {
    
    try {
        const users = await User.find({})
            .populate('account', 'account')
            .populate('roleName', 'role permissions')
            .select('-password') // Exclude password from response
            .sort({ username: 1 });
        
        if (!users || users.length === 0) {
            return res.status(404).json({
                message: "Users Not Found",
            });
        }
        
        return res.status(200).json({
            message: "Users Retrieved Successfully",
            data: users,
            count: users.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// GET SINGLE USER BY ID
export const getUser = async (req, res) => {

    const { id } = req.params;
    
    try {
        const foundUser = await User.findById(id)
            .populate('account', 'accountName accountNumber')
            .populate('roleName', 'roleName permissions')
            .select('-password');
        
        if (!foundUser) {
            return res.status(404).json({
                message: "User Not Found",
            });
        }
        
        return res.status(200).json({
            message: "User Retrieved Successfully",
            data: foundUser
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// ADD NEW USER
export const addUser = async (req, res) => {
   
    const {
        username,
        email,
        password,
        phone,
        hierarchy,
        region,
        account,
        roleName
    } = req.body;
   
    
    if (!username || !email || !password || !phone) {
        return res.status(400).json({
            message: "Username, Email, Password, and Phone are Required"
        });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: "Invalid email format"
        });
    }
    
    // Validate phone number (should be 10 digits)
    if (phone.toString().length !== 10) {
        return res.status(400).json({
            message: "Phone number should be 10 digits"
        });
    }
    
    // Validate password strength
    if (password.length < 6) {
        return res.status(400).json({
            message: "Password should be at least 6 characters long"
        });
    }
    
    try {
        // Check if email already exists
        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
            return res.status(409).json({
                message: "User with this email already exists"
            });
        }
        
        // Check if phone already exists
        const existingPhoneUser = await User.findOne({ phone });
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
        
        const newUser = await User.create({
            username,
            email,
            password, // Will be hashed by pre-save middleware
            phone,
            hierarchy: hierarchy || "CUSTOMER", 
            region,
            account,
            roleName
        });
        
        if (!newUser) {
            return res.status(500).json({
                message: "Something went Wrong while Creating User"
            });
        }
        
        // Populate the references and exclude password
        // await newUser.populate('account', 'accountName accountNumber');
        // await newUser.populate('roleName', 'roleName permissions');
        
        // const userResponse = newUser.toObject();
        // delete userResponse.password;
        
        return res.status(201).json({
            message: "User Created Successfully",
            data: userResponse
        });
    } catch (error) {
        console.log(error.message);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                message: `${field} must be unique`
            });
        }
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// UPDATE USER
export const updateUser = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const {
        username,
        email,
        password,
        phone,
        hierarchy,
        region,
        account,
        roleName
    } = req.body;
    
    if (user.hierarchy !== "ADMIN" && user.hierarchy !== "SUPERADMIN") {
        return res.status(403).json({
            message: "Not Authorized",
        });
    }
    
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
            roleName
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
            message: "Server Error"
        });
    }
};

// DELETE USER
export const deleteUser = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    
    if (user.hierarchy !== "ADMIN" && user.hierarchy !== "SUPERADMIN") {
        return res.status(403).json({
            message: "Not Authorized",
        });
    }
    
    try {
        // Prevent user from deleting themselves
        if (user._id.toString() === id) {
            return res.status(400).json({
                message: "Cannot delete your own account"
            });
        }
        
        const deletedUser = await User.findByIdAndDelete(id)
            .populate('account', 'accountName accountNumber')
            .populate('roleName', 'roleName permissions')
            .select('-password');
        
        if (!deletedUser) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }
        
        return res.status(200).json({
            message: "User Deleted Successfully",
            data: deletedUser
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// GET USERS BY HIERARCHY
export const getUsersByHierarchy = async (req, res) => {
    const user = req.user;
    const { hierarchy } = req.params;
    
    if (user.hierarchy !== "ADMIN" && user.hierarchy !== "SUPERADMIN") {
        return res.status(403).json({
            message: "Not Authorized",
        });
    }
    
    const validHierarchies = ["SUPERADMIN", "ADMIN", "DEPORT", "REGION"];
    if (!validHierarchies.includes(hierarchy.toUpperCase())) {
        return res.status(400).json({
            message: "Invalid hierarchy level"
        });
    }
    
    try {
        const users = await User.find({ hierarchy: hierarchy.toUpperCase() })
            .populate('account', 'accountName accountNumber')
            .populate('roleName', 'roleName permissions')
            .select('-password')
            .sort({ username: 1 });
        
        if (!users || users.length === 0) {
            return res.status(404).json({
                message: `No Users Found with ${hierarchy} hierarchy`
            });
        }
        
        return res.status(200).json({
            message: "Users Retrieved Successfully",
            data: users,
            count: users.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Users can only change their own password or admin can change any password
    if (user._id.toString() !== id && user.hierarchy !== "ADMIN" && user.hierarchy !== "SUPERADMIN") {
        return res.status(403).json({
            message: "Not Authorized"
        });
    }
    
    if (!newPassword) {
        return res.status(400).json({
            message: "New password is required"
        });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({
            message: "Password should be at least 6 characters long"
        });
    }
    
    try {
        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }
        
        // If user is changing their own password, verify current password
        if (user._id.toString() === id && currentPassword) {
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, targetUser.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    message: "Current password is incorrect"
                });
            }
        }
        
        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { password: hashedPassword },
            { new: true }
        ).select('-password');
        
        return res.status(200).json({
            message: "Password Changed Successfully",
            data: updatedUser
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};
