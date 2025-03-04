import { Router } from "express";
import AuthController from "../controllers/authController.js";
const router = Router();

router.post("/register" ,AuthController.register);
router.post("/login", AuthController.login);
router.post("/verify_email", AuthController.verifyEmail)
router.post("/reset_password", AuthController.resetPassword)
router.post("/update_password", AuthController.updatePassword)

export default router;