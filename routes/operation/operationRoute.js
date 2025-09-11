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

router.get("/route",isLogin,roleBaseAuth( "ADMIN"),checkPermission("route","read"),getRoutes)
router.get("/seatlayout",isLogin,roleBaseAuth( "ADMIN"),checkPermission("seatLayout","read"),getSeatLayout)
router.get("/trip",isLogin,roleBaseAuth( "ADMIN"),checkPermission("trip","read"),getTrips)
router.get("/duty", isLogin,roleBaseAuth( "ADMIN"),checkPermission("duty","read"), getDuty);
router.get("/scheduleconfig", isLogin,roleBaseAuth( "ADMIN"),checkPermission("scheduleConfig","read"), getAllScheduleConfigurations);
router.get("/vltsim", isLogin,roleBaseAuth( "ADMIN"),checkPermission("vltSim","read"), getAllSims);


router.post("/seatlayout",isLogin,roleBaseAuth( "ADMIN"),checkPermission("seatLayout","create"),addSeatLayout);
router.post("/route",isLogin,roleBaseAuth( "ADMIN"),checkPermission("route","create"),addRoute);
router.post("/trip",isLogin,roleBaseAuth( "ADMIN"),checkPermission("trip","create"),addTrip)
router.post("/duty",isLogin,roleBaseAuth( "ADMIN"),checkPermission("duty","create"),addDuty);
router.post("/scheduleconfig",isLogin,roleBaseAuth( "ADMIN"),checkPermission("scheduleConfig","create"),createScheduleConfiguration);
router.post("/vltsim",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vltSim","create"),addSim);


router.put("/seatlayout/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("seatLayout","update"), updateSeatLayout);
router.put("/route/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("route","update"), updateRoute);
router.put("/trip/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("trip","update"), updateTrip);
router.put("/duty/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("duty","update"), updateDuty);
router.put("/scheduleConfig/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("scheduleConfig","update"), updateScheduleConfiguration);
router.put("/vltsim/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vltSim","update"), updateSim);


export default router;