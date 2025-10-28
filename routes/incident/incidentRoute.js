import { Router } from "express";
import { isLogin } from "../../middleWares/isLogin.js";
import { createIncident, deleteAllIncidents, getIncidents } from "../../services/incidentHandling/incidentHandling.js";


const router= Router();

router.get("/",isLogin, getIncidents);

router.post("/" , createIncident);

router.delete("/",isLogin,deleteAllIncidents)

export default router