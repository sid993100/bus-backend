import { Router } from "express";
import { createGeoFence, deleteGeoFence, getGeoFenceById, getGeoFences, updateGeoFence } from "../services/admin/geo/geoService.js";

const router = Router();

router.post("/", createGeoFence);
router.get("/", getGeoFences);
router.get("/:id", getGeoFenceById);
router.patch("/:id", updateGeoFence);
router.delete("/:id", deleteGeoFence);

export default router;
