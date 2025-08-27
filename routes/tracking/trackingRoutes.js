import { Router } from "express";
import { isLogin } from "../../middleWares/isLogin.js";
import { addLoginPacket, getLoginPacketById, getLoginPackets } from "../../services/bharat101/loginPacketServer.js";
import { addTrackingPacket, getTrackingPacketById, getTrackingPackets } from "../../services/bharat101/trackingPacketService.js";
import { addHealthPacket, getAllHealthPackets } from "../../services/bharat101/healthMonitoringService.js";
import { addEmergencyPacket, getAllEmergencyPackets, getEmergencyPacketById } from "../../services/bharat101/emergencyPacketService.js";
import { roleBaseAuth } from "../../middleWares/rolebaseAuth.js";

const router = Router();

router.get("/login",isLogin,roleBaseAuth( "ADMIN"),getLoginPackets)
router.get("/login/:id",isLogin,roleBaseAuth( "ADMIN"),getLoginPacketById)
router.get("/",isLogin,roleBaseAuth( "ADMIN"),getTrackingPackets)
router.get("/tack/:id",isLogin,roleBaseAuth( "ADMIN"),getTrackingPacketById)
router.get("/health",isLogin,roleBaseAuth( "ADMIN"),getAllHealthPackets)
router.get("/health/:id",isLogin,roleBaseAuth( "ADMIN"),getAllHealthPackets)
router.get("/emergency",isLogin,roleBaseAuth( "ADMIN"),getAllEmergencyPackets)
router.get("/emergency/:id",isLogin,roleBaseAuth( "ADMIN"),getEmergencyPacketById)





router.post("/login",addLoginPacket)
router.post("/track",addTrackingPacket)
router.post("/health",addHealthPacket)
router.post("/emergency",addEmergencyPacket)


export default router;