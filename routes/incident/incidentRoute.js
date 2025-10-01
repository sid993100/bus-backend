import { Router } from "express";
import { isLogin } from "../../middleWares/isLogin.js";
import { roleBaseAuth } from "../../middleWares/rolebaseAuth.js";
import { checkPermission } from "../../middleWares/checkPermission.js";
import { getIncident, getIncidents } from "../../services/admin/Incident/IncidentService.js";


const router= Router();

router.get("/incident",isLogin,checkPermission("incidentHandling","read"),getIncidents)



export default router