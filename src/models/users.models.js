import mongoose, { Schema } from 'mongoose';
import bcrypt from "bcrypt"; // Corrected spelling

import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true, 
        lowercase: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    avatar: {
        type: String,
        required: true
    },
    coverImage: {
        type: String
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Video'
    }],
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }
},
{
    timestamps: true
}
);

// Password should be saved in encrypted format just before saving to the database
userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.toGenerateAccessToken = function(){
    // Short-lived JWT token
    return jwt.sign({
        // Payload
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    // Secret key
    process.env.ACCESS_TOKEN_SECRET,
    // Expiry time
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

userSchema.methods.toRefreshAccessToken = function(){
    // Long-lived JWT token
    return jwt.sign({
        // Payload
        _id: this._id
    },
    // Secret key
    process.env.REFRESH_TOKEN_SECRET,
    // Expiry time
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const User = mongoose.model('User', userSchema);
