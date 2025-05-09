import { asyncHandler } from "../util/asyncHandler.js";
import {apiResponse} from "../util/apiResponse.js"
import {apiError} from "../util/apiError.js"
import Message from  "../models/message.model.js"
import path from "path"
import User from "../models/user.model.js"
import { fileURLToPath } from "url"; // Import to define __dirname
import {uploadImageFile,uploadDocFile,uploadVideoFile} from "../util/cloudinary.js"
import mongoose from "mongoose";
import {getOnlineUserIds, io} from "../src/app.js"
import { text } from "stream/consumers";
import { error } from "console";
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
        let videoUrl=null;
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
                if(req.files["video"]){
                    const local_path=path.join(__dirname,`../public/temp/${req.files["video"][0].filename}`);
                    const  req_url=await uploadVideoFile(local_path);
                    videoUrl=req_url.secure_url;
                }
            }
            const message_obj=new Message({
                message,
                status,
                receiver:receiverId,
                sender:id,
                images:imageUrl,
                video:videoUrl,
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
                    video:message_obj.video,
                    isOwn:true,
                    profilePhoto:user.profilePhoto,
                    status:message_obj.status,
                    sender:id,
                    text:message,
                    time:formattedTime
                }
                if(format_message.status!="seen"){
                    io.emit("newNotification", {sender:format_message.sender,receiverId});
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
        const {id} = req.user;
        const receiverId = req.params;
        
        // Check if receiverId exists
        if (!receiverId.id) {
            return res.status(400).json(new apiResponse(400, "", "Receiver ID is required"));
        }
   
        
        const message = await Message.aggregate([
            {   
                $match: {
                    deletedFor: { $ne: new mongoose.Types.ObjectId(req?.user?._id) },
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
                    deletedFor:"$deletedFor",
                    text: "$message",
                    image:"$images",
                    video:"$video",
                    file:"$file",
                    time: {
                        $dateToString: {
                            format: "%H:%M",
                            date: { $toDate: "$createdAt" },
                            timezone: "+05:30"  // IST offset from UTC
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

//get all message for notification

const update_message_status = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user;
        const { activeUser } = req.body;
        
        // Validate input
        if (!Array.isArray(activeUser)) {
            return res.status(400).json(new apiResponse(400, null, "Invalid active user data"));
        }
        
        const senderId = activeUser.find(element => element === id);
        // Optional: Only update if the user is in the active users list
        const updateCondition = senderId 
            ? { $or: [{ receiver: id }, { sender: id }] }
            : { $or: [{ receiver: id }, { sender: id }], status: { $ne: 'seen' } };
        
        const message = await Message.updateMany(
            updateCondition,
            { $set: { status: 'seen' } }
        );
        
        return res.status(200).json(new apiResponse(200, senderId, "Updated successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, null, "Error updating message status"));
    }
});

const update_message_array_received = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user;
        const { activeContact } = req.body;

        const updateCondition = { 
            receiver: id, // Changed to the current user's ID
            sender: { $ne: activeContact }, // Ensure sender is not the active contact
            status: { $nin: ['received', 'seen'] } 
        };

        const message = await Message.updateMany(
            updateCondition,
            { $set: { status: 'received' } }
        );

        return res.status(200).json(new apiResponse(200, activeContact, "Updated successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, null, "Error updating message status"));
    }
});

const update_message_array_seen=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;
        const {contact_id}=req.body;
        console.log(contact_id)
        if(!contact_id){
            return res.status(400).json(new apiResponse(400, null, "Invalid contact ID"));
        }
        const updateCondition = { 
            receiver: id,  // Match receiver
            sender: contact_id, // Match sender exactly
            status: { $nin: ['seen'] } // Ensure status is not 'seen'
        };
        

        const message = await Message.updateMany(
            updateCondition,
            { $set: { status: 'seen' } }
        );
        return res.status(200).json(new apiResponse(200, contact_id, "Updated successfully"));
    } catch (error) {
        console.log(error)
    }
})
// creating the notification function for my chat application for better performance 

const Notification=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;
        if(!id){
            return res.status(400).json(new apiResponse(400, null, "Invalid user ID"));
        }
        const messageStats = await Message.aggregate([
            // Match messages where user is the receiver
            { $match: { receiver: new mongoose.Types.ObjectId(id) } },
            
            // Group by sender and count messages with "received" status
            { $group: {
                _id: "$sender",
                unseenCount: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "received"] }, 1, 0]
                  }
                },
                lastMessageDate: { $max: "$createdAt" },

                totalMessages: { $sum: 1 }
              }
            },
            
            // Project only the fields we need
            { $project: {
                _id: 0,
                senderId: "$_id",
                lastMessageDate: 1,
                unseenCount: 1
              }
            }
          ]); 
          if(messageStats){
            return res.status(200).json(new apiResponse(200, messageStats, "Updated successfully"));
          } 
          else{
            return res.status(400).json(new apiResponse(400, null, "No messages found"))
          }      
    } catch (error) {
        console.log(error)
    }
}) 

// let's create the functionality of deleting message  

const deleteMessage = asyncHandler(async (req, res) => {
    try {
        const { receiverId, messageId, arrayOfId } = req.body;
        const receiver = getOnlineUserIds(receiverId);

        if (!messageId || !arrayOfId || arrayOfId.length === 0) {
            return res.status(404).json(new apiResponse(404, null, "Invalid message ID or empty array"));
        }

        let updateQuery = {};

        if (arrayOfId.length === 1) {
            // Push one userId to deletedFor array
            updateQuery = { $addToSet: { deletedFor: arrayOfId[0] } };
        } else {
            // Replace entire array
            updateQuery = { $set: { deletedFor: arrayOfId } };
        }

        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            updateQuery,
            { new: true }
        );

        if (receiver) {
            io.to(receiver).emit("deletedMessage", {
                messageId,
                deletedFor: updatedMessage.deletedFor
            });
        }

        return res.status(200).json(new apiResponse(200, updatedMessage, "Message updated"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, null, "Internal Server Error"));
    }
});



// let's create the forward message feature 
const forward_message=asyncHandler(async(req,res)=>{
    try {
        /*
        1. first we will select the array of forward message for send message to all selected contact
        2. save the message in the data base collection 
        3. emit the whole array for real time receiving 
         */
        const {arrOfMessage,activeContactId}=req.body;
        const {id} = req.user;
        const user = await User.findById(id)
        if(arrOfMessage.length===0){
            return res.status(404).json(new apiResponse(404, null, "Invalid empty array"));
        }
       const messages = await Message.insertMany(arrOfMessage);
       let SenderMessage=null; 
       // let's emit the message for real time communication
       messages.forEach(message => {

        // let format the message 
        const formatted_message = {
            id: message._id.toString(),
            sender: message.sender.toString(),
            deletedFor: message.deletedFor || [],
            text: message.message,
            image: message.images,
            video: message.video,
            file: message.file,
            time:  new Date(message.createdAt).toLocaleTimeString("en-IN", {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              }),
            isOwn: id.toString() != message.sender.toString(),
            profilePhoto: user.profilePhoto,
            status: message.status
          };

        let receiveSocketId=getOnlineUserIds(message.receiver);
        if(receiveSocketId){
            io.to(receiveSocketId).emit("newMessage",formatted_message)
        }

        if (activeContactId && activeContactId === message.receiver.toString()) {

                let senderSocketId=getOnlineUserIds(message.sender);
                if(senderSocketId){
                    console.log("senderSocketId",senderSocketId)
                    formatted_message.isOwn=true
                    console.log("formatted_message",formatted_message)
                    SenderMessage=formatted_message
                }
            }
        
        io.emit("newNotification", {sender:formatted_message.sender,receiverId:message.receiver});

     });
       return res.status(200).json(new apiResponse(200, SenderMessage, "Message forwarded"));
    } catch (error) {
        console.log(error)
    }
})

// let's get the all media of particular connection

const get_all_media = asyncHandler(async (req, res) => {
    try {
        const { receiverId } = req.params;
        const { senderId } = req.params;
        
       
        /*
        1. Get all the image and video files and create format 
        2. By aggregation pipeline
        */
       console.log(receiverId,senderId)
        const mediaMessages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new mongoose.Types.ObjectId(senderId), receiver: new mongoose.Types.ObjectId(receiverId) },
                        { sender: new mongoose.Types.ObjectId(receiverId), receiver: new mongoose.Types.ObjectId(senderId) }
                        
                    ]
                }
            },
           
            
            {
                $project: {
                    id:1,
                    images: 1,
                    video: 1,
                    createdAt: 1
                }
            },
            {
                $sort: { createdAt: -1 } // Sort by newest first
            },
     
        ]);

        // Transform the result to the desired format
        const result = {
            images: [],
            videos: []
        };
        
        for (const msg of mediaMessages) {
            if (msg.images) {
                result.images.push({
                    id: msg._id,
                    fileUrl: msg.images,
                    createdAt: msg.createdAt
                });
            }
            if (msg.video) {
                result.videos.push({
                    id: msg._id,
                    fileUrl: msg.video,
                    createdAt: msg.createdAt
                });
            }
        }
        
        return res.status(200).json(
            new apiResponse(200, result, "Media files fetched successfully")
        );
        
    } catch (error) {
        console.log(error);
        return res.status(500).json(
            new apiResponse(500, null, "Internal server error")
        );
    }delete_all_messages
});

// let's create controller for delete all messages
const delete_all_messages=asyncHandler(async(req,res)=>{
    try {
        const {receiverId}=req.body;
        console.log(receiverId)
        const {id}=req.user;
        if(!receiverId){
            return res.status(400).json(new apiResponse(400, null, "please provide receiverId"))
        }
        /*
        1.first find all message,
        2.insert id in deleted for array
        */
       await Message.updateMany({
        $or:[
            { sender: id, receiver: receiverId },
            { sender: receiverId, receiver: id }        ]
       },
       {
        $addToSet: { deletedFor: id }

       }
    )
    return res.status(200).json(
        new apiResponse(200, {}, "deleted successfully")
    );
    } catch (error) {
        console.log(error)
    }
})


export {
    store_messages,
    get_all_messages,
    update_message_status,
    update_message_array_received,
    update_message_array_seen,
    Notification,
    deleteMessage,
    forward_message,
    get_all_media,
    delete_all_messages   
}