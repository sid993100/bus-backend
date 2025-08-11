import { Router } from "express";
import { isLogin } from "../middleWares/isLogin.js";
import { addArea, getArea } from "../services/admin/area/areaServices.js";
import { getAllUsers } from "../services/admin/user/userServices.js";
import { addAccount, getAccount } from "../services/admin/accounts/accountServices.js";
import { addTollType, getTollType } from "../services/admin/tollyType/tollTypeServices.js";
import { addServiceCategory, getServiceCategory } from "../services/admin/serviceCategory/serviceCategoryServices.js";
import { addVltDevices, getVltDevices } from "../services/admin/vltDevices/vltDevicesServices.js";
import { addState, getState } from "../services/admin/state/stateServices.js";
import { addCountry, getCountry } from "../services/admin/country/countryServices.js";
import { getBusStop } from "../services/admin/busStop/busStopServices.js";
import { addPisReg, getpisReg } from "../services/admin/pisReg/pisRegService.js";
import { addDuty, getDuty } from "../services/admin/duty/dutyServices.js";
import { addServiceType, getServiceType } from "../services/admin/serviceType/serviceTypeServices.js";
import { addStopGrade, getStopGrade } from "../services/admin/stopGrade/stopGradeServices.js";
import { addSeatLayout, getSeatLayout } from "../services/admin/seatLayout/seatLayoutServices.js";
import { addVehicleManufacturer, getVehicleManufacturer } from "../services/admin/vehicleManufacturer/vehicleManufacturerServices.js";
import { addSim, getSim } from "../services/admin/sim/simServices.js";
import { addPlan, getPlan } from "../services/admin/plan/planServices.js";
import { addVltdManufacturer, getVltdManufacturer } from "../services/admin/vltManufacturer/vltManufacturerServices.js";
import { addVltModel, getVltModel } from "../services/admin/vltModel/vltModelServices.js";
import { addOwnerType, getOwnerType } from "../services/admin/owner/ownerServices.js";
import { getVehicle } from "../services/admin/vehicle/vehicleServices.js";
import { roleBaseAuth } from "../middleWares/rolebaseAuth.js";
import { addDepartment, getDepartment } from "../services/admin/department/departmentServices.js";

const router = Router();

router.get("/users", isLogin, getAllUsers);
router.get("/accounts", isLogin, getAccount);
router.get("/tolltype", isLogin, getTollType);
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
// router.post("/addpisreg",isLogin,addPisReg);
router.post("/addvltdevice",isLogin,addVltDevices);
router.post("/addsim",isLogin,addSim);
router.post("/addplan",isLogin,addPlan)
router.post("/addvltdmanufacturer",isLogin,addVltdManufacturer)
router.post("/addvltmodel",isLogin,addVltModel)
router.post("/ownerType",isLogin,addOwnerType)
router.post("/department",isLogin,roleBaseAuth("SUPERADMIN"),addDepartment)







export default router;
