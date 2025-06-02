import jwt from 'jsonwebtoken';
import { User } from '../models/users.models.js';
import APIError from '../utils/APIError.js';
import asyncHandler from '..utils/asyncHandler.js';

const verifyJWT = asyncHandler(async (req, next)=> {
    const token = req.cookies.accessToken || req.body.accessToken || req.headers.authorization?.replace("Bearer ", "");
    if(!token){
        throw new APIError(401, "Unauthorized");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if(!user){
            throw new APIError(404, "User not found");
        }
        //assign a user paramter information to the request object
        req.user = user;
        next();
    } catch (error) {
        throw new APIError(401, error?.message || "Invalid access token");
    }
})

export {verifyJWT};