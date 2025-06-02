import mongoose from "mongoose";
import { APIError } from "../utils/APIError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;
    if(!error instanceof APIError){
        const statusCode = error.statusCode || error instanceof mongoose.error ? 400 : 500;

        const message = error.message || "Something went wrong";
        error = new APIError(statusCode, message, error?.errors || [], err.stack);
    }

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development"? {stack: error.stack} : {})// only when environment is
        //development, we stack errors in error stack and it does not get displayed in production
    }

    return res.status(error.statusCode).json(response);
}

export { errorHandler }