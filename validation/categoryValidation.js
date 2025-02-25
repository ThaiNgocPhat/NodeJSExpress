import Joi from "joi";
import { dbQuery } from "../config/queryAsync.js";

const checkCategoryNameExist = async ({category_name}) => {
    const existingCategory = await dbQuery(
        `SELECT * FROM category WHERE LOWER(category_name) = LOWER(?)`,
        [category_name]
    );
    
    if (existingCategory.length > 0) {
        throw {
            code: 409,
            status: "CONFLICT",
            message: "Category already exists"
        };
    }
}

export const categorySchema = Joi.object({
    category_name: Joi.string().min(3).max(100).required(),
    category_description: Joi.string().min(3).max(100).required()
}).external(checkCategoryNameExist);