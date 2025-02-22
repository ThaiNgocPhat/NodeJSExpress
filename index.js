import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import AuthRouter from './routes/AuthRouter.js'

const app = express();
app.use(express.json());
app.use(morgan('dev'))
app.use(cors());
dotenv.config();
app.use('/auth',AuthRouter)


app.listen(7654, () => {
    console.log("Server is running on port 7654");
})
