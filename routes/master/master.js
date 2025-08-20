import { Router } from "express";
import { addAccount, getAccount, updateAccount } from "../../services/admin/accounts/accountServices.js";
import { addTollType, getTollType, updateTollType } from "../../services/admin/tollyType/tollTypeServices.js";
import { addServiceCategory, getServiceCategory, updateServiceCategory } from "../../services/admin/serviceCategory/serviceCategoryServices.js";
import { addState, getState } from "../../services/admin/state/stateServices.js";
import { addBusStop, getBusStop, updateBusStop } from "../../services/admin/busStop/busStopServices.js";
import { addCountry, getCountry, updateCountry } from "../../services/admin/country/countryServices.js";
import { addServiceType, getServiceType, updateServiceType } from "../../services/admin/serviceType/serviceTypeServices.js";
import { addStopGrade, getStopGrade } from "../../services/admin/stopGrade/stopGradeServices.js";
import { addArea, getArea } from "../../services/admin/area/areaServices.js";
import { addVehicle, getVehicle, updateVehicle } from "../../services/admin/vehicle/vehicleServices.js";
import { addVehicleManufacturer, getVehicleManufacturer, updateVehicleManufacturer } from "../../services/admin/vehicleManufacturer/vehicleManufacturerServices.js";
import { isLogin } from "../../middleWares/isLogin.js";
import { addVehicleType, getVehicleTypes } from "../../services/master/vehicleTypeService.js";
import { roleBaseAuth } from "../../middleWares/rolebaseAuth.js";
import { updatePlan } from "../../services/admin/plan/planServices.js";
import { updateOwnerType } from "../../services/admin/owner/ownerServices.js";
import { addRegion, getRegions, updateRegion } from "../../services/master/zoneRegionService.js";
import { addDepotCustomer, getDepotCustomer, getDepotCustomers, updateDepotCustomer } from "../../services/master/depotService.js";
import { checkPermission } from "../../middleWares/checkPermission.js";
import { addToll, getToll, updateToll } from "../../services/master/toll/tollService.js";



const router=Router()

router.get("/accounts", isLogin,roleBaseAuth("ADMIN"), getAccount);
router.get("/tolltypes", isLogin, getTollType);
router.get("/toll",isLogin,roleBaseAuth("ADMIN"),checkPermission("toll","read"),getToll);
router.get("/servicecategory", isLogin, getServiceCategory);
router.get("/state", isLogin, getState);
router.get("/busstop", isLogin, getBusStop);
router.get("/country", isLogin, getCountry);
router.get("/servicetype", isLogin, getServiceType);
router.get("/stoparea",isLogin,getArea)
router.get("/stopgrade",isLogin,getStopGrade)
router.get("/vehicle",isLogin,getVehicle)
router.get("/vehiclemanufacturer",isLogin,getVehicleManufacturer)
router.get("/vehicletypes",isLogin,getVehicleTypes)
router.get("/zone",isLogin,roleBaseAuth( "ADMIN"),checkPermission("zone","read"),getRegions)
router.get("/depot",isLogin,roleBaseAuth( "ADMIN"),checkPermission("depot","read"),getDepotCustomers)




router.post("/account", isLogin, addAccount);
router.post("/tolltype", isLogin, addTollType);
router.post("/toll", isLogin, roleBaseAuth("ADMIN"), checkPermission("toll", "create"), addToll);
router.post("/servicecategory", isLogin, addServiceCategory);
router.post("/state",isLogin,addState);
router.post("/servicetype", isLogin, addServiceType);
router.post("/country", isLogin,addCountry);
router.post("/stopgrade",isLogin,addStopGrade);
router.post("/stoparea",isLogin,addArea);
router.post("/vehicle",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicle","create"),addVehicle)
router.post('/busstop',isLogin,roleBaseAuth( "ADMIN"),checkPermission("busStop","create"), addBusStop)
router.post("/vehiclemanufacturer",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleM","create"),addVehicleManufacturer);
router.post("/vehicletype",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleType","create"),addVehicleType);
router.post("/zone",isLogin,roleBaseAuth( "ADMIN"),checkPermission("zone","create"),addRegion);
router.post("/depot",isLogin,roleBaseAuth( "ADMIN"),checkPermission("depot","create"),addDepotCustomer);




router.put("/account/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("account","update"),updateAccount)
router.put("/tolltypes/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("tollType", "update"), updateTollType);
router.put("/toll/:id", isLogin, roleBaseAuth("ADMIN"), checkPermission("toll", "update"), updateToll);
router.put("/country/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("country","update"), updateCountry);
router.put("/ownertype/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("ownerType","update"), updateOwnerType);
router.put("/plan/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("plan","update"), updatePlan);
router.put("/servicecategory/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("sericeCategory","update"), updateServiceCategory);
router.put("/servicetype/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("serviceType","update"), updateServiceType);
router.put('/busstop/:id', isLogin,roleBaseAuth( "ADMIN"),checkPermission("busStop","update"),updateBusStop)
router.put('/zone/:id', isLogin,roleBaseAuth( "ADMIN"),checkPermission("zone","update"),updateRegion)
router.put('/depot/:id', isLogin,roleBaseAuth( "ADMIN"),checkPermission("depot","update"),updateDepotCustomer)
router.put("/vehicle/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicle","update"), updateVehicle);
router.put("/vehiclemanufacturer/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleM","update"), updateVehicleManufacturer);

export default router