import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRouter from './routes/AuthRouter.js'
import categoryRouter from './routes/CategoryRouter.js'
import productRouter from './routes/productRouter.js'

const app = express();
app.use(express.json());
app.use(morgan('dev'))
app.use(cors());
dotenv.config();
app.use('/auth',authRouter)
app.use('/manager',categoryRouter)
app.use('/admin',categoryRouter)
app.use('/manager',productRouter)
app.use('/admin',productRouter)


app.listen(7654, () => {
    console.log("Server is running on port 7654");
})
