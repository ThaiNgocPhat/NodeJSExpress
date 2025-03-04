import addressService from "../services/addressService.js";
class AddressController {

    async listAddress(req, res){
        try{
            const user = req.user;
            const response = await addressService.listAddress(user);
            return res.status(response.code).json(response);
        }catch (error){
            res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    async addAddress(req, res){
        try{
            const user = req.user;
            const response = await addressService.addAddress(user, req.body);
            return res.status(response.code).json(response)
        }catch (error){
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    async deleteAddress(req, res){
        try{
            const user = req.user;
            const {addressId} = req.body
            const response = await addressService.deleteAddress(user, addressId);
            return res.status(response.code).json(response)
        }catch (error){
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    async getAddressById(req, res){
        try{
            const user = req.user;
            const {addressId} = req.body
            const response = await addressService.getAddressById(user, addressId);
            return res.status(response.code).json(response)
        }catch (error){
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }
}

export default new AddressController();