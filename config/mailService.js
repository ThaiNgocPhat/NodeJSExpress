import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config(); // Load biến môi trường từ .env

// Cấu hình mail server (Gmail)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Email của bạn
        pass: process.env.EMAIL_PASS  // Mật khẩu ứng dụng của Gmail
    }
});

// Hàm gửi OTP qua email
export const sendOTPEmail = async (to, user_name, email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,  // Email người gửi
            to: to,  // Email người nhận
            subject: "Mã OTP xác thực",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <div style="background-color: #2196F3; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h3 style="color: #ffffff; margin: 0; font-size: 24px;">Xin chào ${user_name},</h3>
                    </div>
                    <div style="padding: 20px; background-color: #ffffff; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 16px; color: #333333; line-height: 1.6;">Chúng tôi đã gửi mã OTP để xác thực email của bạn.</p>
                        <p style="font-size: 16px; color: #333333; line-height: 1.6;">Email của bạn: <strong>${email}</strong></p>
                        <div style="text-align: center; margin: 20px 0;">
                            <p style="font-size: 24px; color: #2196F3; font-weight: bold; background-color: #f0f0f0; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">${otp}</p>
                        </div>
                        <p style="font-size: 14px; color: #666666; line-height: 1.6;">
                            <strong>Lưu ý:</strong> Mã OTP này có hiệu lực trong 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai để đảm bảo an toàn cho tài khoản của bạn.
                        </p>
                        <p style="font-size: 14px; color: #666666; line-height: 1.6;">
                            Nếu bạn không yêu cầu mã này, vui lòng liên hệ với chúng tôi ngay lập tức.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999999; text-align: center;">
                            Trân trọng,<br>
                            <strong>Đội ngũ hỗ trợ</strong><br>
                            © 2025 Công ty của bạn. Mọi quyền được bảo lưu.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("OTP sent successfully!");
    } catch (error) {
        console.error("Error sending OTP:", error);
        throw new Error("Không thể gửi OTP.");
    }
};
export const sendResetPasswordEmail = async (to, user_name, resetPasswordUrl) => {
    try {
        const resetPassword = {
            from: process.env.EMAIL_USER,
            to,
            subject: "Yêu cầu thiết lập lại mật khẩu",
            html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <div style="background-color: #4CAF50; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
                            <h3 style="color: #ffffff; margin: 0; font-size: 24px;">Xin chào ${user_name},</h3>
                        </div>
                        <div style="padding: 20px; background-color: #ffffff; border-radius: 0 0 8px 8px;">
                            <p style="font-size: 16px; color: #333333; line-height: 1.6;">Chúng tôi nhận được yêu cầu thiết lập lại mật khẩu cho tài khoản của bạn.</p>
                            <p style="font-size: 16px; color: #333333; line-height: 1.6;">
                                Nhấn vào nút bên dưới để đặt lại mật khẩu:
                            </p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="${resetPasswordUrl}" style="background-color: #4CAF50; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">Thiết lập mật khẩu mới</a>
                            </div>
                            <p style="font-size: 14px; color: #666666; line-height: 1.6;">
                                Hoặc sao chép và dán đường dẫn sau vào trình duyệt của bạn:<br>
                                <a href="${resetPasswordUrl}" style="color: #4CAF50; word-break: break-all;">${resetPasswordUrl}</a>
                            </p>
                            <p style="font-size: 14px; color: #666666; line-height: 1.6;">
                                <strong>Lưu ý:</strong> Link này sẽ hết hạn sau 1 giờ.
                            </p>
                            <p style="font-size: 14px; color: #666666; line-height: 1.6;">
                                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                            </p>
                            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #999999; text-align: center;">
                                Trân trọng,<br>
                                <strong>Đội ngũ hỗ trợ</strong><br>
                                © 2025 Công ty của bạn. Mọi quyền được bảo lưu.
                            </p>
                        </div>
                    </div>
                `
        };
        await transporter.sendMail(resetPassword);
        console.log("Reset password email sent successfully!");
    } catch (error) {
        throw {
            code: 500,
            status: "INTERNAL_SERVER_ERROR",
            message: `Không thể gửi email: ${error.message}`
        };
    }
};
