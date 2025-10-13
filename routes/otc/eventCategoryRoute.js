import {Router} from "express";
import { createEventCategory, getAllEventCategories, getEventCategoryById, updateEventCategory } from "../../services/otc/eventCategoryServer.js";


const router = Router();

router.post("/", createEventCategory);  
router.get("/", getAllEventCategories);
router.get("/:id", getEventCategoryById);   
router.put("/:id", updateEventCategory);  
// router.delete("/:id", deleteEventCategory);  

export default router;
