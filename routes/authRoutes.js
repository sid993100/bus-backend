import { Router } from "express";
import { changePassword, check, forgotPassword, login, logout, resetPassword, signin } from "../services/authServices.js";
import { isLogin } from "../middleWares/isLogin.js";
const router =Router()

// router.post("/signin",signin)
router.post("/login",login)
router.post("/logout",isLogin,logout)
router.post("/check",isLogin,check)

router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword', resetPassword);
router.post("changepassword",isLogin,changePassword)

export default router