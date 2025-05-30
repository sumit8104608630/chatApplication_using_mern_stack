// Import Cloudinary API and File System module
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import dotenv from "dotenv"
dotenv.config({path:"./.env"})

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME, // Cloudinary cloud name from environment variables
    api_key: process.env.API_KEY,       // Cloudinary API key from environment variables
    api_secret: process.env.API_SECRET  // Cloudinary API secret from environment variables
});

// Function to upload file to Cloudinary
const uploadFile = async (localStorage) => {
    try {
        // Check if local file path is provided
        if (!localStorage) {
            return "Please provide a valid file path.";
        }
 
        // Upload file to Cloudinary
        const uploaded = await cloudinary.uploader.upload(localStorage, { resource_type: "auto" , folder: "chat_app/profilePhoto"});
 

        // Delete the local file after successful upload
        fs.unlinkSync(localStorage);

        return uploaded;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        // Ensure file is deleted even if upload fails
        if (fs.existsSync(localStorage)) {
            fs.unlinkSync(localStorage);
            console.log("Local file deleted due to upload error.");
        }

        return { error: "Upload failed. Please try again." }; // ✅ Return error message
    }
};

const uploadImageFile = async (localStorage) => {
    try {
        // Check if local file path is provided
        if (!localStorage) {
            return "Please provide a valid file path.";
        }
 
        // Upload file to Cloudinary
        const uploaded = await cloudinary.uploader.upload(localStorage, { resource_type: "auto" , folder: "chat_app/images"});
 

        // Delete the local file after successful upload
        fs.unlinkSync(localStorage);

        return uploaded;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        // Ensure file is deleted even if upload fails
        if (fs.existsSync(localStorage)) {
            fs.unlinkSync(localStorage);
            console.log("Local file deleted due to upload error.");
        }

        return { error: "Upload failed. Please try again." }; // ✅ Return error message
    }
};
const uploadDocFile = async (localStorage) => {
    try {
        // Check if local file path is provided
        if (!localStorage) {
            return "Please provide a valid file path.";
        }
 
        // Upload file to Cloudinary
        const uploaded = await cloudinary.uploader.upload(localStorage, { resource_type: "auto" , folder: "chat_app/documents"});
 

        // Delete the local file after successful upload
        fs.unlinkSync(localStorage);

        return uploaded;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        // Ensure file is deleted even if upload fails
        if (fs.existsSync(localStorage)) {
            fs.unlinkSync(localStorage);
            console.log("Local file deleted due to upload error.");
        }

        return { error: "Upload failed. Please try again." }; // ✅ Return error message
    }
};

const uploadVideoFile = async (localStorage) => {
    try {
        // Check if local file path is provided
        if (!localStorage) {
            return "Please provide a valid file path.";
        }
 
        // Upload file to Cloudinary
        const uploaded = await cloudinary.uploader.upload(localStorage, { resource_type: "auto" , folder: "chat_app/videos"});
 

        // Delete the local file after successful upload
        fs.unlinkSync(localStorage);

        return uploaded;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        // Ensure file is deleted even if upload fails
        if (fs.existsSync(localStorage)) {
            fs.unlinkSync(localStorage);
            console.log("Local file deleted due to upload error.");
        }

        return { error: "Upload failed. Please try again." }; // ✅ Return error message
    }
};

const uploadGroupImageFile = async (localStorage) => {
    try {
        // Check if local file path is provided
        if (!localStorage) {
            return "Please provide a valid file path.";
        }
 
        // Upload file to Cloudinary
        const uploaded = await cloudinary.uploader.upload(localStorage, { resource_type: "auto" , folder: "chat_app/GroupProfileImages"});
 

        // Delete the local file after successful upload
        fs.unlinkSync(localStorage);

        return uploaded;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        // Ensure file is deleted even if upload fails
        if (fs.existsSync(localStorage)) {
            fs.unlinkSync(localStorage);
            console.log("Local file deleted due to upload error.");
        }

        return { error: "Upload failed. Please try again." }; // ✅ Return error message
    }
};
export { uploadFile,uploadImageFile,uploadDocFile,uploadVideoFile ,uploadGroupImageFile};
