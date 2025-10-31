import Customer from "../../models/customerModel.js"
import generateToken from "../../utils/generateToken.js"
import passwordCheck from "../../utils/passwordCheck.js"
import consoleManager from "../../utils/consoleManager.js";

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "All Details Required"
        });
    }

    try {
        console.log(email, password);
        let user = await Customer.findOne({ email });

        if (!user) {
            // New registration
            user = new Customer({ email, password });
            await user.save();
            const token = generateToken(user._id);
            return res.status(201)
                .cookie("token", token, { httpOnly: true })
                .json({
                    success: true,
                    message: "Customer Registered Successfully",
                    token
                });
        }

        const checkedPassword = await passwordCheck(password, user.password);

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
                token
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
        const customers = await Customer.find()
        res.status(200).json({
            success: true,
            date: customers
        })
    } catch (error) {
        consoleManager.log("Get all customers problem");
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
        console.log(id);
        console.log(data);


        const customer = await Customer.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        res.status(200).json({
            success: true,
            data: customer
        })
    } catch (error) {
        consoleManager.log("Update customer problem");
        res.status(500).json({
            success: false,
            message: "server error"
        })
    }
}