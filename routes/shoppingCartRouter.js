import { Router } from "express";
import shoppingCartController from "../controllers/shoppingCartController.js";
import authMiddeleware from "../middleware/authMiddeleware.js";
const router = Router();

router.get('/list_cart', authMiddeleware.verifyToken, shoppingCartController.getListCart);
router.post('/add_to_cart', authMiddeleware.verifyToken, shoppingCartController.addToCart);
router.put('/change_quantity', authMiddeleware.verifyToken, shoppingCartController.changeOrderQuantity);
router.delete('/delete_one_product', authMiddeleware.verifyToken, shoppingCartController.deleteOneProduct);
router.delete('/clear_cart', authMiddeleware.verifyToken, shoppingCartController.clearCart);
router.post('/checkout', authMiddeleware.verifyToken, shoppingCartController.checkOut);

export default router;