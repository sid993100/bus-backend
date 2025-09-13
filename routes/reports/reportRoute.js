import {Router} from 'express';
import { isLogin } from '../../middleWares/isLogin.js';
import { rawData } from '../../services/reports/rawServices.js';
import { roleBaseAuth } from '../../middleWares/rolebaseAuth.js';
import { checkPermission } from '../../middleWares/checkPermission.js';
import { vehicleActivity } from '../../services/reports/vehicleActivityServices.js';
import { journeyHistory } from '../../services/reports/journeyHistoryService.js';

const router = Router();


router.get('/rawdata',isLogin,roleBaseAuth( "ADMIN"),checkPermission("rawData","read"),rawData)
router.get('/vehicleactivity',isLogin,roleBaseAuth( "ADMIN"),checkPermission("vehicleActivity","read"),vehicleActivity)
router.get('/journeyhistory/:vehicleNumber',isLogin,roleBaseAuth( "ADMIN"),checkPermission("journeyHistory","read"),journeyHistory)




export default router;
