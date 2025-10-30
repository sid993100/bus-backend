import {Router} from 'express';
import { check, getAllCustomers, login, logout } from '../services/customer/customerService.js';
import { isLogin } from '../middlewares/authMiddleware.js';

const router=Router();

router.post("/login",login)
router.post("/logout",logout)
router.get("/check",isLogin,check)

router.get("/all",isLogin,getAllCustomers)

export default router