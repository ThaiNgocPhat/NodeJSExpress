import Joi from "joi";
import { dbQuery } from "../config/queryAsync.js";

// Hàm kiểm tra username hoặc số điện thoại có tồn tại không
const checkUserExists = async ({ username, telephone }) => {
    const existingUser = await dbQuery(
        `SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR telephone = ?`,
        [username, telephone]
    );
    
    if (existingUser.length > 0) {
        if (existingUser[0].username.toLowerCase() === username.toLowerCase()) {
            throw new Error("Username already exists");
        }
        if (existingUser[0].telephone === telephone) {
            throw new Error("Telephone number already exists");
        }
    }
};

// Schema validation
export const registerSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    telephone: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
    address: Joi.string().max(255).required(),
    email: Joi.string().email().required(), 
    address: Joi.string().required()
}).external(checkUserExists);