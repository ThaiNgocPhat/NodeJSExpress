import { Router } from "express";
import CategoryController from "../controllers/CategoryController.js";
import authMiddeleware from "../middleware/authMiddeleware.js";
const router = Router();

//MANAGER
router.post("/add_category", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), CategoryController.addCategory);
router.put("/update_category/:categoryId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), CategoryController.updateCategory);
router.put("/change_status_category/:categoryId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), CategoryController.changeStatus)
router.delete("/delete_category/:categoryId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), CategoryController.deleteCategory)

//ADMIN AND MANAGER
router.get("/list_category", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager', 'admin']), CategoryController.listCategory)
router.get("/get_category", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager', 'admin']), CategoryController.findCategoryByName)
router.get("/get_category_by_id/:categoryId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager', 'admin']), CategoryController.findCategoryById);

//PERMITALL
router.get("/", CategoryController.listCategoryPermitAll)
export default router;