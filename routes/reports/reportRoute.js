import {Router} from 'express';
import { isLogin } from '../../middleWares/isLogin.js';
import { rawData } from '../../services/reports/rawServices.js';
import { roleBaseAuth } from '../../middleWares/rolebaseAuth.js';
import { checkPermission } from '../../middleWares/checkPermission.js';
import { vehicleActivity } from '../../services/reports/vehicleActivityServices.js';
import { journeyHistory } from '../../services/reports/journeyHistoryService.js';
import { latestFirmware, latestFirmwareByImei } from '../../services/reports/firmwareVersionServices.js';
import { idlingSummary } from '../../services/reports/idlingSummaryService.js';
import { getDistanceTravelled } from '../../services/reports/distanceTravelledServices.js';
import { getVehicleUtilization } from '../../services/reports/vehicleUtilizationServices.js';
import { stoppageDetailedReport } from '../../services/reports/stoppageDetailedReportService.js';
import { stopSummary } from '../../services/reports/stopSummaryServices.js';

const router = Router();


router.get('/rawdata',isLogin, checkPermission("rawData","read"),rawData)
router.get('/vehicleactivity',isLogin, checkPermission("vehicleActivity","read"),vehicleActivity)
router.get('/journeyhistory/:vehicleNumber',isLogin, checkPermission("journeyHistory","read"),journeyHistory)
router.get('/firmware',isLogin, checkPermission("firmware","read"),latestFirmware)
router.get('/firmware/:search',isLogin, checkPermission("firmware","read"),latestFirmwareByImei)
router.get('/idlingsummary',isLogin, checkPermission("idlingSummary","read"),idlingSummary)
router.get('/stopsummary',isLogin, checkPermission("stopSummary","read"),stopSummary)
router.get('/distancetravelled',isLogin, checkPermission("distanceTravelled","read"),getDistanceTravelled)
router.get('/vehicleutilization',isLogin, checkPermission("vehicleUtilization","read"),getVehicleUtilization)
router.get('/stoppagedetailed',isLogin, checkPermission("stoppageDetailedReport","read"),stoppageDetailedReport)
router.get('/idlingdetailed',isLogin, checkPermission("idlingDetailedReport","read"),stoppageDetailedReport)


export default router;
