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
        const newStatus = Boolean(category.status) ? 0 : 1;

        //Cập nhật trạng thái mới
        await dbQuery(`update category set status = ? where category_id = ?`, [newStatus, categoryId]);

        // Lấy lại thông tin danh mục sau khi cập nhật
        const updateCategory = await dbQuery(`select * from category where category_id = ?`, [categoryId]);
        const updatedCategoryData = updateCategory[0];
        updatedCategoryData.status = updatedCategoryData.status === 1;
        updatedCategoryData.is_deleted = updatedCategoryData.is_deleted === 1;
    
        //Thông báo mở/khoá dựa váo trạng thái
        const message = newStatus? "Danh mục đã bị khoá" : "Danh mục đã được mở";

        // Trả về kết quả
        return {
            code: 200,
            status: "OK",
            message: message,
            data: updateCategory[0]
        };
    }    

    async deleteCategory(categoryId) {
        //Kiểm tra id có tồn tại hay không
        const existingCategory = await dbQuery(`select * from category where category_id =?`, [categoryId]);
        if(existingCategory.length === 0){
            throw{
                code: 404,
                status: "NOT_FOUND",
                message: "Danh mục không tồn tại"
            }
        }
        //Xóa danh mục
        const sql = `delete from category where category_id =?`;
        await dbQuery(sql, [categoryId]);

        // Trả về kết quả
        return {
            code: 200,
            status: "OK",
            message: "Xóa danh mục thành công"
        }
    }

    //ADMIN AND MANAGER
    async listCategory(page = 1, limit = 10, sortBy = "created_at", order = "desc"){
        //Tính offset cho phân trang
        const offset = (page - 1) * limit;
        //Lấy tất cả danh mục
        const sql = `select category_id, category_name, status, is_deleted, created_at, created_at 
                    from category
                    order by ${sortBy} ${order}
                    limit ? offset ?`

        const categories = await dbQuery(sql, [limit, offset]);

        //Chuyển đổi 1/0 thành true/false
        categories.forEach(category => {
            category.status = category.status === 1;
            category.is_deleted = category.is_deleted === 1;
        });

        //Đếm tổng số danh mục
        const countSql = `select count(*) as total from category`
        const countResult = await dbQuery(countSql);
        const total = countResult[0]?.total || 0;
        // Trả về danh sách danh mục
        return {
            code: 200,
            status: "OK",
            message: "Lấy danh sách danh mục thành công",
            data: categories,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    async findCategoryByName(categoryName) {
        // Lấy danh mục theo id
        const sql = `SELECT * FROM category WHERE category_name like ?`;
        const categories = await dbQuery(sql, [`%${categoryName}%`]);
    
        // Kiểm tra nếu không tìm thấy danh mục hoặc category_id không khớp
        if (categories.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Danh mục không tồn tại"
            };
        }

        const formattedCategorys = categories.map(category => ({
            ...category,
            status: category.status === 1,
            is_deleted: category.is_deleted === 1,
        }))
    
        // Trả về thông tin danh mục
        return {
            code: 200,
            status: "OK",
            message: "Lấy thông tin danh mục thành công",
            data: formattedCategorys
        };
    }    
    
    async findCategoryById(categoryId) {
        // Lấy danh mục theo id
        const sql = `SELECT * FROM category WHERE category_id =?`;
        const categories = await dbQuery(sql, [categoryId]);
        // Kiểm tra nếu không tìm thấy danh mục hoặc category_id không khớp
        if (categories.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Danh mục không tồn tại"
            };
        }

        const formattedCategory = categories[0];
        formattedCategory.status = formattedCategory.status === 1;
        formattedCategory.is_deleted = formattedCategory.is_deleted === 1;
        // Trả về thông tin danh mục
        return {
            code: 200,
            status: "OK",
            message: "Lấy thông tin danh mục thành công",
            data: formattedCategory
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