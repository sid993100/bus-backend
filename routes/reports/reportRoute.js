import {Router} from 'express';
import { isLogin } from '../../middleWares/isLogin.js';
import { rawData } from '../../services/reports/rawServices.js';
import { roleBaseAuth } from '../../middleWares/rolebaseAuth.js';
import { checkPermission } from '../../middleWares/checkPermission.js';
import { vehicleActivity } from '../../services/reports/vehicleActivityServices.js';
import { journeyHistory } from '../../services/reports/journeyHistoryService.js';
import { latestFirmware } from '../../services/reports/firmwareVersionServices.js';
import { idlingSummary } from '../../services/reports/idlingSummaryService.js';
import { getDistanceTravelled } from '../../services/reports/distanceTravelledServices.js';
import { getVehicleUtilization } from '../../services/reports/vehicleUtilizationServices.js';
import { stoppageDetailedReport } from '../../services/reports/stoppageDetailedReportService.js';

const router = Router();


router.get('/rawdata',isLogin,roleBaseAuth( "ADMIN"),checkPermission("rawData","read"),rawData)
router.get('/vehicleactivity',isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleActivity","read"),vehicleActivity)
router.get('/journeyhistory/:vehicleNumber',isLogin,roleBaseAuth( "ADMIN"),checkPermission("journeyHistory","read"),journeyHistory)
router.get('/firmware/:search',isLogin,roleBaseAuth( "ADMIN"),checkPermission("firmware","read"),latestFirmware)
router.get('/idlingsummary',isLogin,roleBaseAuth( "ADMIN"),checkPermission("idlingSummary","read"),idlingSummary)
router.get('/distancetravelled',isLogin,roleBaseAuth( "ADMIN"),checkPermission("distanceTravelled","read"),getDistanceTravelled)
router.get('/vehicleutilization',isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleUtilization","read"),getVehicleUtilization)
router.get('/stoppagedetailed',isLogin,roleBaseAuth( "ADMIN"),checkPermission("stoppageDetailedReport","read"),stoppageDetailedReport)





export default router;
