import { dbQuery } from "../config/queryAsync.js";
import { v4 as uuidv4} from 'uuid' 
class CategoryService {
    //MANAGER
    async addCategory(categoryData) {
        //Dữ liệu đầu vào
        const { category_name, category_description } = categoryData;
        //Kiểm tra danh mục đã tồn tại chưa
        const existingCategory = await dbQuery(`select * from category where category_name = ?`, [category_name]);
        if(existingCategory.length > 0){
            throw{
                code: 409,
                status: "CONFLICT",
                message: "Danh mục đã tồn tại"
            }
        }

        // Tạo id ngẫu nhiên bằng uuid
        const categoryId = uuidv4();

        //Thêm mới vào database
        const sql = `insert into category (category_id, category_name, category_description) values (? ,?, ?)`
        await dbQuery(sql, [categoryId, category_name, category_description]);

        // Lấy lại thông tin danh mục vừa thêm
        const newCategory = await dbQuery(`SELECT * FROM category WHERE category_id = ?`, [categoryId]);

        // Chuyển đổi giá trị 1/0 thành true/false
        const category = newCategory[0];
        category.status = category.status === 1;
        category.is_deleted = category.is_deleted === 1;
        //Trả về 
        return {
            code: 201,
            status: "CREATED",
            message: "Thêm mới danh mục thành công",
            data: category
        }
    }

    async updateCategory(categoryId, updateCategory) {
        //Dữ liệu đầu vào
        const {category_name, category_description} = updateCategory;
        //Kiểm tra danh mụ có tồn tại hay không
        const existingCategory = await dbQuery(`select * from category where category_id = ?`, [categoryId]);
        if(existingCategory.length === 0){
            throw{
                code: 404,
                status: "NOT_FOUND",
                message: "Danh mục không tồn tại"
            }
        }
        //Cập nhật vào database
        const sql = `update category set category_name =?, category_description =? where category_id =?`
        await dbQuery(sql, [category_name, category_description, categoryId]);

        // Lấy lại thông tin danh mục vừa cập nhật
        const updatedCategory = await dbQuery(`SELECT * FROM category WHERE category_id =?`, [categoryId]);

        // Chuyển đổi giá trị 1/0 thành true/false
        const category = updatedCategory[0];
        category.status = category.status === 1;
        category.is_deleted = category.is_deleted === 1;
        //Trả về 
        return {
            code: 200,
            status: "OK",
            message: "Cập nhật danh mục thành công",
            data: category
        }
    }

    async changeStatus(categoryId) {
        // Kiểm tra danh mục có tồn tại hay không
        const existingCategory = await dbQuery(`SELECT * FROM category WHERE category_id = ?`, [categoryId]);
        if (existingCategory.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Danh mục không tồn tại"
            };
        }
    
        // Lấy thông tin danh mục hiện tại
        const category = existingCategory[0];
    
        // Kiểm tra nếu status đã là 1 (tức là đã bị khóa)
        if (category.status === 1) {
            throw {
                code: 400,
                status: "BAD_REQUEST",
                message: "Danh mục đã bị khoá"
            };
        }
    
        // Thay đổi trạng thái của danh mục
        const newStatus = category.status === 1 ? 0 : 1; // Nếu status là 1 thì đổi thành 0 và ngược lại
        const sql = `UPDATE category SET status = ? WHERE category_id = ?`;
        await dbQuery(sql, [newStatus, categoryId]);
    
        // Lấy lại thông tin danh mục vừa thay đổi trạng thái
        const updatedCategory = await dbQuery(`SELECT * FROM category WHERE category_id =?`, [categoryId]);
    
        // Chuyển đổi giá trị 1/0 thành true/false
        const updatedCategoryData = updatedCategory[0];
        updatedCategoryData.status = updatedCategoryData.status === 1;
        updatedCategoryData.is_deleted = updatedCategoryData.is_deleted === 1;
    
        // Trả về kết quả
        return {
            code: 200,
            status: "OK",
            message: "Thay đổi trạng thái danh mục thành công",
            data: updatedCategoryData
        };
    }    

    //ADMIN AND MANAGER
    async listCategory(){
        //Lấy tất cả danh mục
        const sql = `SELECT * FROM category`;
        const categories = await dbQuery(sql);
        categories.forEach(category => {
            category.status = category.status === 1;
            category.is_deleted = category.is_deleted === 1;
        });

        // Trả về danh sách danh mục
        return {
            code: 200,
            status: "OK",
            message: "Lấy danh sách danh mục thành công",
            data: categories
        }
    }

    async getCategoryById(categoryId) {
        // Lấy danh mục theo id
        const sql = `SELECT * FROM category WHERE category_id = ?`;
        const category = await dbQuery(sql, [categoryId]);
    
        // Kiểm tra nếu không tìm thấy danh mục hoặc category_id không khớp
        if (category.length === 0 || category[0].category_id !== categoryId) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Danh mục không tồn tại"
            };
        }

        category[0].status = category[0].status === 1;
        category[0].is_deleted = category[0].is_deleted === 1;
    
        // Trả về thông tin danh mục
        return {
            code: 200,
            status: "OK",
            message: "Lấy thông tin danh mục thành công",
            data: category[0]
        };
    }    
    
    //PERMITALL
    async listCategoryPermitAll() {
        // Lấy danh sách chỉ có category_name và category_description
        const sql = `select category_name, category_description from category`;
        const categories = await dbQuery(sql);
        // Trả về danh sách danh mục với chỉ các trường cần thiết
        return {
            code: 200,
            status: "OK",
            message: "Lấy danh sách danh mục thành công",
            data: categories
        }
    }
    
}

export default new CategoryService();