import orderService from "../services/orderService.js";
class OrderController {
    async ordersHistory(req, res) {
        try{
            const user = req.user;
            const response = await orderService.orderHistory(user);
            return res.status(response.code).json(response);
        }catch (error){
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    async getOrderBySerialNumber(req, res){
        try{
            const user = req.user;
            const {serialNumber} = req.body;
            const response = await orderService.getOrderBySerialNumber(user, serialNumber);
            return res.status(response.code).json(response);
        }catch (error){
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    async getOrderByStatus(req, res) {
        try {
            const user = req.user;
            const { orderStatus } = req.body;
            const response = await orderService.getOrderByStatus(user, orderStatus);
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }

    async cancelOrder(req, res){
        try {
            const user = req.user;
            const { orderId } = req.body;
            const response = await orderService.cancelOrder(user, orderId);
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }

    //ADMIN AND MANAGER
    async getListOrder(req, res){
        try {
            const response = await orderService.getListOrder();
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }
    
    async getStatusForOrder(req, res) {
        try {
            const { orderStatus } = req.params;
            const response = await orderService.getStatusForOrder(orderStatus);
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }    

    async getOrderById(req, res){
        try {
            const { orderId } = req.params;
            const response = await orderService.getOrderById(orderId);
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }

    async changeStatusForOrder(req, res){
        try {
            const { orderId } = req.params;
            const {orderStatus} = req.body;
            const response = await orderService.changeStatusForOrder(orderId, orderStatus);
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }
}

export default new OrderController();