import { Router } from "express";
import { addDriver, getAllDrivers, getDriversByDepot, getDriversByRegion, updateDriver } from "../../services/admin/driver/driverService.js";
import { addConductor, getConductor, getConductorsByDepot, getConductorsByRegion, updateConductor } from "../../services/admin/conductor/conductorService.js";
import { isLogin } from "../../middleWares/isLogin.js";
import { addUser, getUsers, updateUser, setActive } from "../../services/admin/user/userServices.js";
import { checkPermission } from "../../middleWares/checkPermission.js";
const router = Router();

router.get("/driver",isLogin, checkPermission("drive","read"),getAllDrivers)
router.get("/driver/:regionId",isLogin, checkPermission("drive","read"),getDriversByRegion)
router.get("/driver/:depotId",isLogin, checkPermission("drive","read"),getDriversByDepot)
router.get("/conductor",isLogin, checkPermission("drive","read"),getConductor)
router.get("/conductor/:regionId",isLogin, checkPermission("drive","read"),getConductorsByRegion)
router.get("/conductor/:depotId",isLogin, checkPermission("drive","read"),getConductorsByDepot)
router.get("/users", isLogin, checkPermission("user","read"), getUsers);




router.post('/user',isLogin, checkPermission("user","create"), addUser)
router.post('/driver',isLogin, checkPermission("drive","create"), addDriver)
router.post('/conductor',isLogin, checkPermission("conductor","create"), addConductor)


router.put('/driver/:id', isLogin, checkPermission("drive","update"),updateDriver)
router.put('/conductor/:id', isLogin, checkPermission("conductor","update"),updateConductor)
router.put('/user/:id', isLogin,checkPermission("user","update"),updateUser)
router.put('/user/setStatus/:id', isLogin,checkPermission("user","update"),setActive)

export default router;