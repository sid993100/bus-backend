import { Router } from "express";
import { addDriver, getAllDrivers, updateDriver } from "../../services/admin/driver/driverService.js";
import { addConductor, getConductor, updateConductor } from "../../services/admin/conductor/conductorService.js";
import { isLogin } from "../../middleWares/isLogin.js";
import { roleBaseAuth } from "../../middleWares/rolebaseAuth.js";
import { addUser, getUsers, updateUser } from "../../services/admin/user/userServices.js";
import { checkPermission } from "../../middleWares/checkPermission.js";
const router = Router();

router.get("/driver",isLogin,roleBaseAuth("ADMIN"),checkPermission("drive","read"),getAllDrivers)
router.get("/conductor",isLogin,roleBaseAuth( "ADMIN"),checkPermission("drive","read"),getConductor)
router.get("/users", isLogin, getUsers);




router.post('/user',isLogin,roleBaseAuth("ADMIN"),checkPermission("user","create"), addUser)
router.post('/driver',isLogin,roleBaseAuth( "ADMIN"),checkPermission("drive","create"), addDriver)
router.post('/conductor',isLogin,roleBaseAuth( "ADMIN"),checkPermission("conductor","create"), addConductor)


router.put('/driver/:id', isLogin,roleBaseAuth( "ADMIN"),checkPermission("drive","update"),updateDriver)
router.put('/conductor/:id', isLogin,roleBaseAuth( "ADMIN"),checkPermission("conductor","update"),updateConductor)
router.put('/user/:id', isLogin,roleBaseAuth("ADMIN"),checkPermission("user","update"),updateUser)
export default router;