import { Router } from "express";
import { isLogin } from "../middleWares/isLogin.js";
import { getRoutes } from "../services/userServices.js";


const router= Router()

router.post("/routes",isLogin,getRoutes)
// router.post("/routes/:id",isLogin,getRoute)

export default router