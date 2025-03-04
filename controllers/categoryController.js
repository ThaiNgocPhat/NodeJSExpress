import { categorySchema} from "../validation/categoryValidation.js";
import CategoryService from "../services/CategoryService.js";
class CategoryController {
    // MANAGER
    async addCategory(req, res) {
        try {
            // Validate the request body
            await categorySchema.validateAsync(req.body, { abortEarly: false });
    
            // Nếu dữ liệu hợp lệ, gọi CategoryService để thêm mới category
            const response = await CategoryService.addCategory(req.body);
    
            // Trả về phản hồi
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
                message: "Lỗi Server"
            });
        }
    }    

    async updateCategory(req, res) {
        try {
            // Validate the request body
            await categorySchema.validateAsync(req.body, { abortEarly: false });
            const { categoryId } = req.params;
            const { category_name, category_description } = req.body;
            const response = await CategoryService.updateCategory(categoryId, { category_name, category_description });
            // Trả về phản hồi
            res.status(response.code).json(response);
        } catch (error) {
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
                message: "Lỗi Server"
            });
        }
    }

    async changeStatus(req, res) {
        try {
            const { categoryId } = req.params; // Lấy categoryId từ params
            const response = await CategoryService.changeStatus(categoryId); // Gọi CategoryService.changeStatus mà không cần status
    
            // Trả về phản hồi thành công
            res.status(response.code).json(response);
        } catch (error) {
            console.error("Error in changeStatus:", error);  // Log lỗi để dễ dàng kiểm tra
    
            if (error.code === 404 || error.code === 400) {
                return res.status(error.code).json({
                    code: error.code,
                    status: error.status,
                    message: error.message
                });
            }
            
            // Nếu lỗi không phải do người dùng gây ra, trả về lỗi server
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server"
            });
        }
    }    

    async deleteCategory(req, res) {
        try {
            const { categoryId } = req.params; // Lấy categoryId từ params
            const response = await CategoryService.deleteCategory(categoryId); 
            // Trả về phản hồi
            res.status(response.code).json(response);
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    //ADMIN AND MANAGER
    async listCategory(req, res) {
        try {
            const response = await CategoryService.listCategory();
            // Trả về phản hồi
            res.status(response.code).json(response);
        } catch (error) {
            console.error("Error in listCategory:", error);  
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server"
            });
        }
    }

    async findCategoryByName(req, res) {
        try{
            const { categoryName } = req.body;
            if(!categoryName){
                return res.status(400).json({
                    code: 400,
                    message: "Danh mục không được để trống"
                }) 
            }
            const response = await CategoryService.findCategoryByName(categoryName);
            res.status(response.code).json(response);
        }catch (error){
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server"
            })
        }
    }

    async findCategoryById(req, res) {
        try{
            const {categoryId} = req.params;
            const response = await CategoryService.findCategoryById(categoryId);
            res.status(response.code).json(response);
        }catch (error){
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    //PERMITALL
    async listCategoryPermitAll(req, res){
        try {
            const response = await CategoryService.listCategoryPermitAll();
            res.status(response.code).json(response);
        } catch (error) {
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server"
            });
        }
    }
}

export default new CategoryController();