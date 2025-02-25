import productService from "../services/productService.js";
import {productSchema} from "../validation/productValidation.js"
class ProductController {
    // MANAGER
    async addProduct(req, res) {
        try {
            // Kiểm tra trường bắt buộc trước khi validate với Joi
            if (!req.body.product_name || !req.body.sku || !req.body.unit_price || !req.body.stock) {
                return res.status(400).json({
                    code: 400,
                    message: "Thiếu thông tin sản phẩm bắt buộc"
                });
            }
            await productSchema.validateAsync(req.body, { abortEarly: false });
            const response = await productService.addProduct(req.body);
            res.status(response.code).json(response);
        } catch (error) {
            if (error.isJoi) {
                return res.status(400).json({
                    code: 400,
                    message: error.details.map(d => d.message).join(', ')
                });
            }
            if (error.code === 409) {
                return res.status(error.code).json({
                    code: error.code,
                    status: error.status,
                    message: error.message
                });
            }
            return res.status(500).json({
                code: 500,
                message: "Internal Server Error"
            });
        }
    }
    
}

export default new ProductController();