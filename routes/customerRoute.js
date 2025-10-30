import {Router} from 'express';
import { check, getAllCustomers, login, logout, updateCustomer } from '../services/customer/customerService.js';
import { isLogin } from '../middlewares/isLogin.js';

const router=Router();

router.post("/login",login)
router.post("/logout",logout)
router.get("/check",isLogin,check)

router.get("/all",isLogin,getAllCustomers)
router.patch("/update",isLogin,updateCustomer)
export default router