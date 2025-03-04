import { Router } from "express";
import addressController from "../controllers/addressController.js";
import authMiddeleware from "../middleware/authMiddeleware.js";

const router = Router();

router.post('/add_address', authMiddeleware.verifyToken, addressController.addAddress);
router.get('/list_address', authMiddeleware.verifyToken, addressController.listAddress);
router.delete('/delete_address', authMiddeleware.verifyToken, addressController.deleteAddress);
router.get('/get_address_by_id', authMiddeleware.verifyToken, addressController.getAddressById);

export default router;