import {Router} from 'express';
import { isLogin } from '../../middleWares/isLogin.js';
import { rawData } from '../../services/reports/rawServices.js';
import { roleBaseAuth } from '../../middleWares/rolebaseAuth.js';
import { checkPermission } from '../../middleWares/checkPermission.js';

const router = Router();


router.get('/rawdata',isLogin,roleBaseAuth( "ADMIN"),checkPermission("rawData","read"),rawData)




export default router;
