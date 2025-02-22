import bcrypt from 'bcrypt';
import { v4 as uuidv4} from 'uuid' 
import jwt from 'jsonwebtoken';
import { dbQuery } from '../config/queryAsync.js';
import { sendOTPEmail } from '../config/mailService.js';
class AuthService {
    async register(userData) {
        const { username, password, first_name, last_name, telephone, email, address } = userData;
        
        // Kiểm tra người dùng đã tồn tại hay chưa
        const existingUser = await dbQuery(`SELECT * FROM users WHERE LOWER(username) = LOWER(?)`, [username]);
        if (existingUser.length) {
            throw {
                code: 409,
                status: "CONFLICT",
                message: "User already registered"
            };
        }
        
        //Tạo id ngẫu nhiên bằng uuid
        const userId = uuidv4();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        //Mặc định is_active
        const is_active = false;

        //Mặc định is_deleted
        const is_deleted = false;

        //Mặc định email_verified
        const email_verified = false;

        //Gắn vai trò mặc định cho người dùng đăng ký
        const role = 'user';

        //Gửi mã otp
        const otp = Math.floor(100000 + Math.random() * 900000);
        await sendOTPEmail(email, username, email, otp);

        // Thêm người dùng vào database
        const sql = `INSERT INTO users(id, username, password, first_name, last_name, telephone, email, address, role, is_active, is_deleted, email_verified, otp) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await dbQuery(sql, [userId, username, hashedPassword, first_name, last_name, telephone, email, address, role, is_active ? 1 : 0, is_deleted ? 1 : 0, email_verified ? 1 : 0, otp]);
        
        // Trả về thông tin đã đăng ký
        return {
            code: 201,
            status: "CREATED",
            message: {
                username,
                first_name,
                last_name,
                telephone,
                email,
                address
            }
        };
    }

    async login(username, password) {
        // Kiểm tra dữ liệu đầu vào
        if (!username || !password) {
            throw {
                code: 400,
                status: "BAD_REQUEST",
                message: "Missing username or password"
            };
        }

        // Kiểm tra người dùng có tồn tại hay không
        const results = await dbQuery(`SELECT * FROM users WHERE username = ?`, [username]);
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


        // Tạo token JWT
        const token = jwt.sign(
            { username: user.username, role: user.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1h" }
        );

        return {
            code: 200,
            status: "OK",
            token
        };
    }

    async verifyEmailHandler(otpInput){
        // Tìm người dùng có mã OTP này trong database
        const results = await dbQuery(`SELECT * FROM users WHERE otp = ?`, [otpInput]);
    
        // Nếu OTP không tồn tại trong database -> Lỗi
        if (!results || results.length === 0) {
            throw {
                code: 400,
                status: "BAD_REQUEST",
                message: "Mã OTP không hợp lệ hoặc đã hết hạn."
            };
        }
    
        const user = results[0];
    
        // Kiểm tra xem email đã xác thực chưa
        if (user.email_verified) {
            throw {
                code: 400,
                status: "BAD_REQUEST",
                message: "Email đã được xác thực rồi."
            };
        }
    
        // Cập nhật trạng thái email_verified = true, is_active = true và xóa OTP
        await dbQuery(`UPDATE users SET email_verified = ?, is_active = ?, otp = NULL WHERE id = ?`, [true, true, user.id]);
    
        // Trả về thông báo thành công
        return {
            code: 200,
            status: "OK",
            message: "Xác thực email thành công"
        };
    };    

}

export default new AuthService();
