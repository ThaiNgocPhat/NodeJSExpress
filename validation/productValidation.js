import Joi from "joi";
import { dbQuery } from "../config/queryAsync.js";

// Hàm validate dữ liệu sản phẩm
const checkProductNameAndSKU = async ({ product_name, sku }) => {
    const existingProductName = await dbQuery(`SELECT * FROM product WHERE LOWER(product_name) = LOWER(?)`, [product_name]);
    if (existingProductName.length > 0) {
        throw {
            code: 409,
            status: "CONFLICT",
            message: "Sản phẩm đã tồn tại"
        };
    }

    const existingSKU = await dbQuery(`SELECT * FROM product WHERE LOWER(sku) = LOWER(?)`, [sku]);
    if (existingSKU.length > 0) {
        throw {
            code: 409,
            status: "CONFLICT",
            message: "SKU đã tồn tại"
        };
    }
};


// Định nghĩa schema validation cho productData
export const productSchema = Joi.object({
    product_name: Joi.string().min(3).max(100).required().messages({
        'string.base': 'Tên sản phẩm phải là một chuỗi.',
        'string.empty': 'Tên sản phẩm không được để trống.',
        'string.min': 'Tên sản phẩm phải có ít nhất 3 ký tự.',
        'string.max': 'Tên sản phẩm không được quá 100 ký tự.',
        'any.required': 'Tên sản phẩm là bắt buộc.'
    }),
    sku: Joi.string().min(3).max(50).required().messages({
        'string.base': 'SKU phải là một chuỗi.',
        'string.empty': 'SKU không được để trống.',
        'string.min': 'SKU phải có ít nhất 3 ký tự.',
        'string.max': 'SKU không được quá 50 ký tự.',
        'any.required': 'SKU là bắt buộc.'
    }),
    description: Joi.string().min(5).max(500).optional().messages({
        'string.base': 'Mô tả phải là một chuỗi.',
        'string.empty': 'Mô tả không được để trống.',
        'string.min': 'Mô tả phải có ít nhất 5 ký tự.',
        'string.max': 'Mô tả không được quá 500 ký tự.',
    }),
    unit_price: Joi.number().positive().required().messages({
        'number.base': 'Giá sản phẩm phải là một số.',
        'number.positive': 'Giá sản phẩm phải là một số dương.',
        'any.required': 'Giá sản phẩm là bắt buộc.'
    }),
    stock: Joi.number().integer().min(0).required().messages({
        'number.base': 'Số lượng tồn kho phải là một số nguyên.',
        'number.min': 'Số lượng tồn kho không thể nhỏ hơn 0.',
        'any.required': 'Số lượng tồn kho là bắt buộc.'
    }),
    image: Joi.string().uri().optional().messages({
        'string.uri': 'Ảnh phải là một URL hợp lệ.'
    })
}).external(checkProductNameAndSKU);
