import { Router } from "express";
import { addDriver, getAllDrivers, getDriversByDepot, getDriversByRegion, updateDriver } from "../../services/admin/driver/driverService.js";
import { addConductor, getConductor, getConductorsByDepot, getConductorsByRegion, updateConductor } from "../../services/admin/conductor/conductorService.js";
import { isLogin } from "../../middleWares/isLogin.js";
import { addUser, getUsers, updateUser, setActive } from "../../services/admin/user/userServices.js";
import { checkPermission } from "../../middleWares/checkPermission.js";
const router = Router();

router.get("/driver",isLogin, checkPermission("driver","read"),getAllDrivers)
router.get("/driver/region/:regionId",isLogin, checkPermission("driver","read"),getDriversByRegion)
router.get("/driver/depot/:depotId",isLogin, checkPermission("driver","read"),getDriversByDepot)
router.get("/conductor",isLogin, checkPermission("conductor","read"),getConductor)
router.get("/conductor/region/:regionId",isLogin, checkPermission("conductor","read"),getConductorsByRegion)
router.get("/conductor/depot/:depotId",isLogin, checkPermission("conductor","read"),getConductorsByDepot)
router.get("/users", isLogin, checkPermission("user","read"), getUsers);




router.post('/user',isLogin, checkPermission("user","create"), addUser)
router.post('/driver',isLogin, checkPermission("driver","create"), addDriver)
router.post('/conductor',isLogin, checkPermission("conductor","create"), addConductor)


router.put('/driver/:id', isLogin, checkPermission("driver","update"),updateDriver)
router.put('/conductor/:id', isLogin, checkPermission("conductor","update"),updateConductor)
router.put('/user/:id', isLogin,checkPermission("user","update"),updateUser)
router.put('/user/setStatus/:id', isLogin,checkPermission("user","update"),setActive)

export default router;