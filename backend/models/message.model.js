import mongoose from "mongoose";
import { type } from "os";

const MessageSchema=mongoose.Schema({
    message:{
        type:String,
    },
    images:{
        type:String,
        default:null
    },
    video:{
        type:String,
        default:null
    },
    file:{
        type:String,
        default:null
    },
    sender:{
        type:mongoose.Types.ObjectId,
        ref:"User",
        required:true
    },
    receiver:{
        type:mongoose.Types.ObjectId,
        ref:"User",
        required:true
    },
    deletedFor:[
        {
            type: mongoose.Types.ObjectId,
            ref: "User"
        }
    ],
    status:{
        type:String,
        enum: ["sent", "received", "seen"],
        default: "sent"
    },
},{ timestamps: true });


 const Message=mongoose.model("Message",MessageSchema);
 export default Message;


