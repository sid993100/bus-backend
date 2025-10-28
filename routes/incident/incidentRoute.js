import { Router } from "express";
import { isLogin } from "../../middleWares/isLogin.js";
import { createIncident, getIncidents } from "../../services/incidentHandling/incidentHandling.js";


const router= Router();

router.get("/", getIncidents);

router.post("/" , createIncident);

export default router