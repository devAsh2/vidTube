import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {errorHandler } from './middlewares/error.middleware.js';
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN, // Fixed typo here
    credentials: true
}))
//common middlewares
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true, limit:"16kb"}));
app.use(express.static('public'));
//cookie parser middleware
app.use(cookieParser());

//routes
import router from './routes/healthcheck.route.js';
import userRouter from './routes/user.route.js';

//route
app.use("/api/v1/healthCheck", router);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);

//error handling middleware
app.use(errorHandler);

export { app };
