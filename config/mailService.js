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
export const sendOTPEmail = async (to, username, email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,  // Email người gửi
            to: to,  // Email người nhận
            subject: "Mã OTP xác thực",
            html: `<h3>Xin chào ${username},</h3>
                   <p>Email của bạn: ${email}</p>
                   <p>Mã OTP của bạn là: <strong>${otp}</strong></p>
                   <p>Vui lòng không chia sẻ mã này với ai.</p>`
        };

        await transporter.sendMail(mailOptions);
        console.log("OTP sent successfully!");
    } catch (error) {
        console.error("Error sending OTP:", error);
        throw new Error("Không thể gửi OTP.");
    }
};
