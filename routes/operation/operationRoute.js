import { Router } from "express";
import { isLogin } from "../../middleWares/isLogin.js";
import { roleBaseAuth } from "../../middleWares/rolebaseAuth.js";
import { checkPermission } from "../../middleWares/checkPermission.js";
import { addSeatLayout, getSeatLayout, updateSeatLayout } from "../../services/admin/seatLayout/seatLayoutServices.js";
import { addTrip, getTrips, updateTrip } from "../../services/admin/trip/tripServices.js";
import { addRoute, updateRoute ,getRoutes} from "../../services/admin/route/routeService.js";
import { addDuty, getDuty, updateDuty } from "../../services/admin/duty/dutyServices.js";
import { createScheduleConfiguration, getAllScheduleConfigurations, updateScheduleConfiguration } from "../../services/admin/sheduleSercives.js";
import { addSim, getAllSims, updateSim } from "../../services/master/sim/simServices.js";


const router = Router();

router.get("/route",isLogin ,checkPermission("route","read"),getRoutes)
router.get("/seatlayout",isLogin ,checkPermission("seatLayout","read"),getSeatLayout)
router.get("/trip",isLogin ,checkPermission("trip","read"),getTrips)
router.get("/duty", isLogin ,checkPermission("duty","read"), getDuty);
router.get("/scheduleconfig", isLogin ,checkPermission("scheduleConfig","read"), getAllScheduleConfigurations);
router.get("/vltsim", isLogin ,checkPermission("vltSim","read"), getAllSims);


router.post("/seatlayout",isLogin ,checkPermission("seatLayout","create"),addSeatLayout);
router.post("/route",isLogin ,checkPermission("route","create"),addRoute);
router.post("/trip",isLogin ,checkPermission("trip","create"),addTrip)
router.post("/duty",isLogin ,checkPermission("duty","create"),addDuty);
router.post("/scheduleconfig",isLogin ,checkPermission("scheduleConfig","create"),createScheduleConfiguration);
router.post("/vltsim",isLogin ,checkPermission("vltSim","create"),addSim);


router.put("/seatlayout/:id",isLogin ,checkPermission("seatLayout","update"), updateSeatLayout);
router.put("/route/:id",isLogin ,checkPermission("route","update"), updateRoute);
router.put("/trip/:id",isLogin ,checkPermission("trip","update"), updateTrip);
router.put("/duty/:id",isLogin ,checkPermission("duty","update"), updateDuty);
router.put("/scheduleConfig/:id",isLogin ,checkPermission("scheduleConfig","update"), updateScheduleConfiguration);
router.put("/vltsim/:id",isLogin ,checkPermission("vltSim","update"), updateSim);


export default router;