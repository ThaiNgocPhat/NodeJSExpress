import { v4 as uuidv4} from 'uuid' 
import { dbQuery } from "../config/queryAsync.js";
import { sql } from 'googleapis/build/src/apis/sql/index.js';

class AddressService {
    async listAddress(user){
        //Truy vấn dữ liệu
        const addresses = await dbQuery(`select address_id, address, phone, receive_name from address where user_id = ?`, [user.user_id]);
        
        //Kiểm tra danh sách địa chỉ của người dùng
        if(addresses.length === 0){
            throw{
                code: 404,
                status: "NOT_FOUND",
                message: "Người dùng chưa có địa chỉ nào"
            }
        }

        //Trả về
        return {
            code: 200,
            status: "OK",
            data: addresses
        }
    }


    async addAddress(user, addressData) {
        // Dữ liệu đầu vào
        const { address, phone, receive_name } = addressData;
    
        // Kiểm tra địa chỉ đã tồn tại chưa
        const existingAddress = await dbQuery(
            `select address from address where user_id = ? and address = ?`, 
            [user.user_id, address]
        );
        
        if (existingAddress.length > 0) {
            throw {
                code: 409,
                status: "CONFLICT",
                message: "Địa chỉ đã tồn tại"
            };
        }
    
        // Tạo id ngẫu nhiên bằng uuid
        const addressId = uuidv4();
    
        // Thêm mới địa chỉ
        await dbQuery(
            `insert into address(address_id, user_id, address, phone, receive_name) value (?, ?, ?, ?, ?)`,
            [addressId, user.user_id, address, phone, receive_name]
        );
    
        // Lấy lại thông tin địa chỉ vừa thêm
        const newAddAddress = await dbQuery(
            `select address_id, address, phone, receive_name from address where address_id = ?`,
            [addressId]
        );
    
        return {
            code: 201,
            status: "CREATED",
            message: "Thêm mới địa chỉ thành công",
            data: newAddAddress[0]
        };
    }    

    async deleteAddress(user, addressId){
        //Kiểm tra địa chỉ có tồn tại hay không
        const existingAddress = await dbQuery(`select * from address where user_id = ? and address_id = ?`,
            [user.user_id, addressId]
        );

        if(existingAddress.length === 0){
            throw{
                code: 404,
                status: "NOT_FOUND",
                message: "Không tìm thấy địa chỉ"
            }
        }

        //xoá địa chỉ
        await dbQuery(`delete from address where user_id = ? and address_id = ? `, [user.user_id, addressId]);

        //Trả về
        return{
            code: 200,
            status: "OK",
            message: "Xoá thành công"
        }
    }

    async getAddressById(user, addressId){
        //Lấy địa chỉ theo id
        const result = await dbQuery (`select * from address where user_id = ? and address_id = ?`, [user.user_id, addressId]);

        //Kiểm tra id có tồn tại hay không
        if(result.length === 0){
            throw{
                code: 404,
                status: "NOT_FOUND",
                message: "Không tìm thấy địa chỉ"
            }
        }

        //Trả về
        return {
            code: 200,
            status: "Ok",
            data: result[0]
        }
    }
}

export default new AddressService();