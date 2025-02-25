import authService from "../services/AuthService.js";
import { loginSchema, registerSchema, resetPasswordSchema } from "../validation/authValidator.js";

class AuthController {
    register = async (req, res) => {
        try {
            // Validate the request body
            await registerSchema.validateAsync(req.body, { abortEarly: false });
            // If data is valid, call AuthService to register the user
            const response = await authService.register(req.body);
            res.status(response.code).json(response);
        } catch (error) {
            console.error("Error in register:", error); // Log the error to the console
            
            if (error.isJoi) {
                // Handle Joi validation error specifically
                return res.status(400).json({
                    code: 400,
                    status: "BAD_REQUEST",
                    message: error.details.map(detail => detail.message).join(', ') // Concatenate all validation errors
                });
            }
            // Fallback for other errors
            res.status(error.code || 500).json({
                code: error.code || 500,
                status: error.status || "INTERNAL_SERVER_ERROR",
                message: error.message || "Internal Server Error"
            });
        }
    };
    

    login = async (req, res) => {
        try {
            console.log("Request body:", req.body);  // Log dữ liệu từ client (Postman)
    
            // Validate the request body
            await loginSchema.validateAsync(req.body, { abortEarly: false });
            const { user_name, password } = req.body;
    
            // Gọi authService để xử lý đăng nhập
            const response = await authService.login(user_name, password);
            res.status(200).json(response);
        } catch (error) {
            console.error("Validation or authService error:", error);
    
            if (error.isJoi) {
                // Joi validation error
                const errorMessages = error.details.map(detail => detail.message);
                return res.status(400).json({ status: false, message: errorMessages.join(', ') });
            }
    
            // Các lỗi khác từ AuthService
            res.status(401).json({ status: false, message: error.message });
        }
    };    

    verifyEmail = async (req, res) => {
        try {
            const { otpInput } = req.body;
            const response = await authService.verifyEmail(otpInput); // Chuyển toàn bộ xử lý vào service
            res.status(response.code).json(response);
        } catch (error) {
            console.error("Error in verifyEmail:", error);
            res.status(error.code || 500).json({
                code: error.code || 500,
                status: error.status || "INTERNAL_SERVER_ERROR",
                message: error.message || "Lỗi máy chủ nội bộ"
            });
        }
    };    

    resetPassword = async (req, res) => {
        try {
            const { email } = req.body;
            const response = await authService.forgotPassword(email);
            res.status(response.code).json(response);
        } catch (error) {
            res.status(error.code || 500).json({
                code: error.code || 500,
                status: error.status || "INTERNAL_SERVER_ERROR",
                message: error.message || "Lỗi máy chủ nội bộ"
            });
        }
    };

    updatePassword = async (req, res) => {
        try {
            await resetPasswordSchema.validateAsync(req.body, { abortEarly: false });
            const { token, newPassword, confirmPassword } = req.body;
            const response = await authService.resetPassword(token, newPassword, confirmPassword);
            res.status(response.code).json(response);
        } catch (error) {
            console.error("Error in resetPassword:", error);
            if (error.isJoi) {
                return res.status(400).json({
                    code: 400,
                    status: "BAD_REQUEST",
                    message: error.details.map(detail => detail.message).join(', ')
                });
            }
            res.status(error.code || 500).json({
                code: error.code || 500,
                status: error.status || "INTERNAL_SERVER_ERROR",
                message: error.message || "Lỗi máy chủ nội bộ"
            });
        }
    };
}

export default new AuthController();
