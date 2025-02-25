import { Router } from "express";
import productController from "../controllers/productController.js";
import authMiddeleware from "../middleware/authMiddeleware.js";
const router = Router();

// MANAGER
router.post("/add_product", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), productController.addProduct);

export default router;