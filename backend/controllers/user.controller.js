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
import { Console } from "console";
// user registration controller
const userRegistration=asyncHandler(async(req,res)=>{
    try {

        const {name,phoneNumber,email,password}=req.body;
        if([name,phoneNumber,email,password].some(item=>item=="")){
            return res.status(400).json(new apiResponse(400, "", "Please fill all the detail"));
        }
        const existingUser=await User.findOne({email});
        if(existingUser){
            return res.status(400).json(new apiResponse(400,{},"Contact already exist"));
        }
        
        if (!req.file || !req.file.filename) {
            return res.status(400).json(new apiResponse(400, "", "Please upload your profile picture"));
        }
        
        const local_path = path.join(__dirname, `../public/temp/${req.file.filename}`);
        const upload=await uploadFile(local_path);
        const user={
            name,phoneNumber,email,password,profilePhoto:upload.secure_url
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
            return res.status(400).json(new apiResponse(400,{},"please fill all the field"));
        }
        const user=await User.findOne({phoneNumber});
        if(!user){
            return res.status(400).json(new apiResponse(400,{},"Invalid phone number or password"));
        }
       const token=await User.matchPasswordGenerateToken(phoneNumber,password)
       if(token.success){
        return res.status(400).json(new apiResponse(400,{},token.message))
       }
       
       res.status(200).cookie('accessToken',token.token,{
        httpOnly:true,
        secure:true,
    }).cookie("refresh_token",token.refresh_token,{
        httpOnly:true,
        secure:true,
    }).json(new apiResponse(
        200,user,"user logged in successfully"
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
});



//let's create the feature to add the contact no in the user 
const add_contact_no=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;
        const {phoneNumber,contactName}=req.body;
        const user=await User.findById(id);
        if(!user){
            return res.status(400).json(new apiResponse(400,{},"unauthorized"));
        }
        const contactUser=await User.findOne({phoneNumber:phoneNumber});
        if(!contactUser){
            return res.status(404).json(new apiResponse(404,{},"user doesn't exist in chat app"))
        }
        const newContact = {
            name: contactName,
            phone: phoneNumber,
            save_contact:true,
            userId: contactUser ? contactUser._id : null, // Store user ID if registered
        };
        if(user.contacts?.some(item=>item.phoneNumber==phoneNumber)){
            return res.status(400).json(new apiResponse(400,{},"contact already exist"))
        }
        await User.findByIdAndUpdate(id,{$push:{contacts:newContact}},{new:true})
        await User.findByIdAndUpdate(contactUser._id,{$push:{contacts:{name:user.name,phone:user.phoneNumber,userId:id}}})
        return res.status(200).json(new apiResponse(200, { contact: newContact }, "Contact added successfully"));
    } catch (error) {
        console.log(error)
    }
})

// let write the function to get all contact with populating information 
const get_all_contacts = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user;
        const user = await User.findById(id).populate("contacts.userId", "name phoneNumber email profilePhoto status isOnline lastSeen");

        if (!user) {
            return res.status(400).json(new apiResponse(400, {}, "Unauthorized"));
        }

        return res.status(200).json(new apiResponse(200, { contacts: user.contacts }, "Contacts fetched successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
});

// let check weather the user is login or not

const getUserInfo=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;
        const user=await User.findById(id).select("-contacts -password -refreshToken -salt");
        if(!user){
            return res.status(400).json(new apiResponse(400,{},"unauthorized"))
        }
        return res.status(200).json(new apiResponse(200,{user}, "User info "));
    } catch (error) {
        console.log(error)
    }
})
const check_user_present = asyncHandler(async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const {id}=req.user
        const current_user = await User.findById(id);
        if(current_user.phoneNumber==phoneNumber){
            return res.status(402).json(new apiResponse(402, {}, "it is you"))
        }
        else if(current_user.contacts.some(item=>item.phone==phoneNumber)){
            return res.status(403).json(new apiResponse(403, {}, "it is you"))
        }
        
        if (!phoneNumber) {
            return res.status(400).json(new apiResponse(400, {}, "Phone number is required"));
        }

        const user = await User.findOne({ phoneNumber:phoneNumber.trim() });

        if (user) {
            return res.status(200).json(
                new apiResponse(200, { available: true }, "Hey there! 🎉 I'm using the chat app. Let's connect!")
              );        }

        return res.status(404).json(new apiResponse(404, { available: false }, "User does not exist"));
    } catch (error) {
        console.error("Error in check_user_present:", error);
        return res.status(500).json(new apiResponse(500, {}, "Something went wrong"));
    }
});

const update_Profile=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;
        const user=req.user
        if(!user){
            return res.status(400).json(new apiResponse(400,{},"unauthorized"))
        }
        const { name, email, phoneNumber, profilePhoto,status } = req.body;

        const updatedUser = {
          name: name || user.name,
          email: email || user.email,
          phoneNumber: phoneNumber || user.phoneNumber,
          profilePhoto: profilePhoto || user.profilePhoto,
          status:status||user.status,
        };     
        
       await User.findByIdAndUpdate(id,{$set:updatedUser});
       return res.status(200).json(new apiResponse(200, updatedUser, "Profile updated"))
    } catch (error) {
        console.log(error) 
    }
})


export {
    userRegistration,
    user_login,
    user_logout,
    add_contact_no,
    get_all_contacts,
    getUserInfo,
    check_user_present,
    update_Profile,
}