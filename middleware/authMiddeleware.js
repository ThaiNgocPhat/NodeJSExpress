import jwt from 'jsonwebtoken';

class AuthMiddleware {
    // Middleware để xác thực token
    verifyToken = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({
                    status: false,
                    message: 'Authorization header missing'
                });
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    status: false,
                    message: 'Token not provided'
                });
            }

            // Giải mã token
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(403).json({
                        status: false,
                        message: 'Invalid or expired token'
                    });
                }
                req.user = decoded;  // Lưu thông tin người dùng vào req.user
                next();  // Tiếp tục xử lý request
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Internal Server Error',
                error: error.message || 'An error occurred during token verification.'
            });
        }
    }

    // Middleware kiểm tra quyền hạn
    authorizeRole = (roles) => {
        return (req, res, next) => {    
            if (!req.user || !roles.includes(req.user.role)) {
                return res.status(403).json({
                    status: false,
                    message: 'Access denied: insufficient privileges'
                });
            }
            next();
        };
    };
    
}

export default new AuthMiddleware();
