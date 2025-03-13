import { asyncHandler } from "../util/asyncHandler.js";
import {apiResponse} from "../util/apiResponse.js"
import {apiError} from "../util/apiError.js"
import User from "../models/user.model.js"
 import {uploadFile} from "../util/cloudinary.js"
 import { fileURLToPath } from "url"; // Import to define __dirname

// Define __dirname manually in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import path from "path" 
// user registration controller
const userRegistration=asyncHandler(async(req,res)=>{
    try {

        const {name,phoneNumber,email,password}=req.body;
        if([name,phoneNumber,email,password].some(item=>item=="")){
            return apiError(res,400,"Please fill all the fields");
        }
        const existingUser=await User.findOne({email});
        if(existingUser){
            return res.status(400).json(new apiResponse(400,{},"Contact already exist"));
        }
        
        if (!req.file || !req.file.filename) {
            return res.status(400).json(new ApiResponse(400, "", "Please upload your profile picture"));
        }
        
        const local_path = path.join(__dirname, `../public/temp/${req.file.filename}`);
        console.log(local_path)
        const upload=await uploadFile(local_path);
        const user={
            name,phoneNumber,email,password,profilePicture:upload.secure_url
        }
        await User.create(user)
        return res.status(201).json(new apiResponse(201,user,"User created successfully"));
    } catch (error) {
        console.log(error)
    }
});


// user login functionality

const user_login=asyncHandler(async(req,res)=>{
    try {
        const {phoneNumber,password}=req.body;
        if([phoneNumber,password].some(item=>item=="")){
            return apiError(res,400,"Please fill all the fields");
        }
        const user=await User.findOne({phoneNumber});
        if(!user){
            return res.status(400).json(new apiResponse(400,{},"Invalid phone number or password"));
        }
       const token=await User.matchPasswordGenerateToken(phoneNumber,password)
       //console.log(token)
       res.status(200).cookie('accessToken',token.token,{
        httpOnly:true,
        secure:true,
    }).cookie("refresh_token",token.refresh_token,{
        httpOnly:true,
        secure:true,
    }).json(new apiResponse(
        200,
    {}
        ,
        "user logged in successfully"
    ))
    } catch (error) {
     console.log(error)   
    }
})

// user Logout
const user_logout=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;
        await User.findByIdAndUpdate(id,{$set:{refreshToken:undefined}});
        res.status(200).clearCookie('accessToken',{
            httpOnly:true,
            secure:true,
            sameSite: "None" // Cross-origin पर काम करने के लिए

        }).clearCookie('refresh_token',{
                httpOnly:true,
                secure:true,
                sameSite: "None" // Cross-origin पर काम करने के लिए

                
        }).json(new  apiResponse(200,"logout successfully"));

    } catch (error) {
        console.log(error)
    }
})

export {
    userRegistration,
    user_login,
    user_logout
}