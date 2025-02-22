import jwt from 'jsonwebtoken';

class AuthMiddleware {
    verifyToken = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ Status: false, Error: 'Authorization header missing' });
            }
            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({ Status: false, Error: 'Token not provided' });
            }
            console.log('tokenAccess:', token);
            jwt.verify(token, 'access_token_secret_token', (err, decoded) => {
                if (err) {
                    return res.status(403).json({ Status: false, Error: 'Invalid or expired token' });
                }
                req.admin = decoded;
                console.log('decoded:', decoded);
                next();
            });
        } catch (error) {
            return res.status(500).json({ Status: false, Error: 'Internal Server Error' });
        }
    }
}

export default new AuthMiddleware();
