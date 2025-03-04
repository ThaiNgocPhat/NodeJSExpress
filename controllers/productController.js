import { dbQuery } from "../config/queryAsync.js";
import productService from "../services/productService.js";
import {productSchema} from "../validation/productValidation.js"
class ProductController {
    // MANAGER
    async addProduct(req, res) {
        try {
            await productSchema.validateAsync(req.body, { abortEarly: false });
            const response = await productService.addProduct(req.body);
            res.status(response.code).json(response);
        } catch (error) {
            // Nếu lỗi là từ Joi, trả về lỗi từ Joi
            if (error.isJoi) {
                return res.status(400).json({
                    code: 400,
                    message: error.details.map(d => d.message).join(', ')
                });
            }
    
            // Nếu lỗi từ checkCategoryNameExist hoặc lỗi bất kỳ khác, trả về lỗi 409 (CONFLICT)
            if (error.code === 409) {
                return res.status(error.code).json({
                    code: error.code,
                    status: error.status,
                    message: error.message
                });
            }
    
            // Lỗi bất kỳ khác, trả về lỗi server
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }

    async updateProduct(req, res) {
        try{
            await productSchema.validateAsync(req.body, { abortEarly: false });
            const {productId} = req.params;
            const { product_name, sku, description, unit_price, stock, category_id } = req.body;
            const response = await productService.updateProduct(productId, { product_name, sku, description, unit_price, stock, category_id });
            res.status(response.code).json(response);
        }catch (error){
            console.log("Lỗi cập nhật sản phẩm " + error);
            if (error.isJoi) {
                return res.status(400).json({
                    code: 400,
                    message: error.details.map(d => d.message).join(', ')
                });
            }
        
            if (error.code === 404) {
                return res.status(error.code).json({
                    code: error.code,
                    status: error.status,
                    message: error.message
                });
            }
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }

    async changeStatusProduct(req, res){
        try{
            const {productId} = req.params;
            const response = await productService.changeStatusProduct(productId);
            res.status(response.code).json(response);
        }catch (error){
            if (error.code === 404) {
                return res.status(404).json(error);
            }
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }

    async deleteProduct(req, res){
        try{
            const {productId} = req.params;
            const response = await productService.deleteProduct(productId);
            res.status(response.code).json(response);
        }catch (error){
            if (error.code === 404) {
                return res.status(404).json(error);
            }
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }

    }

    //ADMIN AND MANAGER
    async getAllProducts(req, res) {
        try {
            const response = await productService.listProduct(req.query); 
            res.status(response.code).json(response);
        } catch (error) {
            if (error.code === 404) {
                return res.status(404).json(error);
            }
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }    
    
    async getProductByName(req, res){
        try{
            const {productName} = req.body;
            const response = await productService.getProductByName(productName);
            res.status(response.code).json(response);
        }catch (error){
            if (error.code === 404) {
                return res.status(404).json(error);
            }
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }

    async getProductById(req, res){
        try{
            const {productId} = req.params;
            const response = await productService.getProductById(productId);
            res.status(response.code).json(response);
        }catch (error){
            res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    //PERMITALL
    async listProductPermitAll(req, res) {
        try {
            // Nhận các tham số từ query params
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const sortBy = req.query.sortBy || "product_name";
            const order = req.query.order || "ASC"; 
    
            const response = await productService.listProductPermitAll(page, limit, sortBy, order);
            res.status(response.code).json(response);
        } catch (error) {
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }    

    async searchProductPermitAll(req, res) {
        try {
            const { productName } = req.query;
            const response = await productService.searchProductPermitAll(productName);
            res.status(response.code).json(response);
        } catch (error) {
            if (error.code === 404) {
                return res.status(404).json(error);
            }
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }    

    async newProductPermitAll(req, res){
        try{
            const response = await productService.newProductPermitAll();
            res.status(response.code).json(response);
        }catch (error){
            if (error.code === 404) {
                return res.status(404).json(error); 
            }
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }

    async getProductsByCategoryIdPermitAll(req, res){
        try{
            const {categoryId} = req.params;
            const response = await productService.getProductsByCategoryIdPermitAll(categoryId);
            res.status(response.code).json(response);
        }catch (error){
            if (error.code === 404) {
                return res.status(404).json(error); 
            }
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }

    async getProductByIdPermitAll(req, res){
        try{
            const {productId} = req.params;
            const response = await productService.getProductByIdPermitAll(productId);
            res.status(response.code).json(response);
        }catch (error){
            if (error.code === 404) {
                return res.status(404).json(error); 
            }
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }
}

export default new ProductController();