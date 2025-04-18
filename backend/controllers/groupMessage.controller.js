import { asyncHandler } from "../util/asyncHandler.js";
import {apiResponse} from "../util/apiResponse.js"
import {apiError} from "../util/apiError.js"
import path from "path"
import User from "../models/user.model.js"
import {uploadImageFile,uploadDocFile,uploadVideoFile} from "../util/cloudinary.js"
import GroupMessages from "../models/groupMessage.model.js";
import { fileURLToPath } from "url"; // Import to define __dirname
import {getOnlineUserIds, io} from "../src/app.js"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store_groupMessages=asyncHandler(async(req,res)=>{
    try {
        const {id}=req.user;
        const {message,groupId}=req.body;
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


           console.log(message_obj);

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
        
    } catch (error) {
        console.log(error)
                return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
        
    }
})

export {
    store_groupMessages,
    get_all_messages
}