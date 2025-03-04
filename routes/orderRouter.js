import { Router } from "express";
import orderController from "../controllers/orderController.js";
import authMiddeleware from "../middleware/authMiddeleware.js";

const router = Router();

//MANAGER 
router.put('/change_status_for_order/:orderId', authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), orderController.changeStatusForOrder);

//ADMIN AND MANAGER
router.get('/get_list_orders', authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager', 'admin']), orderController.getListOrder);
router.get('/get_status_for_orders/:orderStatus', authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager', 'admin']), orderController.getStatusForOrder);
router.get('/get_order_by_id/:orderId', authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager', 'admin']), orderController.getOrderById);

//USER
router.get('/order_history', authMiddeleware.verifyToken, orderController.ordersHistory);
router.get('/get_serial_number', authMiddeleware.verifyToken, orderController.getOrderBySerialNumber);
router.get('/orders_status', authMiddeleware.verifyToken, orderController.getOrderByStatus);
router.put('/order_cancel', authMiddeleware.verifyToken, orderController.cancelOrder);


export default router;