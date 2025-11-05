import Customer from "../../models/customerModel.js"
import generateToken from "../../utils/generateToken.js"
import passwordCheck from "../../utils/passwordCheck.js"
import consoleManager from "../../utils/consoleManager.js";

export const login = async (req, res) => {
    const data = req.body;

    if (!data.email || !data.password) {
        return res.status(400).json({
            success: false,
            message: "All Details Required"
        });
    }

    try {
        let user = await Customer.findOne({email: data.email });

        if (!user) {
            user = new Customer(data);
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
        }

        const checkedPassword = await passwordCheck(data.password, user.password);

        if (!checkedPassword) {
            return res.status(401).json({
                success: false,
                message: "Detail Wrong"
            });
        }

        const token = generateToken(user._id);
        return res.status(200)
            .cookie("token", token, { httpOnly: true })
            .json({
                success: true,
                message: "login",
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