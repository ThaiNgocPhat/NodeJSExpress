import { Router } from "express";
import AuthController from "../controllers/AuthController.js"
const router = Router();

router.post("/register" ,AuthController.register);
router.post("/login", AuthController.login);
router.post("/verify_email", AuthController.verifyEmail)

export default router;