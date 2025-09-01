import { Router } from "express";
import { addAccount, getAccount, updateAccount } from "../../services/admin/accounts/accountServices.js";
import { addTollType, getTollType, updateTollType } from "../../services/admin/tollyType/tollTypeServices.js";
import { addServiceCategory, getServiceCategory, updateServiceCategory } from "../../services/admin/serviceCategory/serviceCategoryServices.js";
import { addState, getState, updateState } from "../../services/admin/state/stateServices.js";
import { addBusStop, getBusStop, updateBusStop } from "../../services/admin/busStop/busStopServices.js";
import { addCountry, getCountry, updateCountry } from "../../services/admin/country/countryServices.js";
import { addServiceType, getServiceType, updateServiceType } from "../../services/admin/serviceType/serviceTypeServices.js";
import { addStopGrade, getStopGrade, updateStopGrade } from "../../services/admin/stopGrade/stopGradeServices.js";
import { addArea, getArea, updateArea, updateAreaByName } from "../../services/admin/area/areaServices.js";
import { addVehicle, getVehicle, updateVehicle } from "../../services/admin/vehicle/vehicleServices.js";
import { addVehicleManufacturer, getVehicleManufacturer, updateVehicleManufacturer } from "../../services/admin/vehicleManufacturer/vehicleManufacturerServices.js";
import { isLogin } from "../../middleWares/isLogin.js";
import { addVehicleType, getVehicleTypes, updateVehicleType } from "../../services/master/vehicleTypeService.js";
import { roleBaseAuth } from "../../middleWares/rolebaseAuth.js";
import { updatePlan } from "../../services/admin/plan/planServices.js";
import { updateOwnerType } from "../../services/admin/owner/ownerServices.js";
import { addRegion, getRegions, updateRegion } from "../../services/master/zoneRegionService.js";
import { addDepotCustomer,  getDepotCustomers, updateDepotCustomer } from "../../services/master/depotService.js";
import { checkPermission } from "../../middleWares/checkPermission.js";
import { addToll, getToll, updateToll } from "../../services/master/toll/tollService.js";
import { updateDepartment, updateDepartmentByName } from "../../services/admin/department/departmentServices.js";
import { addVehicleModel, getVehicleModels, updateVehicleModel } from "../../services/master/vehicleModelService.js";
import { addGender, getGender, updateGender } from "../../services/otc/genderServices.js";
import { addPhotoIdCard, getPhotoIdCard, updatePhotoIdCard } from "../../services/otc/photoIdCardServices.js";



const router=Router()

router.get("/accounts", isLogin,roleBaseAuth( "ADMIN"),checkPermission("account","read"), getAccount);
router.get("/tolltypes", isLogin,roleBaseAuth("ADMIN"), checkPermission("tollType", "read"), getTollType);
router.get("/toll",isLogin,roleBaseAuth("ADMIN"), checkPermission("toll", "create"),getToll);
router.get("/servicecategory", isLogin,roleBaseAuth("ADMIN"), checkPermission("servicecategory", "read"), getServiceCategory);
router.get("/state", isLogin,roleBaseAuth("ADMIN"), checkPermission("state", "read"), getState);
router.get("/busstop", isLogin,roleBaseAuth( "ADMIN"),checkPermission("busStop","read"), getBusStop);
router.get("/country", isLogin,roleBaseAuth( "ADMIN"),checkPermission("country","read"), getCountry);
router.get("/servicetype", isLogin,roleBaseAuth("ADMIN"), checkPermission("servicetype", "read"), getServiceType);
router.get("/stoparea",isLogin,roleBaseAuth( "ADMIN"),checkPermission("stopArea","read"),getArea)
router.get("/stopgrade",isLogin,roleBaseAuth( "ADMIN"),checkPermission("stopGrade","read"),getStopGrade)
router.get("/vehicle",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicle","read"),getVehicle)
router.get("/vehiclemanufacturer",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleM","read"),getVehicleManufacturer)
router.get("/vehicletype",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleType","read"),getVehicleTypes)
router.get("/zone",isLogin,roleBaseAuth( "ADMIN"),checkPermission("zone","read"),getRegions)
router.get("/depot",isLogin,roleBaseAuth( "ADMIN"),checkPermission("depot","read"),getDepotCustomers)
router.get("/vehiclemodel",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleModel","read"),getVehicleModels)
router.get("/gender",isLogin,roleBaseAuth( "ADMIN"),checkPermission("gender","read"),getGender)
router.get("/photoidcard",isLogin,roleBaseAuth( "ADMIN"),checkPermission("photoIdCard","read"),getPhotoIdCard)




router.post("/account", isLogin,roleBaseAuth("ADMIN"), checkPermission("account", "create"), addAccount);
router.post("/tolltype", isLogin,roleBaseAuth("ADMIN"), checkPermission("tollType", "create"), addTollType);
router.post("/toll", isLogin, roleBaseAuth("ADMIN"), checkPermission("toll", "create"), addToll);
router.post("/servicecategory", isLogin,roleBaseAuth("ADMIN"), checkPermission("servicecategory", "create"), addServiceCategory);
router.post("/state",isLogin,roleBaseAuth("ADMIN"), checkPermission("state", "create"),addState);
router.post("/servicetype", isLogin,roleBaseAuth("ADMIN"), checkPermission("servicetype", "create"), addServiceType);
router.post("/country", isLogin,roleBaseAuth( "ADMIN"),checkPermission("country","create"),addCountry);
router.post("/stopgrade",isLogin,roleBaseAuth( "ADMIN"),checkPermission("stopGrade","create"),addStopGrade);
router.post("/stoparea",isLogin,roleBaseAuth( "ADMIN"),checkPermission("stopArea","create"),addArea);
router.post("/vehicle",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicle","create"),addVehicle)
router.post('/busstop',isLogin,roleBaseAuth( "ADMIN"),checkPermission("busStop","create"), addBusStop)
router.post("/vehiclemanufacturer",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleM","create"),addVehicleManufacturer);
router.post("/vehicletype",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleType","create"),addVehicleType);
router.post("/zone",isLogin,roleBaseAuth( "ADMIN"),checkPermission("zone","create"),addRegion);
router.post("/depot",isLogin,roleBaseAuth( "ADMIN"),checkPermission("depot","create"),addDepotCustomer);
router.post("/vehiclemodel",isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleModel","create"),addVehicleModel);
router.post("/gender",isLogin,roleBaseAuth( "ADMIN"),checkPermission("gender","create"),addGender);
router.post("/photoidcard",isLogin,roleBaseAuth( "ADMIN"),checkPermission("photoIdCard","create"),addPhotoIdCard);




router.put("/account/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("account","update"),updateAccount)
router.put("/stopgrade/:id",isLogin,roleBaseAuth( "ADMIN"),checkPermission("stop","update"),updateStopGrade)
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
router.put('/department/:id',isLogin,roleBaseAuth( "ADMIN"),checkPermission("department","update"), updateDepartment);
router.put('/department/name/:departmentName',isLogin,roleBaseAuth( "ADMIN"),checkPermission("department","update"), updateDepartmentByName);
router.put('/stoparea/:id',isLogin,roleBaseAuth( "ADMIN"),checkPermission("area","update"), updateArea);
router.put('/area/name/:name',isLogin,roleBaseAuth( "ADMIN"),checkPermission("area","update"), updateAreaByName);
router.put('/vehiclemodel/:name',isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleModel","update"), updateVehicleModel);
router.put('/vehicletype/:id',isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleType","update"), updateVehicleType);
router.put('/state/:id',isLogin,roleBaseAuth( "ADMIN"),checkPermission("state","update"), updateState);
router.put('/gender/:id',isLogin,roleBaseAuth( "ADMIN"),checkPermission("gender","update"),updateGender );
router.put('/photoidcard/:id',isLogin,roleBaseAuth( "ADMIN"),checkPermission("photoIdCard","update"),updatePhotoIdCard);

export default router