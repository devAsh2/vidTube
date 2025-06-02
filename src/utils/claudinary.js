import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

//configuring cloudinary
cloudinary.config({
    cloud_name: process.env.CLODINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        console.log("Error in uploading file on cloudinary", error);
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteFromCloudinary = async (publicId)=>{
    try {
        //delete the file from cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Deleted file "+result+" from cloudinary. It's public id : "+publicId);
    }
    catch(error) {
        console.log("Trying to delete resource from cloudinary", error);
    }
}

export {uploadOnCloudinary, deleteFromCloudinary};