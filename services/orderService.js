import { ideahub } from 'googleapis/build/src/apis/ideahub/index.js';
import { dbQuery } from '../config/queryAsync.js';
class OrderService {
    //USER
    async orderHistory(user){
        //Lấy danh sách đặt hàng của người dùng
        const orders = await dbQuery(`select * from orders where user_id = ?`, [user.user_id]);

        //Kiểm tra lịch sử mua hàng có trống hay không
        if(orders.length === 0){
            return{
                code: 200,
                status: "OK",
                message: "Không có đơn hàng nào",
                data: []
            }
        }

        //Chuyển đổi đơn hàng nếu đã được chấp thuận đơn hàng và chưa chấp thuận đơn hàng
        const ordersDto = orders.map(order => ({
            order_id: order.order_id,
            serial_number: order.serial_number,
            total_price: order.total_price,
            status: order.status,
            note: order.note,
            receive_name: order.receive_name,
            receive_phone: order.receive_phone,
            receive_address: order.receive_address,
            created_at: order.created_at,
            updated_at: order.updated_at,
            confirmed_at: order.status === "CANCEL" ? null : order.confirmed_at
        }));
        // Trả về kết quả
        return {
            code: 200,
            status: "OK",
            data: ordersDto
        };
    }

    async getOrderBySerialNumber(user, serialNumber){
        //Lấy dữ liệu
        const serial = await dbQuery(`select order_id, serial_number, total_price, status, note, receive_name, receive_phone, 
            receive_address, created_at, updated_at, confirmed_at from orders where user_id = ? and serial_number = ?`, [user.user_id, serialNumber]);

        //Kiểm tra số serial_number
        if(serial.length === 0){
            throw{
                code: 404,
                status: "NOT_FOUND",
                message: "Serial number không phù hợp"
            }
        }

        //Trả về
        return{
            code: 200,
            status: "OK",
            data: serial[0]
        }
    }

    async getOrderByStatus(user, orderStatus){
        //Chuyển dữ liệu sang chữ hoa cho nhất quán với database
        const orderStatusUpper = orderStatus.toUpperCase();

        //Danh sách trạng thái
        const validStatuses = ["WAITING", "CONFIRM", "DELIVERY", "SUCCESS", "CANCEL", "DENIED"];

        //Kiểm tra trạng thái đoen hàng có hợp lệ không
        if(!validStatuses.includes(orderStatusUpper)){
            return{
                code: 400,
                status: "BAD_REQUEST",
                message: "Trạng thái đoen hàng không hợp lệ"
            }
        }

        //Nếu trạng thái là CANCEL, kiểm tra các điều kiện
        if(orderStatusUpper === "CANCEL"){
            //Lấy tất cả các đơn hàng của user
            const allOrders = await dbQuery(`select status from orders where user_id = ?`, [user.user_id]);

            //Kiểm có đơn hàng không được phép huỷ
            const hasInvalidOrders = allOrders.some(order =>
                ["CONFIRM", "DELIVERY", "SUCCESS"].includes(order.status)
            );
    
            if (hasInvalidOrders) {
                return {
                    code: 400,
                    status: "BAD_REQUEST",
                    message: "Không thể hủy các đơn hàng đã được chấp nhận, đang giao, hoặc đã hoàn tất."
                };
            }
        }
        
        //Lấy danh sách đơn hàng theo trạng thái
        const orders = await dbQuery(`select * from orders where user_id = ? and upper(status) = ?`, [user.user_id, orderStatusUpper])

        // Nếu không có đơn hàng nào, trả về thông báo thay vì danh sách rỗng
        if (orders.length === 0) {
            return {
                code: 200,
                status: "OK",
                message: `Không có đơn hàng nào với trạng thái: ${orderStatusUpper}`
            };
        }

        //Trả về
        return {
            code: 200,
            status: "OK",
            data: orders
        };
    }

    async cancelOrder(user, orderId){
        //Kiểm tra đoen hàng có tồn tại hay không
        const existingOrder = await dbQuery(`select * from orders where user_id = ? and order_id = ?`, [user.user_id, orderId]);

        if(existingOrder.length === 0){
            throw{
                code: 400,
                status: "BAD_REQUEST",
                message: "Đơn hàng không phù hợp"
            }
        }

        const orderStatus = existingOrder[0].status;

        //Nếu đơn hàng đã bị huỷ mà huỷ thêm lần nữa
        if(orderStatus === "CANCEL"){
            return{
                code: 200,
                status: "OK",
                message: "Đơn hàng đã bị huỷ rồi"
            }
        }

        //Kiểm tra trạng thái đơn hàng có thể huỷ không
        if (orderStatus !== "WAITING") {
            return {
                code: 400,
                status: "BAD_REQUEST",
                message: "Đơn hàng không thể hủy vì đã được chấp nhận hoặc xử lý"
            };
        }

        //Cập nhật trạng thái
        await dbQuery(`update orders set status = 'CANCEL' where order_id = ?`, [orderId]);

        //Trả về
        return{
            code: 200,
            status: "OK",
            message: "Huỷ đơn hàng thành công"
        }
    }

    //ADMIN AND MANAGER
    async getListOrder() {
        // Truy xuất danh sách đơn hàng cùng với thông tin khách hàng
        const sql = await dbQuery(`
            select 
                o.order_id, 
                o.total_price,
                o.status,
                o.note,
                o.receive_name,
                o.receive_address,
                o.receive_phone,
                o.created_at,
                u.user_name as customer_username
            from orders o
            left join users u on o.user_id = u.user_id
            order by o.created_at desc
        `);

        // Chuyển đổi dữ liệu để trả về đúng định dạng
        const orderDtos = sql.map(order => ({
            orderId: order.order_id,
            totalPrice: order.total_price,
            status: order.status,
            note: order.note,
            receiveName: order.receive_name,
            receiveAddress: order.receive_address,
            receivePhone: order.receive_phone,
            createdAt: order.created_at,
            username: order.customer_username || null
        }));

    
        // Trả về kết quả
        return {
            code: 200,
            status: "OK",
            data: orderDtos
        };
    }    

    async getStatusForOrder(orderStatus) {
        // Chuyển dữ liệu sang chữ hoa để nhất quán với database
        const orderStatusUpper = orderStatus.toUpperCase();
    
        // Danh sách trạng thái hợp lệ
        const validStatuses = ["WAITING", "CONFIRM", "DELIVERY", "SUCCESS", "CANCEL", "DENIED"];
    
        // Kiểm tra trạng thái đơn hàng có hợp lệ không
        if (!validStatuses.includes(orderStatusUpper)) {
            return {
                code: 400,
                status: "BAD_REQUEST",
                message: "Trạng thái đơn hàng không hợp lệ"
            };
        }
    
        // Truy vấn danh sách đơn hàng có trạng thái tương ứng
        const orders = await dbQuery(`
            select 
                o.order_id, 
                o.total_price,
                o.status,
                o.note,
                o.receive_name,
                o.receive_address,
                o.receive_phone,
                o.created_at,
                u.user_name as customer_username
            from orders o
            left join users u on o.user_id = u.user_id
            where o.status = ?
            order by o.created_at desc
        `, [orderStatusUpper]);
    
        // Kiểm tra nếu không có đơn hàng nào
        if (orders.length === 0) {
            return {
                code: 404,
                status: "NOT_FOUND",
                message: "Không có đơn hàng nào với trạng thái này"
            };
        }
    
        // Chuyển đổi danh sách đơn hàng sang định dạng mong muốn
        const orderDtos = orders.map(order => ({
            orderId: order.order_id,
            totalPrice: order.total_price,
            status: order.status,
            note: order.note,
            receiveName: order.receive_name,
            receiveAddress: order.receive_address,
            receivePhone: order.receive_phone,
            createdAt: order.created_at,
            username: order.customer_username || null
        }));
    
        // Trả về danh sách đơn hàng theo trạng thái
        return {
            code: 200,
            status: "OK",
            data: orderDtos
        };
    }  
    
    async getOrderById(orderId){
        // Truy vấn danh sách đơn hàng có trạng thái tương ứng
        const orders = await dbQuery(`
            select 
                o.order_id, 
                o.total_price,
                o.status,
                o.note,
                o.receive_name,
                o.receive_address,
                o.receive_phone,
                o.created_at,
                u.user_name as customer_username
            from orders o
            left join users u on o.user_id = u.user_id
            where o.order_id = ?
        `, [orderId]);
    
        // Kiểm tra nếu không có đơn hàng nào
        if (orders.length === 0) {
            return {
                code: 404,
                status: "NOT_FOUND",
                message: "Không có đơn hàng nào phù hợp"
            };
        }
    
        // Chuyển đổi danh sách đơn hàng sang định dạng mong muốn
        const orderDtos = orders.map(order => ({
            orderId: order.order_id,
            totalPrice: order.total_price,
            status: order.status,
            note: order.note,
            receiveName: order.receive_name,
            receiveAddress: order.receive_address,
            receivePhone: order.receive_phone,
            createdAt: order.created_at,
            username: order.customer_username || null
        }));
    
        // Trả về danh sách đơn hàng theo trạng thái
        return {
            code: 200,
            status: "OK",
            data: orderDtos
        };
    }

    //MANAGER
    async changeStatusForOrder(orderId, orderStatus) {
        // Chuyển trạng thái sang chữ hoa để nhất quán với database
        const orderStatusUpper = orderStatus.toUpperCase();
    
        // Danh sách trạng thái hợp lệ
        const validStatuses = ["WAITING", "CONFIRM", "DELIVERY", "SUCCESS", "CANCEL", "DENIED"];
    
        // Kiểm tra trạng thái có hợp lệ không
        if (!validStatuses.includes(orderStatusUpper)) {
            return {
                code: 400,
                status: "BAD_REQUEST",
                message: "Trạng thái đơn hàng không hợp lệ"
            };
        }
    
        // Tìm đơn hàng theo orderId
        const existingOrder = await dbQuery(`select * from orders where order_id = ?`, [orderId]);
    
        if (existingOrder.length === 0) {
            return {
                code: 404,
                status: "NOT_FOUND",
                message: "Đơn hàng không tồn tại"
            };
        }
    
        const order = existingOrder[0];
    
        // Không thể thay đổi trạng thái của đơn hàng đã bị hủy
        if (order.status === "CANCEL") {
            return {
                code: 400,
                status: "BAD_REQUEST",
                message: "Không thể thay đổi trạng thái của đơn hàng đã bị hủy."
            };
        }
    
        // Không thể thay đổi trạng thái về mức thấp hơn trạng thái hiện tại
        const currentStatusIndex = validStatuses.indexOf(order.status);
        const newStatusIndex = validStatuses.indexOf(orderStatusUpper);
    
        if (newStatusIndex < currentStatusIndex) {
            return {
                code: 400,
                status: "BAD_REQUEST",
                message: "Không thể thay đổi trạng thái về mức thấp hơn trạng thái hiện tại."
            };
        }
    
        let confirmedAt = order.confirmed_at;
        let receivedAt = order.received_at;
    
        // Nếu trạng thái mới là CONFIRM, cập nhật thời gian xác nhận
        if (orderStatusUpper === "CONFIRM" && order.status !== "CONFIRM") {
            confirmedAt = new Date();
            receivedAt = new Date();
            receivedAt.setDate(receivedAt.getDate() + 4); // Dự đoán ngày giao hàng
        } else if (orderStatusUpper === "WAITING" || orderStatusUpper === "CANCEL") {
            receivedAt = null; // Xóa ngày giao hàng nếu quay lại trạng thái WAITING hoặc CANCEL
        }
    
        // Nếu trạng thái mới là CONFIRM, cập nhật số lượng sản phẩm đã bán
        if (orderStatusUpper === "CONFIRM" && order.status !== "CONFIRM") {
            const orderDetails = await dbQuery(`select * from order_details where order_id = ?`, [orderId]);
    
            for (const details of orderDetails) {
                await dbQuery(
                    `update products set sold_count = sold_count + ? where product_id = ?`,
                    [details.quantity, details.product_id]
                );
            }
        }
    
        // Cập nhật trạng thái đơn hàng
        await dbQuery(
            `update orders set status = ?, confirmed_at = ?, received_at = ? where order_id = ?`,
            [orderStatusUpper, confirmedAt, receivedAt, orderId]
        );
    
        // Lấy thông tin đơn hàng sau khi cập nhật
        const updatedOrder = await dbQuery(`
            select 
                o.order_id, 
                o.serial_number,
                o.total_price,
                o.status,
                o.receive_name,
                o.receive_phone,
                o.receive_address,
                o.created_at,
                o.received_at
            from orders o
            where o.order_id = ?
        `, [orderId]);
    
        return {
            code: 200,
            status: "OK",
            message: "Cập nhật trạng thái đơn hàng thành công",
            data: updatedOrder[0]
        };
    }    
}

export default new OrderService();