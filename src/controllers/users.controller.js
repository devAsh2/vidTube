import { asyncHandler } from "../utils/asyncHandler.js";
import {APIError} from "../utils/APIError.js"
import { User} from "../models/users.models.js"
import {uploadOnCloudinary , deleteFromCloudinary} from "../utils/claudinary.js"
import { APIResponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken"  ;
import mongoose from "mongoose";

// if user id is given generate access token and refresh token
const generateAccessAndRefreshToken = async(userId)=> {
    try {
        const user = await User.findById(userId);
        if(!user){
            throw new APIError("User not found", 404, true);
        }
        const accessToken = user.toGenerateAccessToken();
        const refreshToken = user.toRefreshAccessToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken};
    } catch (error) {
        throw new APIError("Failed to generate access and refresh token", 500, true);
    }
}

const registerUser = asyncHandler( async (req, res) => {
//TODO
//accept data from the user frontend
const {username, email, fullname, password} = req.body;
//validation 
if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
    throw new APIError(400, "Fullname is required");
}

// we use await because database always lives on another continent and might take time
const existedUser = await User.findOne({
    $or: [{ username }, { email }] // search for user with either username or email
})
if (existedUser) {
    throw new APIError(409, "User with email or username already exists")
}
console.log(req.files);
const avatarLocalPath = req.files?.avatar?.[0]?.path;
const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

if (!avatarLocalPath) {
    throw new APIError(400, "Avatar file is required")
}

// const avatar = await uploadOnCloudinary(avatarLocalPath);
// const coverImage = await uploadOnCloudinary(coverImageLocalPath);

let avatar;
try{
    avatar  = await uploadOnCloudinary(avatarLocalPath);
    console.log("Uploaded avatar", avatar);
}
catch(error){
    console.log("Eror in uploading avatar", error);
    throw new APIError(500, "Failed to upload avatar")
}

let coverImage;
try{
    coverImage  = await uploadOnCloudinary(coverImageLocalPath);
    console.log("Uploaded coverImage", coverImage);
}
catch(error){
    console.log("Eror in uploading coverImage", error);
    throw new APIError(500, "Failed to upload coverImage")
}


try {
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    //create new user
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if (!createdUser) {
        throw new APIError(500, "Something went wrong while registering the user")
    }
    
    return res.status(201).json(
        new APIResponse(200, createdUser, "User registered Successfully")
    )
} catch (error) {
    console.log("Error in creating user", error);
    if(avatar){
        deleteFromCloudinary(avatar.public_id);
    }
    if(coverImage){
        deleteFromCloudinary(coverImage.public_id);
    }
    throw new APIError(500, "Failed to create user")
}




} )

const loginUser = asyncHandler(async (req, res) => {
    //TODO
    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    //check if user exists
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    //check if password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials")
    }

    //if password is correct generate access token and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id.select("-password -refreshToken"));

    const options = {
        httpOnly: true,
        secure:true
    }

    return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
        new APIResponse(200,
            {user: loggedInUser, accessToken, refreshToken},
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    //After auth middleware sets up user info in req object, this is how user is logged out using request.user._id
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {refreshToken: undefined}
        }
        , {new: true}
    )

    const options = {
        httpOnly : true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new APIResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.body.refreshToken || req.cookies.refreshToken;
    if (!incomingRefreshToken) {
        throw new APIError(400, "Refresh token is required")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?.id);
        if (!user) {
            throw new APIError(404, "Invalid refresh token")
        }
    
        
        if(incomingRefreshToken !== user?.refreshToken){
            throw new APIError(401, "Invalid refresh token")
        }
    } catch (error) {
        throw new APIError(401, "Invalid refresh token");
    }

    const {accessToken,refreshToken:newRefreshToken} = await generateAccessAndRefreshToken(user._id);
    
    const options ={
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    res.
    status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new APIResponse(200, {accessToken, refreshToken:newRefreshToken}, "Access token refreshed successfully")
    )
})

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid){
        throw new APIError(401, "Invalid old password");
    }
    user.password = newPassword;
    await user.save({validateBeforeSave: false});
    return res.status(200)
    .json(new APIResponse(200, {}, "Password changed successfully"));
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    res.status(200)
    .json(new APIResponse(200, req.user, "Current user details"));
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {fullName, email} = req.body;
    if(!fullName || !email){
        throw new APIError(400, "Fullname or email is required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {fullName, email}
        },
        {new: true}
    ).select("-password -refreshToken");

    return res.status(200)
    .json(new APIResponse(200, user, "User details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req,res)=>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment
    await deleteFromCloudinary(req.user?.avatar?._id);


    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateCoverImage = asyncHandler(async (req,res)=>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

//create two new controllers dependent on aggregation pipeline
const getUserChannelProfile = asyncHandler(async (req,res)=>{
    //get username from the request params. req.params gets you anything from url when user is visiting
    const {username } = req.params;
    if(!username.trim()){
        throw new APIError(400, "Username is required");
    }

    //grab some channel information using username using aggregation pipeline
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                foreignField:"channel",
                localField: "_id",
                as: "subscribers"
            }
        },
        {
            lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount : {$size: "$subscribers"},
                subscribedToCount: {$size: "$subscribedTo"},
                isSubscribed: {
                    $cond:{
                        if:{
                            $in: [req.user?._id, "$subscribedTo", "$subscribers"]
                        },
                        then : true,
                        else: false
                    }
                }
            }
        },
        {
            //project only the necessary data
            $project:{
                fullname: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                email: 1
            }
        }
    ])

    if(!channel.length){
        throw new APIError(404, " Channel not found");
    }

    return res.status(200)
    .json(new APIResponse(200, channel[0], "Channel profile fetched successfully"));
})

const getWatchHistory = asyncHandler(async (req,res)=>{
    const user = await User.aggregate(
        [
            {
                $match: {
                    _id: mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $lookup:{
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    //to pass more data from other collections such user
                    pipeline: [
                        {
                            $lookup:{
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                //to project only full name username and avatar from users collection
                                pipeline: [
                                    {
                                        $project:{
                                            fullname: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields:{
                                owner: {$arrayElemAt: ["$owner", 0]}
                            }
                        }
                    ]
                }
            }
        ]
    )

    return res.status(200)
    .json(new APIResponse(200, user[0].watchHistory, "Watch history fetched successfully"));
})

export {registerUser, loginUser, refreshAccessToken, logoutUser,
    changeCurrentPassword, getCurrentUser, updateAccountDetails,
    updateUserAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory
};