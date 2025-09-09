import { Router } from "express";
import { isLogin } from "../middleWares/isLogin.js";
import { addVltDevices, getVltDevices, updateVltDevices } from "../services/admin/vltDevices/vltDevicesServices.js";
import { addPisRegistration, getpisReg, updatePisRegistration } from "../services/admin/pisReg/pisRegService.js";
import { addDuty, getDuty } from "../services/admin/duty/dutyServices.js";
import { addSeatLayout, getSeatLayout, updateSeatLayout } from "../services/admin/seatLayout/seatLayoutServices.js";
import { addSim, getSim, updateSim } from "../services/admin/sim/simServices.js";
import { addPlan, getPlan, updatePlan } from "../services/admin/plan/planServices.js";
import { addVltdManufacturer, getVltdManufacturer, updateVltdManufacturer } from "../services/admin/vltManufacturer/vltManufacturerServices.js";
import { addVltModel, getVltModel, updateVltModel } from "../services/admin/vltModel/vltModelServices.js";
import { addOwnerType, getOwnerType, updateOwnerType } from "../services/admin/owner/ownerServices.js";
import { roleBaseAuth } from "../middleWares/rolebaseAuth.js";
import { addDepartment, getDepartment } from "../services/admin/department/departmentServices.js";
import { addSubscription, getSubscription } from "../services/admin/subscription/subscriptionServices.js";
import { checkPermission } from "../middleWares/checkPermission.js";
import { getIncident } from "../services/admin/Incident/IncidentService.js";
import { addHierarchy, getHierarchy, updateHierarchy } from "../services/admin/hierarchy/hierarchyServices.js";


const router = Router();


router.get("/pisreg", isLogin, getpisReg);

router.get("/vltdevice", isLogin, getVltDevices);

router.get("/sim",isLogin,getSim)
router.get("/plan",isLogin,checkPermission("plain","read"),getPlan)
router.get("/vltdmanufacturer",isLogin,getVltdManufacturer)
router.get("/vltmodel",isLogin,getVltModel)
router.get("/ownertype",isLogin,checkPermission("ownerType","read"),getOwnerType)
// router.get("/department",isLogin,roleBaseAuth( "ADMIN"),getDepartment)
router.get("/subscription",isLogin,roleBaseAuth( "ADMIN"),getSubscription)
router.get("/incident",isLogin,roleBaseAuth( "ADMIN"),checkPermission("incident","read"),getIncident)
router.get("/hierarchy",isLogin,getHierarchy)




router.post("/addduty",isLogin,addDuty);
router.post("/pisreg",isLogin,roleBaseAuth( "ADMIN"),addPisRegistration);
router.post("/addvltdevice",isLogin,addVltDevices);
router.post("/addsim",isLogin,addSim);
router.post("/addplan",isLogin,checkPermission("plain","create"),addPlan)
router.post("/addvltdmanufacturer",isLogin,addVltdManufacturer)
router.post("/addvltmodel",isLogin,addVltModel)
router.post("/ownertype",isLogin,checkPermission("ownerType","create"),addOwnerType)
router.post("/department",isLogin,roleBaseAuth( "ADMIN"),addDepartment)
router.post("/subscription",isLogin,roleBaseAuth( "ADMIN"),addSubscription)
// router.post("/hierarchy",isLogin,addHierarchy)






router.put("/sim/:id",isLogin,roleBaseAuth( "ADMIN"), updateSim);
router.put("/vltdevice/:id",isLogin,roleBaseAuth( "ADMIN"), updateVltDevices);
router.put("/vltmanufacturer/:id",isLogin,roleBaseAuth( "ADMIN"), updateVltdManufacturer);
router.put("/vltmodel/:id",isLogin,roleBaseAuth( "ADMIN"), updateVltModel); 
router.put('/pisreg/:id', isLogin,roleBaseAuth( "ADMIN"),updatePisRegistration)
router.put("/seatlayout/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("seatLayout","update"), updateSeatLayout);
router.put("/hierarchy/:id",isLogin,updateHierarchy)
router.put("/ownertype/:id",isLogin,checkPermission("ownerType","update"),updateOwnerType)
router.put("/addplan/:id",isLogin,checkPermission("plain","update"),updatePlan)






export default router;
