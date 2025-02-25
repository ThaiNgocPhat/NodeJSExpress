import { dbQuery } from "../config/queryAsync.js";
import path from "path";
import {v4 as uuidv4} from "uuid";
import { uploadFileToDrive } from "../config/googleDrive.js";
class ProductService {
    //MANAGER
    addProduct = async (req, res) => {
        try  {
            console.log("Request body:", req.body); // Kiểm tra dữ liệu từ formData
            console.log("File:", req.file); 
            // Nếu dùng Joi để validate
            // await productSchema.validateAsync(req.body, { abortEarly: false });
            const { product_name, sku, description, unit_price, stock } = req.body;
            const image = req.file;

            if (!product_name || !sku || !unit_price || !stock) {
                throw {
                    code: 400,
                    status: "BAD_REQUEST",
                    message: "Thiếu thông tin sản phẩm bắt buộc"
                };
            }

            let imageUrl = "URL_ẢNH_MẶC_ĐỊNH";
            if (image) {
                const filePath = path.join(__dirname, 'uploads', image.filename);
                const folderId = '11f8uG-CvAUssefujtcKrYJ-kQVriODcN'; // Thay bằng folder ID thực tế

                // Upload lên Google Drive
                imageUrl = await uploadFileToDrive(filePath, folderId);

                // Xóa file tạm sau khi upload
                fs.unlink(filePath, (err) => {
                    if (err) console.error("Error deleting temp file:", err);
                });
            }

            const productId = uuidv4();
            const sql = `INSERT INTO product (product_id, product_name, sku, description, unit_price, stock, image) VALUES (?,?,?,?,?,?,?)`;
            await dbQuery(sql, [productId, product_name, sku, description, unit_price, stock, imageUrl]);

            return res.status(201).json({
                code: 201,
                status: "CREATED",
                message: "Sản phẩm đã được thêm thành công",
                data: { product_name, sku, description, unit_price, stock, imageUrl }
            });
        } catch (error) {
            console.error("Error in addProduct:", error);
            if (error.code) {
                return res.status(error.code).json({
                    code: error.code,
                    status: error.status,
                    message: error.message
                });
            }
            return res.status(500).json({
                code: 500,
                status: "INTERNAL_SERVER_ERROR",
                message: "Lỗi máy chủ nội bộ: " + error.message
            });
        }
    };
}

export default new ProductService();