import {Router} from 'express';
import { changePassword, check, forgotPassword, getAllCustomers, login, logout, resetPassword, signup, updateCustomer, updateCustomerById } from '../services/customer/customerService.js';
import { isLogin } from '../middlewares/isLogin.js';

const router=Router();

router.post("/signup",signup)
router.post("/login",login)
router.post("/logout",logout)
router.get("/check",isLogin,check)

router.get("/all",isLogin,getAllCustomers)
router.put("/update",isLogin,updateCustomer)
router.put("/:id",isLogin,updateCustomerById)
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword', resetPassword);
router.post("/changepassword",isLogin,changePassword)
export default router