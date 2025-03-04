import { Router } from "express";
import productController from "../controllers/productController.js";
import authMiddeleware from "../middleware/authMiddeleware.js";
const router = Router();

// MANAGER
router.post("/add_product", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), productController.addProduct);
router.put("/update_product/:productId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), productController.updateProduct);
router.put("/change_status_product/:productId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), productController.changeStatusProduct)
router.delete("/delete_product/:productId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), productController.deleteProduct)

//ADMIN AND MANAGER
router.get("/list_products", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['admin', 'manager']), productController.getAllProducts)
router.get("/get_product_by_name", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['admin', 'manager']), productController.getProductByName)
router.get("/get_product_by_id/:productId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['admin', 'manager']), productController.getProductById);

//PERMITALL
router.get("/", productController.listProductPermitAll)
router.get("/search_product_by_name", productController.searchProductPermitAll);
router.get("/get_new_product", productController.newProductPermitAll);
router.get("/get_product_by_category/:categoryId", productController.getProductsByCategoryIdPermitAll);
router.get("/find_product_by_id/:productId", productController.getProductByIdPermitAll);

export default router;