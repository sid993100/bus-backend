import { Router } from "express";
import { isLogin } from "../../middlewares/isLogin.js";
import { addLoginPacket, getLoginPacketById, getLoginPackets } from "../../services/bharat101/loginPacketServer.js";
import { addTrackingPacket, getTrackingPacketById, getTrackingPackets } from "../../services/bharat101/trackingPacketService.js";
import { addHealthPacket, getAllHealthPackets } from "../../services/bharat101/healthMonitoringService.js";
import { addEmergencyPacket, getAllEmergencyPackets, getEmergencyPacketById } from "../../services/bharat101/emergencyPacketService.js";
import { journeyHistoryReplay } from "../../services/tracking/journeyServices.js";
import { getVehicleByVehicleNumber } from "../../services/reports/vehicleCurrentStatusService.js";
import { createEvent, getEvents } from "../../services/bharat101/eventService.js";

const router = Router();

router.get("/login",isLogin, getLoginPackets)
router.get("/login/:id",isLogin, getLoginPacketById)
router.get("/",isLogin, getTrackingPackets)
router.get("/tack/:id",isLogin, getTrackingPacketById)
router.get("/health",isLogin, getAllHealthPackets)
router.get("/health/:id",isLogin, getAllHealthPackets)
router.get("/emergency",isLogin, getAllEmergencyPackets)
router.get("/emergency/:id",isLogin, getEmergencyPacketById)
router.get("/journey/:vehicleNumber",isLogin, journeyHistoryReplay)
router.get("/tracking/:vehicleNumber", getVehicleByVehicleNumber)
router.get("/event",isLogin,getEvents)





router.post("/event",createEvent)
router.post("/login",addLoginPacket)
router.post("/track",addTrackingPacket)
router.post("/health",addHealthPacket)
router.post("/emergency",addEmergencyPacket)

export default router;