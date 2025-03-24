import { asyncHandler } from "../util/asyncHandler.js";
import {apiResponse} from "../util/apiResponse.js"
import {apiError} from "../util/apiError.js"
import Message from  "../models/message.model.js"
import path from "path"
import User from "../models/user.model.js"
import { fileURLToPath } from "url"; // Import to define __dirname
import {uploadImageFile,uploadDocFile} from "../util/cloudinary.js"
import mongoose from "mongoose";
import {getOnlineUserIds, io} from "../src/app.js"
import { text } from "stream/consumers";
// let's create function to store messages
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const store_messages=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;
        const {message,status,receiverId}=req.body;
        const receiver=getOnlineUserIds(receiverId);
        const user=await User.findById(id);
        let imageUrl=null;
        let docUrl=null;
        // now we here to implement the file and image also
        if(req.files){
           

            if(req.files["image"]){
            const local_path=path.join(__dirname,`../public/temp/${req.files["image"][0].filename}`);
            const  req_url=await uploadImageFile(local_path);
            
            imageUrl=req_url.secure_url;
            }
            if(req.files["file"]){
                const local_path=path.join(__dirname,`../public/temp/${req.files["file"][0].filename}`);
                const  req_url=await uploadDocFile(local_path);
                docUrl=req_url.secure_url;
                }
                
          
            }
            const message_obj=new Message({
                message,
                status,
                receiver:receiverId,
                sender:id,
                images:imageUrl,
                file:docUrl
                });
                await message_obj.save()
           
        const createdAt = new Date(message_obj.createdAt); // Convert to Date object

        // Format hours and minutes (12-hour format with AM/PM)
        const formattedTime = createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                const format_message={
                    id:message_obj._id,
                    file:message_obj.file,
                    image:message_obj.images,
                    isOwn:true,
                    profilePhoto:user.profilePhoto,
                    sender:id,
                    text:message,
                    time:formattedTime
                }
                if(receiver){ 
                    format_message["isOwn"]=false
                io.to(receiver).emit("newMessage",format_message)
            }
            format_message["isOwn"]=true
            return res.status(201).json(new apiResponse(201,format_message, "Message sent successfully"));
        }
     catch (error) {
        console.log(error)
    }
});
 
// now make the function to get all the message from the user  by separating the sender and receiver
const get_all_messages = asyncHandler(async(req, res) => {
    try {
        console.log("call")
        const {id} = req.user;
        const receiverId = req.params;
        
        // Check if receiverId exists
        if (!receiverId.id) {
            return res.status(400).json(new apiResponse(400, "", "Receiver ID is required"));
        }
        
        const message = await Message.aggregate([
            {   
                $match: {
                    $or: [
                        { sender: new mongoose.Types.ObjectId(id), receiver: new mongoose.Types.ObjectId(receiverId.id) },
                        { sender: new mongoose.Types.ObjectId(receiverId.id), receiver: new mongoose.Types.ObjectId(id) }
                    ]
                }
                
            },
            {
                $lookup: {
                    from: "users",
                    localField: "sender",
                    foreignField: "_id",
                    as: "senderInfo"
                }
            },
            {
                $unwind: {
                    path: "$senderInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "receiver",
                    foreignField: "_id",
                    as: 'receiverInfo'
                }
            },
            {
                $unwind: {
                    path: "$receiverInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    id: { $toString: "$_id" },
                    sender: { $toString: "$senderInfo._id" },
                    text: "$message",
                    image:"$images",
                    file:"$file",
                    time: {
                        $dateToString: {
                            format: "%H:%M",
                            date: "$createdAt"
                        }
                    },
                    isOwn: { $eq: [{ $toString: "$sender" }, id] },
                    profilePhoto: "$senderInfo.profilePhoto",
                    status: "$status"
                }
            }
        ]);
        return res.status(200).json(new apiResponse(200, message, "Messages retrieved successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiError(500, "Internal server error"));
    }
});



export {
    store_messages,
    get_all_messages
}