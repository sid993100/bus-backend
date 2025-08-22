import { Router } from "express";
import { isLogin } from "../../middleWares/isLogin.js";
import { addLoginPacket, getLoginPacketById, getLoginPackets } from "../../services/barah101/loginPacketServer.js";
import { addTrackingPacket, getTrackingPacketById, getTrackingPackets } from "../../services/barah101/trackingPacketService.js";
import { addHealthPacket, getAllHealthPackets } from "../../services/barah101/healthMonitoringService.js";
import { addEmergencyPacket, getAllEmergencyPackets, getEmergencyPacketById } from "../../services/barah101/emergencyPacketService.js";
import { roleBaseAuth } from "../../middleWares/rolebaseAuth.js";

const router = Router();

router.get("/login",isLogin,getLoginPackets)
router.get("/login/:id",isLogin,getLoginPacketById)
router.get("/",isLogin,getTrackingPackets)
router.get("/tack/:id",isLogin,getTrackingPacketById)
router.get("/health",isLogin,getAllHealthPackets)
router.get("/health/:id",isLogin,getAllHealthPackets)
router.get("/emergency",isLogin,roleBaseAuth( "ADMIN"),getAllEmergencyPackets)
router.get("/emergency/:id",isLogin,getEmergencyPacketById)





router.post("/login",isLogin,addLoginPacket)
router.post("/",isLogin,addTrackingPacket)
router.post("/health",isLogin,addHealthPacket)
router.post("/emergency",isLogin,roleBaseAuth( "ADMIN"),addEmergencyPacket)


export default router;