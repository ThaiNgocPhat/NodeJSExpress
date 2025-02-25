import bcrypt from 'bcrypt';
import { v4 as uuidv4} from 'uuid' 
import jwt from 'jsonwebtoken';
import { dbQuery } from '../config/queryAsync.js';
import {sendResetPasswordEmail} from '../config/mailService.js'
import { sendOTPEmail } from '../config/mailService.js';

class AuthService {
    async register(userData) {
        const { user_name, email, full_name, password, phone, address } = userData;
        // Kiểm tra người dùng đã tồn tại hay chưa
        const existingUser = await dbQuery(`SELECT * FROM users WHERE LOWER(user_name) = LOWER(?)`, [user_name]);
        if (existingUser.length) {
            throw {
                code: 409, 
                status: "Conflict",
                message: "User already exists"
            };
        }
    
        // Tạo id ngẫu nhiên bằng uuid
        const userId = uuidv4();
    
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // Lấy role_id của vai trò 'user'
        const roleResult = await dbQuery(`SELECT role_id FROM role WHERE role_name = 'user' LIMIT 1`);
        if (!roleResult.length) {
            throw {
                code: 404, 
                status: "NotFound",
                message: "Role 'user' not found"
            };
        }
        const roleId = roleResult[0].role_id;
    
        // Gửi mã OTP
        const otp = Math.floor(100000 + Math.random() * 900000);
        await sendOTPEmail(email, user_name, email, otp);
    
        // Thêm người dùng vào database với role_id thay vì role_name
        const sql = `INSERT INTO users(user_id, user_name, email, full_name, password, phone, address, otp, role_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await dbQuery(sql, [userId, user_name, email, full_name, hashedPassword, phone, address, otp, roleId]);

        // Trả về thông tin đã đăng ký
        return {
            code: 201,
            status: "CREATED",
            message: {
                user_name,
                full_name,
                phone,
                email,
                address
            }
        };
    }    

    async login(user_name, password) {
        // Kiểm tra dữ liệu đầu vào
        if (!user_name || !password) {
            throw {
                code: 400,
                status: "BAD_REQUEST",
                message: "Both username and password are required"
            };
        }        
   
        // Kiểm tra người dùng có tồn tại hay không
        const results = await dbQuery(`SELECT * FROM users WHERE user_name = ?`, [user_name]);
        if (results.length === 0) {
            throw {
                code: 401,
                status: "UNAUTHORIZED",
                message: "Invalid username or password"
            };
        }
   
        const user = results[0];
   
        // Kiểm tra mật khẩu
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            throw {
                code: 401,
                status: "UNAUTHORIZED",
                message: "Invalid username or password"
            };
        }
   
        // Kiểm tra trạng thái tài khoản
        if (!user.email_verified) {
            throw {
                code: 403,
                status: "FORBIDDEN",
                message: "Email chưa được xác thực"
            };
        }
        if (!user.is_active) {
            throw {
                code: 403,
                status: "FORBIDDEN",
                message: "Tài khoản đã bị khoá"
            };
        }
   
        if (user.is_deleted) {
            throw {
                code: 403,
                status: "FORBIDDEN",
                message: "Tài khoản đã bị xoá"
            };
        }

        //Truy vấn role để lấy thông tin của role
        const roleResults = await dbQuery(`SELECT * FROM role WHERE role_id = ?`, [user.role_id]);
        // Lấy thông tin của role
        const role = roleResults[0].role_name;
   
        // Tạo token JWT với role
        const token = jwt.sign(
            { user_name: user.user_name, role: role },  
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
   
        return {
            code: 200,
            status: "OK",
            token
        };
    }   

    async verifyEmail(otpInput) {
        // Kiểm tra nếu OTP không hợp lệ
        if (!otpInput || isNaN(otpInput)) {
            throw {
                code: 400,
                status: "BAD_REQUEST",
                message: "Mã OTP không hợp lệ."
            };
        }
    
        // Chuyển otpInput thành số nguyên
        const otp = parseInt(otpInput, 10);
    
        // Tìm người dùng có mã OTP này trong database
        const results = await dbQuery(`SELECT * FROM users WHERE otp = ?`, [otp]);
    
        if (!results || results.length === 0) {
            throw {
                code: 400,
                status: "BAD_REQUEST",
                message: "Mã OTP không hợp lệ hoặc đã hết hạn."
            };
        }
    
        const user = results[0];
    
        // Kiểm tra xem email đã được xác thực chưa
        if (user.email_verified) {
            throw {
                code: 400,
                status: "BAD_REQUEST",
                message: "Email đã được xác thực rồi."
            };
        }
    
        // Cập nhật trạng thái email_verified = true, is_active = true và xóa OTP
        await dbQuery(`UPDATE users SET email_verified = ?, status = ?, is_deleted = ?, is_active = ?, otp = NULL WHERE user_id = ?`, [true, true, false, true, user.user_id]);
    
        // Trả về thông báo thành công
        return {
            code: 200,
            status: "OK",
            message: "Xác thực email thành công"
        };
    }    

    async forgotPassword(email) {
        const results = await dbQuery(`SELECT * FROM users WHERE email = ?`, [email]);
        if (!results || results.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Email không tồn tại"
            };
        }
    
        const user = results[0];
        const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resetPasswordUrl = `${process.env.FRONTEND_URL}/index.html?token=${resetToken}`;
    
        await dbQuery(`UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?`, 
            [resetToken, Date.now() + 3600000, email]);
    
        await sendResetPasswordEmail(email, user.user_name, resetPasswordUrl);
    
        return {
            code: 200,
            status: "OK",
            message: "Một email reset mật khẩu đã được gửi đến bạn."
        };
    }

    async resetPassword(resetToken, newPassword, confirmPassword) {
        try {
            if (newPassword !== confirmPassword) {
                throw {
                    code: 400,
                    status: "BAD_REQUEST",
                    message: "Mật khẩu mới và xác nhận mật khẩu không trùng nhau."
                };
            }
    
            // Xác minh token
            const decodedToken = jwt.verify(resetToken, process.env.JWT_SECRET);
            if (!decodedToken || !decodedToken.email) {
                throw {
                    code: 401,
                    status: "UNAUTHORIZED",
                    message: "Token reset mật khẩu không hợp lệ"
                };
            }
    
            // Kiểm tra token trong database
            const results = await dbQuery(`SELECT * FROM users WHERE email = ? AND reset_token = ?`, 
                [decodedToken.email, resetToken]);
            if (!results || results.length === 0) {
                throw {
                    code: 401,
                    status: "UNAUTHORIZED",
                    message: "Token reset mật khẩu không hợp lệ hoặc đã được sử dụng"
                };
            }
    
            const user = results[0];
            if (user.reset_token_expiry < Date.now()) {
                throw {
                    code: 401,
                    status: "UNAUTHORIZED",
                    message: "Token reset mật khẩu đã hết hạn"
                };
            }
    
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await dbQuery(`UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ? AND reset_token = ?`, 
                [hashedPassword, decodedToken.email, resetToken]);
    
            return {
                code: 200,
                status: "OK",
                message: "Mật khẩu đã được thay đổi thành công"
            };
        } catch (error) {
            console.error("Error in resetPassword:", error);
            if (error.name === 'TokenExpiredError') {
                throw {
                    code: 401,
                    status: "UNAUTHORIZED",
                    message: "Token reset mật khẩu đã hết hạn"
                };
            }
            throw error.code ? error : {
                code: 500,
                status: "INTERNAL_SERVER_ERROR",
                message: "Lỗi máy chủ nội bộ: " + error.message
            };
        }
    }
}

export default new AuthService();
