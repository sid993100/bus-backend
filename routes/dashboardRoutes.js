import{Router} from "express"
import { getAllDashboardData } from "../services/dashboardServices.js"
import { isLogin } from "../middleWares/isLogin.js"

const router=Router()

router.get("/all",isLogin,getAllDashboardData)

export default router

