import { Router } from "express";
import { createGeoFence, deleteGeoFence, getGeoFenceById, getGeoFences, updateGeoFence } from "../services/admin/geo/geoService.js";
import { isLogin } from "../middleWares/isLogin.js";

const router = Router();

router.post("/", isLogin, createGeoFence);
router.get("/", isLogin, getGeoFences);
router.get("/:id", isLogin, getGeoFenceById);
router.patch("/:id", isLogin, updateGeoFence);
router.delete("/:id", isLogin, deleteGeoFence);

export default router;
