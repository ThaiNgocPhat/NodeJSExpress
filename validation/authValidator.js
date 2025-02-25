import Joi from "joi";
import { dbQuery } from "../config/queryAsync.js";
import { httpMessage } from "../config/httpStatus.js";
import { httpStatus } from "../config/httpStatus.js";
import { httpStatusText } from "../config/httpStatus.js";

// Hàm kiểm tra username hoặc số điện thoại có tồn tại không
const checkUserExists = async ({ user_name, phone }) => {
    const existingUser = await dbQuery(
        `SELECT * FROM users WHERE LOWER(user_name) = LOWER(?) OR phone = ?`,
        [user_name, phone]
    );
    
    if (existingUser.length > 0) {
        if (existingUser[0].user_name.toLowerCase() === user_name.toLowerCase()) {
            throw {
                code: httpStatus.Conflict,
                status: httpStatusText.Conflict,
                message: httpMessage.existingUser 
            };
        }
        if (existingUser[0].phone === phone) {
            throw {
                code: httpStatus.Conflict,
                status: httpStatusText.Conflict,
                message: httpMessage.existingTelephone
            };
        }
    }
};


export const registerSchema = Joi.object({
    user_name: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required(), 
    full_name: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^0[3-9][0-9]{8}$/).required(),
    email: Joi.string().email().required(), 
    address: Joi.string().max(255).required()
}).external(checkUserExists);

export const loginSchema = Joi.object({
    user_name: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required()
});

export const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});