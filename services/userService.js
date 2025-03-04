import { dbQuery } from "../config/queryAsync.js";
import bcrypt from 'bcrypt';
class UserService{
    //MANAGER
    async changeRole(userId, roleId) {
        // Kiểm tra quyền có tồn tại hay không
        const existingRole = await dbQuery(`SELECT role_name FROM role WHERE role_id = ?`, [roleId]);
        if (existingRole.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Quyền không tồn tại"
            };
        }
    
        // Kiểm tra người dùng có tồn tại hay không
        const existingUser = await dbQuery(`SELECT * FROM users WHERE user_id = ?`, [userId]);
        if (existingUser.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Người dùng không tồn tại"
            };
        }
    
        // Cập nhật quyền cho người dùng
        await dbQuery(`UPDATE users SET role_id = ? WHERE user_id = ?`, [roleId, userId]);
    
        // Lấy lại thông tin người dùng vừa cập nhật kèm role_name
        const updatedUser = await dbQuery(
            `SELECT 
                u.user_id, u.user_name, u.email, u.full_name, u.avatar, 
                u.phone, u.address, r.role_name, 
                u.status, u.is_deleted, u.email_verified, u.is_active, 
                u.is_deleted_at, u.created_at, u.updated_at
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            WHERE u.user_id = ?`, 
            [userId]
        );
    
        // Chuyển đổi 1/0 thành true/false
        const formattedUser = {
            ...updatedUser[0],
            is_deleted: updatedUser[0].is_deleted === 1,
            email_verified: updatedUser[0].email_verified === 1,
            status: updatedUser[0].status === 1,
            is_active: updatedUser[0].is_active === 1
        };
    
        return {
            code: 200,
            status: "OK",
            message: "Cập nhật quyền thành công",
            data: formattedUser
        };
    }    

    async changeStatusUser(userId){
        // Kiểm tra người dùng có tồn tại hay không
        const existingUser = await dbQuery(`select * from users where user_id =?`, [userId]);
        if (existingUser.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Người dùng không tồn tại"
            };
        }
        // Cập nhật trạng thái người dùng
        await dbQuery(`update users set status = not status, is_active = not is_active where user_id =?`, [userId]);
        // Lấy lại thông tin người dùng vừa cập nhật kèm role_name
        const updatedUser = await dbQuery(
            `SELECT 
                u.user_id, u.user_name, u.email, u.full_name, u.avatar, 
                u.phone, u.address, r.role_name, 
                u.status, u.is_deleted, u.email_verified, u.is_active, 
                u.is_deleted_at, u.created_at, u.updated_at
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            WHERE u.user_id =?`, 
            [userId]
        );
        // Chuyển đổi 1/0 thành true/false
        const formattedUser = {
           ...updatedUser[0],
            is_deleted: updatedUser[0].is_deleted === 1,
            email_verified: updatedUser[0].email_verified === 1,
            status: updatedUser[0].status === 1,
            is_active: updatedUser[0].is_active === 1
        };
        return {
            code: 200,
            status: "OK",
            message: "Cập nhật trạng thái thành công",
            data: formattedUser
        };
    }

    //ADMIN AND MANAGER
    async listUser() {
        // Kiểm tra nếu không có user nào
        const result = await dbQuery('SELECT count(*) as count from users');
        if (result[0].count === 0) {
            return {
                code: 200,
                status: "OK",
                message: "Không có người dùng nào",
                data: []
            };
        }
    
        // Truy vấn danh sách user (loại bỏ password)
        const updatedUser = await dbQuery(`
            SELECT 
                u.user_id, u.user_name, u.email, u.full_name, u.avatar, 
                u.phone, u.address, r.role_name, 
                u.status, u.is_deleted, u.email_verified, u.is_active, 
                u.is_deleted_at, u.created_at, u.updated_at
            FROM users u
            JOIN role r ON u.role_id = r.role_id
        `);
    
        // Format dữ liệu (Chuyển 1/0 thành true/false)
        const formattedUsers = updatedUser.map(user => ({
            ...user,
            is_deleted: user.is_deleted === 1,
            email_verified: user.email_verified === 1,
            status: user.status === 1,
            is_active: user.is_active === 1
        }));
    
        return {
            code: 200,
            status: "OK",
            data: formattedUsers
        };
    }  
    
    async listRoleForUser(){
        //Lấy danh sách người dùng có quyền gì
        const sql = `SELECT u.user_id, u.user_name, r.role_name FROM users u JOIN role r ON u.role_id = r.role_id`;
        const result = await dbQuery(sql);
        return {
            code: 200,
            status: "OK",
            data: result
        };
    }

    async searchUserByName(userName){
        // Tìm kiếm người dùng theo tên với tham số hóa
        const sql = `SELECT * FROM users WHERE user_name LIKE ?`;
        const result = await dbQuery(sql, [`%${userName}%`]);
    
        // Nếu không tìm thấy, trả về thông báo
        if (result.length === 0) {
            return {
                code: 404,
                status: "NOT_FOUND",
                message: "Không tìm thấy người dùng nào phù hợp"
            };
        }
    
        return {
            code: 200,
            status: "OK",
            data: result
        };
    }    

    async infoUser(user){
        // Tìm kiếm thông tin người dùng
        const userInfo = await dbQuery(
            `select user_name, email, full_name, avatar, phone, address, status 
            from users where user_id = ?`, 
            [user.user_id]
        );

        // Kiểm tra nếu không tìm thấy user
        if (userInfo.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Người dùng không hợp lệ hoặc token bị hết hạn"
            };
        }

        //Đổi 1/0 thành true/false
        const fomatInfoUser = {
            ...userInfo[0],
            status: !!userInfo[0].status
        }
        // Trả về thông tin user
        return {
            code: 200,
            status: "OK",
            data: fomatInfoUser
        };
    }

    async updateInfoUser(user, updateData = {}) {
        const { full_name, phone, address } = updateData;
    
        // Kiểm tra dữ liệu trước khi cập nhật
        const existingUser = await dbQuery(
            `SELECT full_name, phone, address FROM users WHERE user_id = ?`, 
            [user.user_id]
        );
        if (existingUser.length === 0) {
            throw {
                code: 404,
                status: "NOT_FOUND",
                message: "Người dùng không tồn tại"
            };
        }
    
        // Lấy dữ liệu hiện tại
        const currentUser = existingUser[0];
        const newFullName = full_name !== undefined ? full_name : currentUser.full_name;
        const newPhone = phone !== undefined ? phone : currentUser.phone;
        const newAddress = address !== undefined ? address : currentUser.address;
    
        // Cập nhật vào database
        await dbQuery(
            `UPDATE users SET full_name = ?, phone = ?, address = ? WHERE user_id = ?`,
            [newFullName, newPhone, newAddress, user.user_id]
        );
    
        // Lấy lại thông tin sau khi cập nhật
        const updatedUser = await dbQuery(
            `SELECT user_name, email, full_name, avatar, phone, address, status FROM users WHERE user_id = ?`,
            [user.user_id]
        );
    
        const userData = updatedUser[0];
    
        // ✅ Chuyển đổi status từ 1/0 thành true/false
        userData.status = userData.status === 1;
    
        return {
            code: 200,
            status: "OK",
            message: "Cập nhật thông tin thành công",
            data: userData
        };
    }    

    async changePassword(user, changePasswordData){
        //Dữ liệu đầu vào
        const {currentPassword, newPassword, confirmPassword} = changePasswordData;

        //Lấy mật khẩu hiện tại của người dùng
        const result = await dbQuery(`select password from users where user_id = ?`, [user.user_id]);
        const oldPassword = result[0]?.password;

        //Kiêm tra mật khẩu hiện tạo có đúng không
        const isMath = await bcrypt.compare(currentPassword, oldPassword);
        if(!isMath){
            throw{
                code: 400,
                status: "BAD_REQUEST",
                message: "Mật khẩu hiện tại không đúng"
            }
        }

        //Kiểm tra mật khẩu mới
        if(newPassword !== confirmPassword){
            throw{
                code: 400,
                status: "BAD_REQUEST",
                message: "Mật khẩu không trùng nhau"
            }
        }

        //Mã háo mật khẩu
        const hashPassword = await bcrypt.hash(newPassword, 10);

        //Cập nhật mật khẩu mới vô database
        await dbQuery(`update users set password = ? where user_id = ?`, [hashPassword, user.user_id]);

        //Trả về
        return {
            code: 200,
            status: "OK",
            message: "Đổi mật khẩu thành công"
        };
    }
}

export default new UserService();