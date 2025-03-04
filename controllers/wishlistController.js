import wishlistService from "../services/wishlistService.js";
class WishlistController {
    async listWishlist(req, res){
        try{
            const user = req.user;
            const response = await wishlistService.listWishlist(user);
            return res.status(response.code).json(response);
        }catch (error){
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    async addWishlist(req, res){
        try{
            const user = req.user;
            const {productId} = req.body;
            const response = await wishlistService.addWishlist(user, productId);
            return res.status(response.code).json(response);
        }catch (error){
            const statusCode = error.code || 500;
            return res.status(statusCode).json({
                code: statusCode,
                message: error.message || "Lỗi Server"
            });
        }
    }

    async deleteWishlist(req, res) {
        try {
            const user = req.user;
            const { wishlistId } = req.params;
            const response = await wishlistService.deleteWishlist(user, wishlistId);
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(error.code || 500).json({
                code: error.code || 500,
                message: error.message || "Lỗi Server"
            });
        }
    }
    
}

export default new WishlistController();