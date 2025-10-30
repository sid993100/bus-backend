import { Router } from "express";
import { deleteTrips } from "../../services/admin/trip/tripServices.js";
import { isLogin } from "../../middlewares/isLogin.js";


const router = Router();

router.delete("/trip",isLogin,deleteTrips)

export default router;