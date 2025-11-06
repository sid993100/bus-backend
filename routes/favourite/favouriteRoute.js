import { Router } from "express";
import {
    addFavourite,
    removeFavourite,
    getFavourites,
    getFavouriteById,
    updateFavourite,
    deleteFavourite,
    getFavouritesByUser
} from "../../services/favourite/favouriteServices.js";
import { isLogin } from "../../middlewares/isLogin.js";

const router = Router();

// POST /api/favourite - Add a new favourite
router.post("/", isLogin, addFavourite);

// GET /api/favourite - Get all favourites (with optional user query param)
router.get("/", isLogin, getFavourites);

// GET /api/favourite/user/:userId - Get favourites by user ID
router.get("/user/:userId", isLogin, getFavouritesByUser);

// GET /api/favourite/:id - Get favourite by ID
router.get("/:id", isLogin, getFavouriteById);

// PUT /api/favourite/:id - Update favourite
router.put("/:id", isLogin, updateFavourite);

// DELETE /api/favourite - Remove multiple favourites for user with array of trip or route IDs, like add
router.delete("/", isLogin, removeFavourite);

// DELETE /api/favourite/:id - Delete favourite
router.delete("/:id", isLogin, deleteFavourite);

export default router;
