import { Router } from "express";
import { isLogin } from "../../middleWares/isLogin.js";
import { checkPermission } from "../../middleWares/checkPermission.js";
import { addSeatLayout, getSeatLayout, updateSeatLayout } from "../../services/admin/seatLayout/seatLayoutServices.js";
import { addTrip, getTodayTrips, getTrips, getTripsByDepot, getTripsByRegion, updateTrip, updateTripStatus } from "../../services/admin/trip/tripServices.js";
import { addRoute, updateRoute ,getRoutes, getRoutesByDepot, getRoutesByRegion} from "../../services/admin/route/routeService.js";
import { addDuty, getDuty, getDutyByDepot, getDutyByRegion, updateDuty } from "../../services/admin/duty/dutyServices.js";
import { createScheduleConfiguration, getAllScheduleConfigurations, getByRegion, getSchedulesByDate, getSchedulesByDateAndDepot, getSchedulesByDateAndRegion, getSchedulesByDepot, updateScheduleConfiguration } from "../../services/admin/sheduleSercives.js";
import { addSim, getAllSims, updateSim } from "../../services/master/sim/simServices.js";


const router = Router();

router.get("/route",isLogin ,getRoutes)
router.get("/route/region/:regionId",isLogin ,getRoutesByRegion)
router.get("/route/depot/:depotId",isLogin ,getRoutesByDepot)
router.get("/seatlayout",isLogin ,getSeatLayout)
router.get("/trip",isLogin ,getTrips)
router.get("/todaytrip",isLogin,getTodayTrips)
router.get("/trip/region/:regionId",isLogin ,getTripsByRegion)
router.get("/trip/depot/:depotId",isLogin ,getTripsByDepot)
router.get("/duty", isLogin ,getDuty);
router.get("/duty/region/:regionId", isLogin ,getDutyByRegion);
router.get("/duty/depot/:depotId", isLogin ,getDutyByDepot);
router.get("/scheduleconfig", isLogin ,getAllScheduleConfigurations);
router.get("/scheduleconfig/depot/:depotId", isLogin ,getSchedulesByDepot);
router.get("/scheduleconfig/region/:regionId", isLogin ,getByRegion);
// router.get("/scheduleconfig/region/:regionId", isLogin ,checkPermission("scheduleConfig","read"), get);
router.get("/todaySchedule", isLogin ,getSchedulesByDate);
router.get("/todaySchedule/depot/:depotId", isLogin ,getSchedulesByDateAndDepot);
router.get("/todaySchedule/region/:regionId", isLogin ,getSchedulesByDateAndRegion);
router.get("/vltsim", isLogin ,getAllSims);



router.post("/seatlayout",isLogin ,checkPermission("seatLayout","create"),addSeatLayout);
router.post("/route",isLogin ,checkPermission("route","create"),addRoute);
router.post("/trip",isLogin ,checkPermission("trip","create"),addTrip)
router.post("/duty",isLogin ,checkPermission("duty","create"),addDuty);
router.post("/scheduleconfig",isLogin ,checkPermission("scheduleConfig","create"),createScheduleConfiguration);
router.post("/vltsim",isLogin ,checkPermission("vltSim","create"),addSim);


router.put("/seatlayout/:id",isLogin ,checkPermission("seatLayout","update"), updateSeatLayout);
router.put("/route/:id",isLogin ,checkPermission("route","update"), updateRoute);
router.put("/trip/:id",isLogin ,checkPermission("trip","update"), updateTrip);
router.put("/tripstatus/:id",isLogin ,checkPermission("trip","approval"), updateTripStatus);
router.put("/duty/:id",isLogin ,checkPermission("duty","update"), updateDuty);
router.put("/scheduleConfig/:id",isLogin ,checkPermission("scheduleConfig","update"), updateScheduleConfiguration);
router.put("/vltsim/:id",isLogin ,checkPermission("vltSim","update"), updateSim);


export default router;