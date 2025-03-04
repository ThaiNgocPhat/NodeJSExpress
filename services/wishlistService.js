import { dbQuery } from "../config/queryAsync.js";
import { v4 as uuidv4} from 'uuid' 


class WishlistService {
    async listWishlist(user){
        //Lấy dữ liệu từ database
        const wishlistes = await dbQuery(`select 
                        w.wishlist_id, 
                        p.product_id, 
                        p.product_name, 
                        p.sku, 
                        p.description, 
                        p.unit_price,
                        p.stock, 
                        p.image, 
                        c.category_name 
                    from wishlist w 
                    join products p on w.product_id = p.product_id
                    left join category c on p.category_id = c.category_id
                    where w.user_id = ?`, [user.user_id]);
        
        //Kiểm tra danh sách có rỗng hay không
        if(wishlistes.length === 0){
            throw{
                code: 404,
                status: "NOT_FOUND",
                message: "Người dùng chưa có sản phẩm yêu thích nào"
            }
        }

        //Trả về
        return {
            code: 200,
            status: "OK",
            data: wishlistes
        }
    }

    async addWishlist(user, productId){
        // Kiểm tra sản phẩm đã có trong wishlist của user chưa
        const existingWishlist = await dbQuery(
            `select * from wishlist where user_id = ? and product_id = ?`, 
            [user.user_id, productId]
        );
        
        if (existingWishlist.length > 0) {
            throw {
                code: 409,
                status: "CONFLICT",
                message: "Sản phẩm đã có trong danh sách yêu thích"
            };
        }

        //Kiểm tra productId có tồn tại hay không
        const existingProduct = await dbQuery(`select * from products where product_id = ?`, [productId]);

        if (existingProduct.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Sản phẩm không tồn tại"
            };
        }

        //Tạo id ngẫu nhiên
        const wishlistId = uuidv4();

        //Thêm mới sản phảm yêu thích
        await dbQuery(`insert into wishlist (wishlist_id, user_id, product_id) value (?, ?, ?)`,
            [wishlistId, user.user_id, productId]
        )

        //Lấy lại thông tin vừa thêm mới
        const newWishlist = await dbQuery(`select 
                                    w.wishlist_id, 
                                    p.product_id, 
                                    p.product_name, 
                                    p.sku, 
                                    p.description, 
                                    p.unit_price,
                                    p.stock, 
                                    p.image, 
                                    c.category_name 
                                    from wishlist w 
                                    join products p on w.product_id = p.product_id
                                    left join category c on p.category_id = c.category_id
                                    where w.wishlist_id = ?`, [wishlistId]);

            return{
                code: 201,
                status: "CREATED",
                message: "Sản phẩm được thêm vào yêu thích",
                data: newWishlist[0]
            }
    }

    async deleteWishlist(user, wishlistId) {
        // Kiểm tra xem wishlist có tồn tại không
        const existingWishlist = await dbQuery(
            `select * from wishlist where wishlist_id = ? and user_id = ?`, 
            [wishlistId, user.user_id]
        );
    
        if (existingWishlist.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Sản phẩm yêu thích không tồn tại"
            };
        }
    
        // Thực hiện xóa
        await dbQuery(`delete from wishlist where wishlist_id = ? and user_id = ?`, [wishlistId, user.user_id]);
    
        return {
            code: 200,
            status: "OK",
            message: "Sản phẩm đã được xóa khỏi danh sách yêu thích"
        };
    }    
}

export default new WishlistService();