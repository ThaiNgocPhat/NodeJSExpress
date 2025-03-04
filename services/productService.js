import { sql } from "googleapis/build/src/apis/sql/index.js";
import { dbQuery } from "../config/queryAsync.js";
import {v4 as uuidv4} from "uuid";
import { ideahub } from "googleapis/build/src/apis/ideahub/index.js";
class ProductService {
    //MANAGER
    async addProduct(productData) {
        const { product_name, sku, description, unit_price, stock, category_id } = productData;
    
        // Kiểm tra danh mục có tồn tại không
        const categoryResult = await dbQuery(`select category_name from category where category_id = ?`, [category_id]);
        if (!categoryResult.length) {
            throw {
                code: 404,
                status: "NOT FOUND",
                message: "Danh mục không tồn tại"
            };
        }
        const category_name = categoryResult[0].category_name;
    
        // Kiểm tra sản phẩm đã tồn tại chưa
        const existingProductAndSKU = await dbQuery(`select * from products where product_name = ? and sku = ?`, [product_name, sku]);
        if (existingProductAndSKU.length > 0) {
            throw {
                code: 409,
                status: "CONFLICT",
                message: "Sản phẩm và mã SKU đã tồn tại"
            };
        }

        // Tạo id ngẫu nhiên
        const productId = uuidv4();
    
        // Thêm mới vào database
        const sql = `INSERT INTO products (product_id, product_name, sku, description, unit_price, stock, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await dbQuery(sql, [productId, product_name, sku, description, unit_price, stock, category_id]);
    
        // Lấy lại thông tin sản phẩm vừa thêm và thêm category_name
        const newProduct = await dbQuery(`select * FROM products where product_id = ?`, [productId]);
    
        // Thêm category_name vào response
        newProduct[0].category_name = category_name;
        delete newProduct[0].category_id; // Xóa category_id khỏi response nếu không cần thiết
    
        return {
            code: 201,
            status: "CREATED",
            message: "Thêm mới sản phẩm thành công",
            data: newProduct[0]
        };
    }    

    async updateProduct(productId, updateProduct){
        //Dữ liệu đầu vào
        const {product_name, sku, description, unit_price, stock, category_id} = updateProduct;
        //Kiểm tra sản phẩm có tồn tại không
        const existProduct = await dbQuery(`select * from products where product_id = ?`, [productId]);
        if(existProduct.length === 0){
            throw{
                code: 404,
                status: "NOT_FOUND",
                message: "Sản phẩm không tồn tại"
            }
        }

        //Cập nhật vào database
        const sql = `update products set product_name =?, sku =?, description =?, unit_price =?, stock =?, category_id =? where product_id =?`
        await dbQuery(sql, [product_name, sku, description, unit_price, stock, category_id, productId]);

        // Lấy lại thông tin sản phẩm vừa cập nhật
        const updatedProduct = await dbQuery(`select * FROM products where product_id =?`, [productId]);

        //Chuyển đổi 1/0 thành true/false
        const product = updatedProduct[0];
        product.status = product.status === 1;
        product.is_deleted = product.is_deleted === 1;

        return {
            code: 200,
            status: "OK",
            message: "Cập nhật sản phẩm thành công",
            data: product
        }
    }

    async changeStatusProduct(productId) {
        // Kiểm tra sản phẩm có tồn tại hay không
        const existingProduct = await dbQuery(`select * FROM products where product_id = ?`, [productId]);
        if (existingProduct.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Sản phẩm không tồn tại"
            };
        }
    
        // Lấy thông tin sản phẩm hiện tại
        const product = existingProduct[0];
        const newStatus = Boolean(product.status) ? 0 : 1; // Đảo trạng thái 1 <-> 0
    
        // Cập nhật trạng thái mới
        await dbQuery(`update products set status = ? where product_id = ?`, [newStatus, productId]);
    
        // Lấy lại thông tin sản phẩm sau khi cập nhật
        const updatedProduct = await dbQuery(`select * FROM products where product_id = ?`, [productId]);
    
        // Chuyển đổi status từ 1/0 → true/false
        const updatedProductData = updatedProduct[0];
        updatedProductData.status = updatedProductData.status === 1;
        updatedProductData.is_deleted = updatedProductData.is_deleted === 1;
        
        //Thông báo mở/khoá dựa vào trạng thái
        const message = updatedProductData.status ? "Sản phẩm đã bị khoá" : "Sản phẩm đã được mở"

        //Trả phản kết quả
        return {
            code: 200,
            status: "OK",
            message: message,
            data: updatedProduct[0]
        };
    }    

    async deleteProduct(productId){
        //Kiểm tra sản phẩm có tồn tại không
        const existingProduct = await dbQuery(`select * from products where product_id = ?`, [productId]);
        if(existingProduct.length == 0){
            throw{
                code: 404,
                status: "NOT_FOUND",
                message: "Sản phẩm không tồn tại"
            }
        }
        //Xoá sản phẩm
        const sql = `delete from products where product_id = ?`;
        await dbQuery(sql, [productId]);

        //Trả kết quả
        return {
            code: 200,
            status: "OK",
            message: "Xóa sản phẩm thành công"
        }
    }

    //ADMIN AND MANAGER
    async listProduct(page = 1, limit = 10, sortBy = "created_at", order = "DESC") {
        try {
            // Tính toán offset cho phân trang
            const offset = (page - 1) * limit;
    
            // Truy vấn danh sách sản phẩm với category_name
            const sql = `
                select 
                    p.product_id, p.product_name, p.sku, p.description, 
                    p.unit_price, p.stock, p.image, p.status, p.is_deleted, 
                    c.category_name, p.created_at, p.updated_at
                from products p
                left join category c on p.category_id = c.category_id
                order by ${sortBy} ${order}
                limit ? offset ?;
            `;
    
            const products = await dbQuery(sql, [limit, offset]);
    
            // Kiểm tra nếu không có sản phẩm nào
            if (!products || products.length === 0) {
                return {
                    code: 200,
                    status: "OK",
                    message: "Không có sản phẩm nào",
                    data: [],
                    pagination: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0
                    }
                };
            }
    
            // Đếm tổng số sản phẩm (không phân trang)
            const countSql = `select count(*) as total from products;`;
            const countResult = await dbQuery(countSql);
            const total = countResult[0]?.total || 0;
    
            return {
                code: 200,
                status: "OK",
                message: "Lấy danh sách sản phẩm thành công",
                data: products,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
    
        } catch (error) {
            return {
                code: 500,
                message: "Lỗi Server",
                error: error.message || "Lỗi không xác định"
            };
        }
    }    

    async getProductById(productId) {
        // Lấy sản phẩm theo id
        const sql = `select * from products where product_id =?`;
        const products = await dbQuery(sql, [productId]);
        // Kiểm tra nếu không tìm thấy danh mục hoặc category_id không khớp
        if (products.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Danh mục không tồn tại"
            };
        }

        const formattedProduct = products[0];
        formattedProduct.status = formattedProduct.status === 1;
        formattedProduct.is_deleted = formattedProduct.is_deleted === 1;
        // Trả về thông tin danh mục
        return {
            code: 200,
            status: "OK",
            message: "Lấy thông tin danh mục thành công",
            data: formattedProduct
        };
    }

    async getProductByName(productName) {
        // Lấy danh sách sản phẩm có tên chứa productName từ bảng products
        const sql = `select * from products where product_name LIKE ?`;
        const products = await dbQuery(sql, [`%${productName}%`]);
    
        // Kiểm tra nếu không có sản phẩm nào phù hợp
        if (products.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Không tìm thấy sản phẩm nào phù hợp"
            };
        }
    
        // Chuyển đổi status & is_deleted từ 1/0 → true/false
        const formattedProducts = products.map(product => ({
            ...product,
            status: product.status === 1,
            is_deleted: product.is_deleted === 1
        }));
    
        // Trả về danh sách sản phẩm tìm thấy
        return {
            code: 200,
            status: "OK",
            message: `Tìm thấy ${products.length} sản phẩm phù hợp`,
            data: formattedProducts
        };
    }    

    //PERMITALL

    async listProductPermitAll(page = 1, limit = 10, sortBy = "product_name", order = "ASC") {
        // Tính toán offset cho phân trang
        const offset = (page - 1) * limit;
    
        // Truy vấn danh sách sản phẩm với category_name, chỉ lấy các sản phẩm và danh mục có status = true
        const sql = `
            SELECT 
                p.product_id,
                p.product_name, 
                p.sku, 
                p.description, 
                p.unit_price, 
                p.stock, 
                p.image, 
                c.category_name 
            FROM products p
            JOIN category c ON p.category_id = c.category_id
            WHERE p.status = 1 AND c.status = 1
            ORDER BY ${sortBy} ${order} 
            LIMIT ? OFFSET ?;
        `;
    
        const products = await dbQuery(sql, [limit, offset]);
    
        // Đếm tổng số sản phẩm thỏa mãn điều kiện (không phân trang)
        const countSql = `
            SELECT COUNT(*) AS total FROM products p
            JOIN category c ON p.category_id = c.category_id
            WHERE p.status = 1 AND c.status = 1;
        `;
        const totalCount = await dbQuery(countSql);
        
        return {
            code: 200,
            status: "OK",
            message: "Lấy danh sách sản phẩm thành công",
            data: products,
            pagination: {
                total: totalCount[0].total,  
                page: page,                  
                limit: limit,                
                totalPages: Math.ceil(totalCount[0].total / limit)
            }
        };
    }    

    async searchProductPermitAll(productName){
        // Truy vấn danh sách sản phẩm kèm category_name từ bảng category
        const sql = `
            select 
                p.product_name, 
                p.sku, 
                p.description, 
                p.unit_price, 
                p.stock, 
                p.image, 
                c.category_name 
            from products p
            join category c on p.category_id = c.category_id
            where p.product_name like ?
        `;

        const products = await dbQuery(sql, [`%${productName}%`]);
        //Nếu không tìm thấy thì nhảy ra lỗi
        if(products.length === 0){
            throw{
                code: 404,
                status: "NOT_FOUND",
                message: "Không tìm thấy sản phẩm nào phù hợp"
            }
        }

        //Trả kết quả
        return{
            code: 200,
            status: "OK",
            data: products
        }
    }

    async newProductPermitAll() {
        //Sản phẩm có thời gian mới nhất
        const sql = `
            SELECT 
                p.product_name, 
                p.sku, 
                p.description, 
                p.unit_price, 
                p.stock, 
                p.image, 
                c.category_name
            FROM products p
            JOIN category c ON p.category_id = c.category_id
            ORDER BY p.create_at DESC
            LIMIT 5
        `;

        const product = await dbQuery(sql);
        //Nếu không tìm thấy thì nhảy ra l��i
        if(product.length === 0){
            throw{
                code: 404,
                status: "NOT_FOUND",
                message: "Không tìm thấy sản phẩm nào"
            }
        }

        //Trả kết quả
        return{
            code: 200,
            status: "OK",
            data: product
        }
    }

    async getProductsByCategoryIdPermitAll(categoryId) {
        // Truy vấn danh mục để lấy category_name
        const categoryQuery = `SELECT category_name FROM category WHERE category_id = ?`;
        const categoryResult = await dbQuery(categoryQuery, [categoryId]);
    
        if (categoryResult.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: `Không tìm thấy danh mục với ID ${categoryId}`
            };
        }
    
        const categoryName = categoryResult[0].category_name;
    
        // Truy vấn danh sách sản phẩm theo category_id
        const sql = `
            SELECT 
                p.product_id,
                p.product_name, 
                p.sku, 
                p.description, 
                p.unit_price, 
                p.stock, 
                p.image, 
                c.category_name 
            FROM products p
            JOIN category c ON p.category_id = c.category_id
            WHERE p.category_id = ?
        `;
    
        const products = await dbQuery(sql, [categoryId]);
    
        // Nếu không tìm thấy sản phẩm nào, trả về lỗi
        if (products.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: `Không tìm thấy sản phẩm nào thuộc danh mục '${categoryName}'`
            };
        }
    
        // Trả kết quả với message chứa category_name
        return {
            code: 200,
            status: "OK",
            message: `Lấy danh sách sản phẩm thuộc danh mục '${categoryName}' thành công`,
            data: products
        };
    }
    
    async getProductByIdPermitAll(productId) {
        // Truy vấn danh mục để lấy category_name
        const sql = `
            SELECT 
                p.product_id,
                p.product_name, 
                p.sku, 
                p.description, 
                p.unit_price, 
                p.stock, 
                p.image, 
                c.category_name 
            FROM products p
            JOIN category c ON p.category_id = c.category_id
            WHERE p.product_id =?
        `;

        const product = await dbQuery(sql, [productId]);
        // Nếu không tìm thấy sản phẩm nào, trả về lỗi
        if (product.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: `Không tìm thấy sản phẩm với ID ${productId}`
            };
        }
        
        //Trả kết quả
        return {
            code: 200,
            status: "OK",
            data: product[0]
        }
    }
}

export default new ProductService();