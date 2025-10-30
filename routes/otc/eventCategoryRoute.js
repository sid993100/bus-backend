import {Router} from "express";
import { createEventCategory, deleteEventCategory, getAllEventCategories, getEventCategoryById, updateEventCategory } from "../../services/otc/eventCategoryServer.js";
import { isLogin } from "../../middlewares/isLogin.js";


const router = Router();

router.post("/",isLogin, createEventCategory);  
router.get("/",isLogin, getAllEventCategories);
router.get("/:id",isLogin, getEventCategoryById);   
router.put("/:id",isLogin, updateEventCategory);  
router.delete("/",isLogin, deleteEventCategory);  

export default router;
