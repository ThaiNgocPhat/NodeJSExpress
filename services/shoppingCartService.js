import { dbQuery } from "../config/queryAsync.js";
import db from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';
class ShoppingCartService {
    async getListCart(user) {
        // Lấy giỏ hàng của người dùng
        const carts = await dbQuery(
            `SELECT 
                sc.shopping_cart_id, sc.order_quantity, sc.total_price, 
                p.product_name, p.unit_price, p.image 
            FROM shopping_cart sc
            JOIN products p ON sc.product_id = p.product_id
            WHERE sc.user_id = ?`, 
            [user.user_id]
        );

        if (carts.length === 0) {
            return {
                code: 200,
                message: "Giỏ hàng trống",
                data: []
            };
        }

        return {
            code: 200,
            message: "Lấy danh sách giỏ hàng thành công",
            data: carts
        };
    }

    async addToCart(user, productId, quantity) {
        if (!user || !user.user_id) {
            throw {
                code: 401,
                status: "UNAUTHORIZED",
                message: "Người dùng chưa đăng nhập hoặc token không hợp lệ"
            };
        }

        // Lấy thông tin sản phẩm
        const existingProduct = await dbQuery(
            `SELECT * FROM products WHERE product_id = ?`, 
            [productId]
        );

        if (existingProduct.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Sản phẩm không tồn tại"
            };
        }

        const product = existingProduct[0];

        // Kiểm tra số lượng tồn kho
        if (product.stock < quantity) {
            throw {
                code: 400,
                status: "BAD_REQUEST",
                message: `Số lượng sản phẩm trong kho không đủ. Hiện còn ${product.stock} sản phẩm`
            };
        }

        // Tính tổng tiền
        const totalPrice = product.unit_price * quantity;

        // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
        const existingCartItem = await dbQuery(
            `SELECT * FROM shopping_cart WHERE user_id = ? AND product_id = ?`, 
            [user.user_id, productId]
        );

        if (existingCartItem.length > 0) {
            // Nếu đã có trong giỏ hàng, cập nhật số lượng + tổng tiền mới
            const newQuantity = existingCartItem[0].order_quantity + quantity;
            const newTotalPrice = newQuantity * product.unit_price;

            await dbQuery(
                `UPDATE shopping_cart 
                 SET order_quantity = ?, total_price = ? 
                 WHERE user_id = ? AND product_id = ?`, 
                [newQuantity, newTotalPrice, user.user_id, productId]
            );
        } else {
            const cartId = uuidv4();
            await dbQuery(
                `INSERT INTO shopping_cart (shopping_cart_id, user_id, product_id, order_quantity, total_price) 
                 VALUES (?, ?, ?, ?, ?)`, 
                [cartId, user.user_id, productId, quantity, totalPrice]
            );
        }

        return {
            code: 201,
            status: "CREATED",
            message: "Thêm sản phẩm vào giỏ hàng thành công",
            data: {
                product_name: product.product_name,
                order_quantity: quantity,
                unit_price: product.unit_price,
                total_price: totalPrice
            }
        };
    }

    async changeOrderQuantity(user, shoppingCartId, quantity) {
        // Kiểm tra sản phẩm có trong giỏ hàng hay không
        const existingItem = await dbQuery(
            `SELECT * FROM shopping_cart WHERE shopping_cart_id = ?`, 
            [shoppingCartId]
        );
    
        if (existingItem.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Không tìm thấy sản phẩm phù hợp"
            };
        }
    
        // Lấy thông tin sản phẩm để kiểm tra tồn kho
        const product = await dbQuery(
            `SELECT stock, unit_price FROM products WHERE product_id = ?`, 
            [existingItem[0].product_id]
        );
    
        if (product.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Không tìm thấy sản phẩm"
            };
        }
    
        // Kiểm tra tồn kho
        if (quantity > product[0].stock) {
            throw {
                code: 400,
                status: "BAD_REQUEST",
                message: `Không đủ số lượng trong kho, hiện còn ${product[0].stock} sản phẩm`
            };
        }
    
        // Tính tổng tiền mới
        const totalPrice = product[0].unit_price * quantity;
    
        // Cập nhật giỏ hàng
        await dbQuery(
            `UPDATE shopping_cart 
             SET order_quantity = ?, total_price = ? 
             WHERE shopping_cart_id = ? AND user_id = ?`, 
            [quantity, totalPrice, shoppingCartId, user.user_id]
        );
    
        return {
            code: 200,
            status: "OK",
            message: "Cập nhật số lượng sản phẩm trong giỏ hàng thành công",
            data: {
                shopping_cart_id: shoppingCartId,
                order_quantity: quantity,
                total_price: totalPrice
            }
        };
    }    

    async deleteOneProduct(user, shoppingCartId) {
        try {
            // Kiểm tra tham số hợp lệ
            if (!shoppingCartId) {
                return {
                    code: 400,
                    status: "BAD_REQUEST",
                    message: "Thiếu shoppingCartId"
                };
            }
    
            if (!user || !user.user_id) {
                return {
                    code: 401,
                    status: "UNAUTHORIZED",
                    message: "Unauthorized - Không tìm thấy user"
                };
            }

            const existingItem = await dbQuery(
                `SELECT * FROM shopping_cart WHERE shopping_cart_id = ? AND user_id = ?`, 
                [shoppingCartId, user.user_id]
            );
    
            // Nếu không tìm thấy sản phẩm, trả về lỗi 404
            if (existingItem.length === 0) {
                return {
                    code: 404,
                    status: "NOT_FOUND",
                    message: "Không tìm thấy sản phẩm phù hợp hoặc đã bị xóa trước đó"
                };
            }
    
            const { product_id, order_quantity } = existingItem[0];
    
            // Cập nhật lại stock trong bảng products
            await dbQuery(
                `UPDATE products SET stock = stock + ? WHERE product_id = ?`,
                [order_quantity, product_id]
            );
    
            // Xoá sản phẩm khỏi giỏ hàng
            await dbQuery(
                `DELETE FROM shopping_cart WHERE shopping_cart_id = ? AND user_id = ?`, 
                [shoppingCartId, user.user_id]
            );
    
            return {
                code: 200,
                status: "OK",
                message: "Xóa sản phẩm khỏi giỏ hàng thành công",
                data: {
                    shopping_cart_id: shoppingCartId,
                    restored_stock: order_quantity
                }
            };
        } catch (error) {
            return {
                code: 500,
                status: "SERVER_ERROR",
                message: "Lỗi Server",
                error: error.message || error
            };
        }
    }    

    async clearCart(user){
        // Lấy danh sách tất cả sản phẩm trong giỏ hàng của user
        const cartItems = await dbQuery(
            `SELECT product_id, order_quantity FROM shopping_cart WHERE user_id = ?`, 
            [user.user_id]
        );

        // Nếu giỏ hàng trống, trả về lỗi 404
        if (cartItems.length === 0) {
            return {
                code: 404,
                status: "NOT_FOUND",
                message: "Giỏ hàng trống, không có gì để xóa"
            };
        }

        // Cập nhật lại stock trong bảng products
        for (const item of cartItems) {
            await dbQuery(
                `UPDATE products SET stock = stock + ? WHERE product_id = ?`,
                [item.order_quantity, item.product_id]
            );
        }

        // Xóa toàn bộ giỏ hàng của user
        await dbQuery(`DELETE FROM shopping_cart WHERE user_id = ?`, [user.user_id]);

        return {
            code: 200,
            status: "OK",
            message: "Xóa toàn bộ giỏ hàng thành công"
        };
    }

    async checkout(user, request) {
        try {
            console.log("📌 Bắt đầu đặt hàng:", { user_id: user?.user_id });

            if (!user || !user.user_id) {
                throw {
                    code: 401,
                    status: "UNAUTHORIZED",
                    message: "Unauthorized - Không tìm thấy user"
                };
            }

            // 1️⃣ Lấy giỏ hàng của người dùng
            const cartItems = await dbQuery(
                `SELECT sc.product_id, sc.order_quantity, sc.total_price, 
                        p.product_name, p.unit_price, p.stock 
                FROM shopping_cart sc 
                JOIN products p ON sc.product_id = p.product_id 
                WHERE sc.user_id = ?`,
                [user.user_id]
            );

            if (cartItems.length === 0) {
                throw {
                    code: 404,
                    status: "NOT_FOUND",
                    message: "Giỏ hàng trống, không thể thanh toán"
                };
            }

            console.log("🔍 Sản phẩm trong giỏ hàng:", cartItems);

            // 2️⃣ Kiểm tra tồn kho
            for (const item of cartItems) {
                if (item.stock < item.order_quantity) {
                    throw {
                        code: 400,
                        status: "BAD_REQUEST",
                        message: `Sản phẩm ${item.name} không đủ hàng trong kho`
                    };
                }
            }

            console.log("✅ Tất cả sản phẩm đủ hàng");

            // 3️⃣ Tính tổng giá trị đơn hàng
            const totalPrice = parseFloat(
                cartItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0).toFixed(2)
            );            

            // 4️⃣ Tạo mã đơn hàng (serial number)
            const serialNumber = uuidv4();

            // 5️⃣ Lưu đơn hàng vào bảng `orders`
            const orderId = uuidv4();
            await dbQuery(
                `INSERT INTO orders (order_id, serial_number, total_price, status, note, receive_name, receive_phone, receive_address, created_at, user_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [orderId, serialNumber, totalPrice, "WAITING", request.note, request.receiveName, request.receivePhone, request.receiveAddress, user.user_id]
            );

            console.log("📝 Đã tạo đơn hàng:", orderId);

            // 6️⃣ Thêm chi tiết đơn hàng vào bảng `order_details`
            let orderDetailsDtos = [];
            for (const item of cartItems) {
                const orderDetailsId = uuidv4();
                await dbQuery(
                    `INSERT INTO order_details (order_details_id, name, unit_price, quantity, total_price, product_id, order_id, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [orderDetailsId, item.product_name, item.unit_price, item.order_quantity, item.total_price, item.product_id, orderId]
                );                

                // Giảm số lượng sản phẩm trong kho
                await dbQuery(
                    `UPDATE products SET stock = stock - ? WHERE product_id = ?`,
                    [item.order_quantity, item.product_id]
                );

                // Thêm chi tiết đơn hàng vào danh sách phản hồi
                orderDetailsDtos.push({
                    product_name: item.product_name,
                    quantity: item.order_quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price
                });

            }

            console.log("📦 Đã thêm chi tiết đơn hàng");

            // 7️⃣ Xóa giỏ hàng
            await dbQuery(`DELETE FROM shopping_cart WHERE user_id = ?`, [user.user_id]);
            console.log("🗑️ Đã xóa giỏ hàng");

            // 8️⃣ Tạo phản hồi đơn hàng
            return {
                code: 201,
                status: "CREATED",
                message: "Đặt hàng thành công",
                data: {
                    serial_number: serialNumber,
                    total_price: totalPrice,
                    status: "WAITING",
                    note: request.note,
                    receive_name: request.receiveName,
                    receive_phone: request.receivePhone,
                    receive_address: request.receiveAddress,
                    order_details: orderDetailsDtos
                }
            };
        } catch (error) {
            console.error("❌ Lỗi khi đặt hàng:", error);
            throw {
                code: error.code || 500,
                status: error.status || "SERVER_ERROR",
                message: error.message || "Lỗi Server"
            };
        }
    }
}

export default new ShoppingCartService();