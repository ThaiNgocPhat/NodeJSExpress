import shoppingCartService from "../services/shoppingCartService.js";
class ShoppingCartController {
    async getListCart(req, res) {
        try {
            const response = await shoppingCartService.getListCart(req.user); 
            res.status(response.code).json(response);
        } catch (error) {
            res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }

    async addToCart(req, res){
        try{
            const {productId, quantity} = req.body;
            const response = await shoppingCartService.addToCart(req.user, productId, quantity);
            return res.status(response.code).json(response);
        }catch (error){
            res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    async changeOrderQuantity(req, res){
        try{
            const {shoppingCartId, quantity} =  req.body;
            const response = await shoppingCartService.changeOrderQuantity(req.user, shoppingCartId, quantity)
            return res.status(response.code).json(response);
        }catch (error){
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    async deleteOneProduct(req, res) {
        try {
            const { shoppingCartId } = req.body;
            const response = await shoppingCartService.deleteOneProduct(req.user, shoppingCartId);
            return res.status(response.code).json(response);
        } catch (error) {
            console.error("❌ Lỗi khi xóa sản phẩm:", error);
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message || error
            });
        }
    }    

    async clearCart(req, res) {
        try {
            const user = req.user;
            const response = await shoppingCartService.clearCart(user);
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message || error
            });
        }
    }

    async checkOut(req, res) {
        try {
            const user = req.user; // Lấy user từ middleware verifyToken
            const request = req.body;
            const response = await shoppingCartService.checkout(user, request);
            return res.status(response.code).json(response);
        } catch (error) {
            console.error("❌ Lỗi khi đặt hàng:", error);
            return res.status(error.code || 500).json({
                code: error.code || 500,
                status: error.status || "SERVER_ERROR",
                message: error.message || "Lỗi Server"
            });
        }
    }    
}

export default new ShoppingCartController();