import { asyncHandler } from "../util/asyncHandler.js";
import {apiResponse} from "../util/apiResponse.js"
import {apiError} from "../util/apiError.js"
import path from "path"
import User from "../models/user.model.js"
import {uploadImageFile,uploadDocFile,uploadVideoFile} from "../util/cloudinary.js"
import GroupMessages from "../models/groupMessage.model.js";
import { fileURLToPath } from "url"; // Import to define __dirname
import {getGroupId, io} from "../src/app.js";
import { Types } from 'mongoose' 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store_groupMessages=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;
        const {message,groupId}=req.body;
        const GroupId=await getGroupId(groupId)
        const user=await User.findById(id);
        
        console.log(GroupId)
       // const receiver=getOnlineUserIds(receiverId);
   //     const user=await User.findById(id);
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
            const message_obj=new GroupMessages({
                message,
                groupId:groupId,
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
                                    groupId:message_obj.groupId,
                                    file:message_obj.file,
                                    image:message_obj.images,
                                    video:message_obj.video,
                                    isOwn:true,
                                    profilePhoto:user.profilePhoto,
                                    sender:id,
                                    text:message,
                                    time:formattedTime
                                }
                               // Inside your store_groupMessages function
                            
                                // Create message for others
                                const messageForOthers = {
                                    ...format_message,
                                    isOwn: false
                                };
                                
                                // Send to the group room instead of individual members
                                io.to(GroupId).emit("groupNewMessage", messageForOthers);
                            
                            
                            console.log("selected:",GroupId)
                            format_message["isOwn"]=true
                            return res.status(201).json(new apiResponse(201,format_message, "Message sent successfully"));
        // Format hours and minutes (12-hour format with AM/PM)
            
        }
     catch (error) {
        console.log(error)
                return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
        
    }
});

// let get all the message and send as response 
const get_all_messages=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;

        if(!id){
            return res.status(401).json(new apiResponse(401, {}, "Unauthorized"));
        }
        const { groupId } = req.params;
        const objectIdGroupId = new Types.ObjectId(groupId);

        if(!groupId){
            return res.status(400).json(new apiResponse(400, {}, "groupId is required"));
        }
        // we will send the message by  converting into new format
        const messages=await GroupMessages.aggregate([
            {
            $match: {groupId:objectIdGroupId}
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
            $project: {
                id: { $toString: "$_id" },
                sender: { $toString: "$senderInfo._id" },
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
            }
        }
        ]);
        return res.status(200).json(new apiResponse(200, messages, "Messages"));
    } catch (error) {
        console.log(error)
                return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
})

export {
    store_groupMessages,
    get_all_messages
}