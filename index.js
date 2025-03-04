import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRouter from './routes/authRouter.js';
import categoryRouter from './routes/categoryRouter.js';
import productRouter from './routes/productRouter.js';
import userRouter from './routes/userRouter.js';
import shoppingCartRouter from './routes/shoppingCartRouter.js'
import addressRouter from './routes/addressRouter.js'
import orderRouter from './routes/orderRouter.js'
import wishlistRouter from './routes/wishlistRouter.js'

dotenv.config();

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

app.use('/auth', authRouter);

// Đảm bảo các route quản lý khác nhau cho manager và admin
app.use('/manager/categories', categoryRouter); 
app.use('/admin/categories', categoryRouter);   
app.use('/categories', categoryRouter); 
app.use('/manager/products', productRouter);   
app.use('/admin/products', productRouter);   
app.use('/products', productRouter); 
app.use('/manager/users', userRouter);   
app.use('/admin/users', userRouter);   
app.use('/users', userRouter);
app.use('/manager/orders', orderRouter);
app.use('/admin/orders', orderRouter); 
app.use('/users/orders', orderRouter)
app.use('/users', shoppingCartRouter)
app.use('/users', addressRouter)
app.use('/users', wishlistRouter)


app.listen(9898, () => {
    console.log("Server is running on port 9898");
});
