import { Router } from "express";
import { isLogin } from "../middleWares/isLogin.js";
import { addArea, getArea } from "../services/admin/area/areaServices.js";
import { getAllUsers } from "../services/admin/user/userServices.js";
import { addAccount, getAccount, updateAccount } from "../services/admin/accounts/accountServices.js";
import { addTollType, getTollType, updateTollType } from "../services/admin/tollyType/tollTypeServices.js";
import { addServiceCategory, getServiceCategory, updateServiceCategory } from "../services/admin/serviceCategory/serviceCategoryServices.js";
import { addVltDevices, getVltDevices, updateVltDevices } from "../services/admin/vltDevices/vltDevicesServices.js";
import { addState, getState } from "../services/admin/state/stateServices.js";
import { addCountry, getCountry, updateCountry } from "../services/admin/country/countryServices.js";
import { addBusStop, getBusStop, updateBusStop } from "../services/admin/busStop/busStopServices.js";
import { addPisRegistration, getpisReg, updatePisRegistration } from "../services/admin/pisReg/pisRegService.js";
import { addDuty, getDuty } from "../services/admin/duty/dutyServices.js";
import { addServiceType, getServiceType, updateServiceType } from "../services/admin/serviceType/serviceTypeServices.js";
import { addStopGrade, getStopGrade } from "../services/admin/stopGrade/stopGradeServices.js";
import { addSeatLayout, getSeatLayout, updateSeatLayout } from "../services/admin/seatLayout/seatLayoutServices.js";
import { addVehicleManufacturer, getVehicleManufacturer, updateVehicleManufacturer } from "../services/admin/vehicleManufacturer/vehicleManufacturerServices.js";
import { addSim, getSim, updateSim } from "../services/admin/sim/simServices.js";
import { addPlan, getPlan, updatePlan } from "../services/admin/plan/planServices.js";
import { addVltdManufacturer, getVltdManufacturer, updateVltdManufacturer } from "../services/admin/vltManufacturer/vltManufacturerServices.js";
import { addVltModel, getVltModel, updateVltModel } from "../services/admin/vltModel/vltModelServices.js";
import { addOwnerType, getOwnerType, updateOwnerType } from "../services/admin/owner/ownerServices.js";
import { addVehicle, getVehicle, updateVehicle } from "../services/admin/vehicle/vehicleServices.js";
import { roleBaseAuth } from "../middleWares/rolebaseAuth.js";
import { addDepartment, getDepartment } from "../services/admin/department/departmentServices.js";
import { addRoute, getRoute } from "../services/admin/route/routeService.js";
import { addTrip, getTrip, updateTrip } from "../services/admin/trip/tripServices.js";
import { addSubscription, getSubscription } from "../services/admin/subscription/subscriptionServices.js";
import { addDriver, getAllDrivers, updateDriver } from "../services/admin/driver/driverService.js";
import { addConductor, getConductor, updateConductor } from "../services/admin/conductor/conductorService.js";
import { checkPermission } from "../middleWares/checkPermission.js";


const router = Router();

router.get("/users", isLogin, getAllUsers);
router.get("/accounts", isLogin, getAccount);
router.get("/tolltypes", isLogin, getTollType);
router.get("/servicecategory", isLogin, getServiceCategory);
router.get("/state", isLogin, getState);
router.get("/busstop", isLogin, getBusStop);
router.get("/country", isLogin, getCountry);
router.get("/pisreg", isLogin, getpisReg);
router.get("/duty", isLogin, getDuty);
router.get("/servicetype", isLogin, getServiceType);
router.get("/vltdevice", isLogin, getVltDevices);
router.get("/stoparea",isLogin,getArea)
router.get("/stopgrade",isLogin,getStopGrade)
router.get("/seatlayout",isLogin,getSeatLayout)
router.get("/vehiclemanufacturer",isLogin,getVehicleManufacturer)
router.get("/sim",isLogin,getSim)
router.get("/plan",isLogin,getPlan)
router.get("/vltdmanufacturer",isLogin,getVltdManufacturer)
router.get("/vltmodel",isLogin,getVltModel)
router.get("/ownertype",isLogin,getOwnerType)
router.get("/vehicle",isLogin,getVehicle)
router.get("/department",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),getDepartment)
router.get("/route",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),getRoute)
router.get("/subscription",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),getSubscription)
router.get("/trip",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),getTrip)
router.get("/driver",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),getAllDrivers)
router.get("/conductor",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),getConductor)
// router.get("/role",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),getRoles)




router.post("/addaccount", isLogin, addAccount);
router.post("/addtolltype", isLogin, addTollType);
router.post("/addservicecategory", isLogin, addServiceCategory);
router.post("/addstate",isLogin,addState);
router.post("/addservicetype", isLogin, addServiceType);
router.post("/addcountry", isLogin,addCountry);
router.post("/addstopgrade",isLogin,addStopGrade);
router.post("/addstoparea",isLogin,addArea);
router.post("/addduty",isLogin,addDuty);
router.post("/addseatlayout",isLogin,addSeatLayout);
router.post("/addvehiclemanufacturer",isLogin,addVehicleManufacturer);
router.post("/pisreg",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),addPisRegistration);
router.post("/addvltdevice",isLogin,addVltDevices);
router.post("/addsim",isLogin,addSim);
router.post("/addplan",isLogin,addPlan)
router.post("/addvltdmanufacturer",isLogin,addVltdManufacturer)
router.post("/addvltmodel",isLogin,addVltModel)
router.post("/ownerType",isLogin,addOwnerType)
router.post("/department",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),addDepartment)
router.post("/route",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),addRoute)
router.post("/subscription",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),addSubscription)
router.post("/trip",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),addTrip)
router.post("/vehicle",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),addVehicle)
router.post('/driver',isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), addDriver)
router.post('/conductor',isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), addConductor)
router.post('/busstop',isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), addBusStop)
// router.post('/role',isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), addRole)





router.put("/account/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),updateAccount)
router.put("/tolltypes/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),checkPermission("tollType", "update"), updateTollType);
router.put("/country/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updateCountry);
router.put("/ownertype/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updateOwnerType);
router.put("/plan/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updatePlan);
router.put("/seatlayout/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updateSeatLayout);
router.put("/servicecategory/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updateServiceCategory);
router.put("/servicetype/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updateServiceType);
router.put("/sim/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updateSim);
router.put("/trip/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updateTrip);
router.put("/vehicle/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updateVehicle);
router.put("/vehiclemanufacturer/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updateVehicleManufacturer);
router.put("/vltdevice/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updateVltDevices);
router.put("/vltmanufacturer/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updateVltdManufacturer);
router.put("/vltmodel/:id",isLogin,roleBaseAuth("SUPERADMIN","ADMIN"), updateVltModel); 
router.put('/driver/:id', isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),updateDriver)
router.put('/conductor/:id', isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),updateConductor)
router.put('/pisreg/:id', isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),updatePisRegistration)
router.put('/busstop/:id', isLogin,roleBaseAuth("SUPERADMIN","ADMIN"),updateBusStop)






export default router;
