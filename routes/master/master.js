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
import { createDeviceEvent, getDeviceEventById, getDeviceEvents, updateDeviceEvent } from "../../services/otc/deviceEventServices.js";



const router=Router()

router.get("/accounts", isLogin, getAccount);
router.get("/tolltypes", isLogin,  getTollType);
router.get("/toll",isLogin,  getToll);
router.get("/servicecategory", isLogin,  getServiceCategory);
router.get("/state", isLogin,  getState);
router.get("/busstop", isLogin, getBusStop);
router.get("/country", isLogin, getCountry);
router.get("/servicetype", isLogin,  getServiceType);
router.get("/stoparea",isLogin, getArea)
router.get("/stopgrade",isLogin, getStopGrade)
router.get("/vehicle/region/:regionId",isLogin,getVehiclesByRegion)
router.get("/vehicle/depot/:depotId",isLogin,getVehiclesByDepot)
router.get("/vehicle",isLogin,getVehicle)
router.get("/vehiclemanufacturer",isLogin,getVehicleManufacturer)
router.get("/vehicletype",isLogin,getVehicleTypes)
router.get("/zone",isLogin,getRegions)
router.get("/zone/:id",isLogin,getRegion)
router.get("/depot",isLogin,getDepotCustomers)
router.get("/depot/:id",isLogin,getDepotById)
router.get("/depot/region/:regionId",isLogin,getDepotCustomersByRegion) 
router.get("/vehiclemodel",isLogin,getVehicleModels)
router.get("/gender",isLogin,getGender)
router.get("/photoidcard",isLogin,getPhotoIdCard)
router.get("/pismanufacturer",isLogin,getPisManufacturer)
router.get("/pistype",isLogin,getPisTypes)
router.get("/pismodel",isLogin,getAllPisModels)
router.get("/employtype",isLogin,getAllEmployTypes)
router.get("/vltdevice", isLogin,getVltDevices);
router.get("/vltdevice/region/:regionId", isLogin,getVltDevicesByRegion);
router.get("/vltdevice/depot/:depotId", isLogin,getVltDevicesByDepot);
router.get("/subscription",isLogin, getSubscription)
router.get("/subscription/:regionId",isLogin, getSubscriptionsByRegion)
router.get("/subscription/:depotId",isLogin, getSubscriptionsByDepot)
router.get("/deviceevents",isLogin, getDeviceEvents);
router.get("/deviceevents/:id",isLogin, getDeviceEventById);








router.post("/deviceevents",isLogin, createDeviceEvent);
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
router.put("/deviceevents/:id",isLogin, updateDeviceEvent);

export default router