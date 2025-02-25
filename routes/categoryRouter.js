import { Router } from "express";
import CategoryController from "../controllers/CategoryController.js";
import authMiddeleware from "../middleware/authMiddeleware.js";
const router = Router();

//MANAGER
router.post("/add_category", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), CategoryController.addCategory);
router.put("/update_category/:categoryId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), CategoryController.updateCategory);
router.put("/change_status_category/:categoryId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), CategoryController.changeStatus)

//ADMIN AND MANAGER
router.get("/list_category", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager', 'admin']), CategoryController.listCategory)
router.get("/get_category/:categoryId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager', 'admin']), CategoryController.getCategoryById)

//PERMITALL
router.get("/category", CategoryController.listCategoryPermitAll)
export default router;