import userService from "../services/userService.js";
class UserController{
    //MANAGER
    async changeRole(req, res){
        try{
            const {roleId} = req.body;
            const {userId} = req.params;
            const response = await userService.changeRole(userId, roleId);
            res.status(response.code).json(response);
        }catch (error){
            if (error.code === 404) {
                return res.status(404).json(error); 
            }
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }

    async changeStatusUser(req, res){
        try{
            const {userId} = req.params;
            const response = await userService.changeStatusUser(userId);
            res.status(response.code).json(response);
        }catch (error){
            if (error.code === 404) {
                return res.status(404).json(error); 
            }
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }
    //ADMIN AND MANAGER
    async listUser(req, res){
        try{
            const response = await userService.listUser();
            res.status(response.code).json(response);
        }catch (error){
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }

    async listRoleForUser(req, res){
        try{
            const {userId} = req.params;
            const response = await userService.listRoleForUser(userId);
            res.status(response.code).json(response);
        }catch (error){
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }
    async searchUserByName(req, res) {
        try {
            const { userName } = req.query;
            const response = await userService.searchUserByName(userName);
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            });
        }
    }    

    async infoUser(req, res){
        try{
            const user = req.user;
            const response = await userService.infoUser(user);
            return res.status(response.code).json(response);
        }catch (error){
            res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    async updateInfoUser(req, res){
        try{
            const user = req.user;
            const response = await userService.updateInfoUser(user, req.body);
            return res.status(response.code).json(response);
        }catch (error){
            return res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }

    async changePassword(req, res){
        try{
            const user = req.user;
            const response = await userService.changePassword(user, req.body);
            return res.status(response.code).json(response);
        }catch (error){
            res.status(500).json({
                code: 500,
                message: "Lỗi Server",
                error: error.message
            })
        }
    }
}

export default new UserController();