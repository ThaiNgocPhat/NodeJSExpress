import { Router } from "express";
import wishlistController from "../controllers/wishlistController.js";
import authMiddeleware from "../middleware/authMiddeleware.js";

const router = Router();

router.get('/list_wishlist', authMiddeleware.verifyToken, wishlistController.listWishlist);
router.post('/add_wishlist', authMiddeleware.verifyToken, wishlistController.addWishlist);
router.delete('/delete_wishlist/:wishlistId', authMiddeleware.verifyToken, wishlistController.deleteWishlist);

export default router;