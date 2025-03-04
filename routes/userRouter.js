import { Router } from "express";
import userController from "../controllers/userController.js";
import authMiddeleware from "../middleware/authMiddeleware.js";

const router = Router();

//MANAGER
router.put("/change_role/:userId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), userController.changeRole);
router.put("/change_status_user/:userId", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager']), userController.changeStatusUser);

//ADMIN AND MANAGER
router.get("/list_user", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager', 'admin']), userController.listUser);
router.get("/list_role_for_user", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager', 'admin']), userController.listRoleForUser);
router.get("/search_user_by_name", authMiddeleware.verifyToken, authMiddeleware.authorizeRole(['manager', 'admin']), userController.searchUserByName);

//USER
router.get('/user_info', authMiddeleware.verifyToken, userController.infoUser);
router.put('/update_user_info', authMiddeleware.verifyToken, userController.updateInfoUser);
router.put('/change_password', authMiddeleware.verifyToken, userController.changePassword);

export default router;