import { Router } from "express";
import { addDriver, getAllDrivers, getDriversByDepot, getDriversByRegion, updateDriver } from "../../services/admin/driver/driverService.js";
import { addConductor, getConductor, getConductorsByDepot, getConductorsByRegion, updateConductor } from "../../services/admin/conductor/conductorService.js";
import { isLogin } from "../../middlewares/isLogin.js";
import { addUser, getUsers, updateUser, setActive, getUsersByRegion, getUsersByDepot } from "../../services/admin/user/userServices.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
const router = Router();

router.get("/driver",isLogin,getAllDrivers)
router.get("/driver/region/:regionId",isLogin,getDriversByRegion)
router.get("/driver/depot/:depotId",isLogin,getDriversByDepot)
router.get("/conductor",isLogin,getConductor)
router.get("/conductor/region/:regionId",isLogin,getConductorsByRegion)
router.get("/conductor/depot/:depotId",isLogin,getConductorsByDepot)
router.get("/users", isLogin, getUsers);
router.get("/users/region/:regionId", isLogin, getUsersByRegion);
router.get("/users/depot/:depotId", isLogin, getUsersByDepot);




router.post('/user',isLogin, checkPermission("user","create"), addUser)
router.post('/driver',isLogin, checkPermission("driver","create"), addDriver)
router.post('/conductor',isLogin, checkPermission("conductor","create"), addConductor)


router.put('/driver/:id', isLogin, checkPermission("driver","update"),updateDriver)
router.put('/conductor/:id', isLogin, checkPermission("conductor","update"),updateConductor)
router.put('/user/:id', isLogin,checkPermission("user","update"),updateUser)
router.put('/user/setStatus/:id', isLogin,checkPermission("user","update"),setActive)

export default router;