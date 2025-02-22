import AuthService from "../services/AuthService.js";
import { registerSchema } from "../validation/authValidator.js";

class AuthController {
    register = async (req, res) => {
        try {
            //Dùng validateAsync() để hỗ trợ external()
            await registerSchema.validateAsync(req.body, { abortEarly: false }); 

            // Nếu dữ liệu hợp lệ, gọi AuthService để đăng ký
            const response = await AuthService.register(req.body);
            res.status(response.code).json(response);
        } catch (error) {
            res.status(400).json({
                code: 400,
                status: "BAD_REQUEST",
                message: error.message
            });
        }
    };

    login = async (req, res) => {
        try {
            const { username, password } = req.body;
            const response = await AuthService.login(username, password);
            res.status(200).json(response);
        } catch (error) {
            res.status(401).json({ status: false, message: error.message });
        }
    };

    verifyEmail = async (req, res) => {
        try {
            const { otpInput } = req.body;
    
            // Kiểm tra nếu OTP không được nhập hoặc không hợp lệ
            if (!otpInput || isNaN(otpInput)) {
                return res.status(400).json({
                    code: 400,
                    status: "BAD_REQUEST",
                    message: "Mã OTP không được để trống hoặc không hợp lệ."
                });
            }
    
            // Chuyển otpInput về dạng số nguyên
            const otp = parseInt(otpInput, 10);
    
            // Gọi hàm xử lý xác thực OTP
            const response = await AuthService.verifyEmailHandler(otp);
    
            // Trả về kết quả nếu xác thực thành công
            return res.status(response.code).json(response);
    
        } catch (error) {
            console.error("Error in verifyEmail:", error); // Log lỗi ra console
    
            return res.status(error.code || 500).json({
                code: error.code || 500,
                status: error.status || "INTERNAL_SERVER_ERROR",
                message: error.message || "Lỗi máy chủ nội bộ"
            });
        }
    };    
}

export default new AuthController();
