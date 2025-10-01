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
import { addVehicle, getVehicle, getVehiclesByDepot, getVehiclesByRegion, updateVehicle } from "../../services/admin/vehicle/vehicleServices.js";
import { addVehicleManufacturer, getVehicleManufacturer, updateVehicleManufacturer } from "../../services/admin/vehicleManufacturer/vehicleManufacturerServices.js";
import { isLogin } from "../../middleWares/isLogin.js";
import { addVehicleType, getVehicleTypes, updateVehicleType } from "../../services/master/vehicleTypeService.js";
import { updatePlan } from "../../services/admin/plan/planServices.js";
import { updateOwnerType } from "../../services/admin/owner/ownerServices.js";
import { addRegion, getRegion, getRegions, updateRegion } from "../../services/master/zoneRegionService.js";
import { addDepotCustomer,  getDepotById,  getDepotCustomers, getDepotCustomersByRegion, updateDepotCustomer } from "../../services/master/depotService.js";
import { checkPermission } from "../../middleWares/checkPermission.js";
import { addToll, getToll, updateToll } from "../../services/master/toll/tollService.js";
import { updateDepartment, updateDepartmentByName } from "../../services/admin/department/departmentServices.js";
import { addVehicleModel, getVehicleModels, updateVehicleModel } from "../../services/master/vehicleModelService.js";
import { addGender, getGender, updateGender } from "../../services/otc/genderServices.js";
import { addPhotoIdCard, getPhotoIdCard, updatePhotoIdCard } from "../../services/otc/photoIdCardServices.js";
import { addPisManufacturer, getPisManufacturer, updatePisManufacturer } from "../../services/otc/pisManufacturerService.js";
import { addPisType, getPisTypes, updatepisType } from "../../services/otc/pisTypeService.js";
import { addPisModel, getAllPisModels, updatePisModel } from "../../services/otc/pisModelService.js";
import { createEmployType, getAllEmployTypes, updateEmployType } from "../../services/master/empolyType/empolyTypeService.js";
import { addVltDevices, getVltDevices, getVltDevicesByDepot, getVltDevicesByRegion, updateVltDevices } from "../../services/admin/vltDevices/vltDevicesServices.js";
import { addSubscription, getSubscription, getSubscriptionsByDepot, getSubscriptionsByRegion, updateSubscription } from "../../services/admin/subscription/subscriptionServices.js";



const router=Router()

router.get("/accounts", isLogin, checkPermission("account","read"), getAccount);
router.get("/tolltypes", isLogin,  checkPermission("tollType", "read"), getTollType);
router.get("/toll",isLogin,  checkPermission("toll", "read"),getToll);
router.get("/servicecategory", isLogin,  checkPermission("serviceCategory", "read"), getServiceCategory);
router.get("/state", isLogin,  checkPermission("state", "read"), getState);
router.get("/busstop", isLogin, checkPermission("busStop","read"), getBusStop);
router.get("/country", isLogin, checkPermission("country","read"), getCountry);
router.get("/servicetype", isLogin,  checkPermission("serviceType", "read"), getServiceType);
router.get("/stoparea",isLogin, checkPermission("stopArea","read"),getArea)
router.get("/stopgrade",isLogin, checkPermission("stopeGrade","read"),getStopGrade)
router.get("/vehicle/region/:regionId",isLogin,checkPermission("vehicle","read"),getVehiclesByRegion)
router.get("/vehicle/depot/:depotId",isLogin,checkPermission("vehicle","read"),getVehiclesByDepot)
router.get("/vehicle",isLogin, checkPermission("vehicle","read"),getVehicle)
router.get("/vehiclemanufacturer",isLogin, checkPermission("vehicleM","read"),getVehicleManufacturer)
router.get("/vehicletype",isLogin, checkPermission("vehicleType","read"),getVehicleTypes)
router.get("/zone",isLogin, checkPermission("zone","read"),getRegions)
router.get("/zone/:id",isLogin, checkPermission("zone","read"),getRegion)
router.get("/depot",isLogin, checkPermission("depot","read"),getDepotCustomers)
router.get("/depot/:id",isLogin, checkPermission("depot","read"),getDepotById)
router.get("/depot/region/:regionId",isLogin,checkPermission("depot","read"),getDepotCustomersByRegion)
router.get("/vehiclemodel",isLogin, checkPermission("vehicleModel","read"),getVehicleModels)
router.get("/gender",isLogin, checkPermission("gender","read"),getGender)
router.get("/photoidcard",isLogin, checkPermission("photoIdCard","read"),getPhotoIdCard)
router.get("/pismanufacturer",isLogin, checkPermission("pismanuf","read"),getPisManufacturer)
router.get("/pistype",isLogin, checkPermission("pisType","read"),getPisTypes)
router.get("/pismodel",isLogin, checkPermission("pisModel","read"),getAllPisModels)
router.get("/employtype",isLogin, checkPermission("employType","read"),getAllEmployTypes)
router.get("/vltdevice", isLogin,checkPermission("vltDevice","read"), getVltDevices);
router.get("/vltdevice/region/:regionId", isLogin,checkPermission("vltDevice","read"), getVltDevicesByRegion);
router.get("/vltdevice/depot/:depotId", isLogin,checkPermission("vltDevice","read"), getVltDevicesByDepot);
router.get("/subscription",isLogin,checkPermission("subscription","read"), getSubscription)
router.get("/subscription/:regionId",isLogin,checkPermission("subscription","read"), getSubscriptionsByRegion)
router.get("/subscription/:depotId",isLogin,checkPermission("subscription","read"), getSubscriptionsByDepot)




router.post("/addvltdevice",isLogin,checkPermission("vltDevice","create"),addVltDevices);
router.post("/subscription",isLogin,checkPermission("subscription","create"),addSubscription)
router.post("/account", isLogin,  checkPermission("account", "create"), addAccount);
router.post("/tolltype", isLogin,  checkPermission("tollType", "create"), addTollType);
router.post("/toll", isLogin,   checkPermission("toll", "create"), addToll);
router.post("/servicecategory", isLogin,  checkPermission("servicecategory", "create"), addServiceCategory);
router.post("/state",isLogin,  checkPermission("state", "create"),addState);
router.post("/servicetype", isLogin,  checkPermission("servicetype", "create"), addServiceType);
router.post("/country", isLogin, checkPermission("country","create"),addCountry);
router.post("/stopgrade",isLogin, checkPermission("stopGrade","create"),addStopGrade);
router.post("/stoparea",isLogin, checkPermission("stopArea","create"),addArea);
router.post("/vehicle",isLogin, checkPermission("vehicle","create"),addVehicle)
router.post('/busstop',isLogin, checkPermission("busStop","create"), addBusStop)
router.post("/vehiclemanufacturer",isLogin, checkPermission("vehicleM","create"),addVehicleManufacturer);
router.post("/vehicletype",isLogin, checkPermission("vehicleType","create"),addVehicleType);
router.post("/zone",isLogin, checkPermission("zone","create"),addRegion);
router.post("/depot",isLogin, checkPermission("depot","create"),addDepotCustomer);
router.post("/vehiclemodel",isLogin, checkPermission("vehicleModel","create"),addVehicleModel);
router.post("/gender",isLogin, checkPermission("gender","create"),addGender);
router.post("/photoidcard",isLogin, checkPermission("photoIdCard","create"),addPhotoIdCard);
router.post("/pismanufacturer",isLogin, checkPermission("pismanuf","create"),addPisManufacturer);
router.post("/pistype",isLogin, checkPermission("pisType","create"),addPisType);
router.post("/pismodel",isLogin, checkPermission("pisModel","create"),addPisModel);
router.post("/employtype",isLogin, checkPermission("empolyType","create"),createEmployType);




router.put("/vltdevice/:id",isLogin,checkPermission("vltDevice","update"), updateVltDevices);
router.put("/subscription/:id",isLogin,updateSubscription);
router.put("/account/:id",isLogin, checkPermission("account","update"),updateAccount)
router.put("/stopgrade/:id",isLogin, checkPermission("stop","update"),updateStopGrade)
router.put("/tolltypes/:id",isLogin, checkPermission("tollType", "update"), updateTollType);
router.put("/toll/:id", isLogin,   checkPermission("toll", "update"), updateToll);
router.put("/country/:id",isLogin, checkPermission("country","update"), updateCountry);
router.put("/ownertype/:id",isLogin, checkPermission("ownerType","update"), updateOwnerType);
router.put("/plan/:id",isLogin, checkPermission("plan","update"), updatePlan);
router.put("/servicecategory/:id",isLogin, checkPermission("sericeCategory","update"), updateServiceCategory);
router.put("/servicetype/:id",isLogin, checkPermission("serviceType","update"), updateServiceType);
router.put('/busstop/:id', isLogin, checkPermission("busStop","update"),updateBusStop)
router.put('/zone/:id', isLogin, checkPermission("zone","update"),updateRegion)
router.put('/depot/:id', isLogin, checkPermission("depot","update"),updateDepotCustomer)
router.put("/vehicle/:id",isLogin, checkPermission("vehicle","update"), updateVehicle);
router.put("/vehiclemanufacturer/:id",isLogin, checkPermission("vehicleM","update"), updateVehicleManufacturer);
router.put('/department/:id',isLogin, checkPermission("department","update"), updateDepartment);
router.put('/department/name/:departmentName',isLogin, checkPermission("department","update"), updateDepartmentByName);
router.put('/stoparea/:id',isLogin, checkPermission("area","update"), updateArea);
router.put('/area/name/:name',isLogin, checkPermission("area","update"), updateAreaByName);
router.put('/vehiclemodel/:id',isLogin, checkPermission("vehicleModel","update"), updateVehicleModel);
router.put('/vehicletype/:id',isLogin, checkPermission("vehicleType","update"), updateVehicleType);
router.put('/state/:id',isLogin, checkPermission("state","update"), updateState);
router.put('/gender/:id',isLogin, checkPermission("gender","update"),updateGender );
router.put('/photoidcard/:id',isLogin, checkPermission("photoIdCard","update"),updatePhotoIdCard);
router.put('/pismanufacturer/:id',isLogin, checkPermission("pismanuf","update"),updatePisManufacturer);
router.put('/pistype/:id',isLogin, checkPermission("pisType","update"),updatepisType);
router.put('/pismodel/:id',isLogin, checkPermission("pisModel","update"),updatePisModel);
router.put('/employtype/:id',isLogin, checkPermission("employType","update"),updateEmployType);

export default router