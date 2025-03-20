import { asyncHandler } from "../util/asyncHandler.js";
import {apiResponse} from "../util/apiResponse.js"
import {apiError} from "../util/apiError.js"
import Message from  "../models/message.model.js"
import mongoose from "mongoose";
// let's create function to store messages
const store_messages=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;
        const {message,status,receiverId}=req.body;
        if([message,status,receiverId].some(item=>item==""||item==undefined)){
            return res.status(400).json(new apiResponse(400, "", "Please fill all the detail"));
        }
        const newMessage=await Message.create({message:message,sender:id,receiver:receiverId,status:status});
        return res.status(201).json(new apiResponse(201, newMessage, "Message sent successfully"));
    } catch (error) {
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