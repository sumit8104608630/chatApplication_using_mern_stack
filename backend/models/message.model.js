import mongoose from "mongoose";

const MessageSchema=mongoose.Schema({
    message:{
        type:String,
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
    status:{
        type:String,
        enum: ["sent", "delivered", "seen"],
        default: "sent"
    },
},{ timestamps: true });


 const Message=mongoose.model(MessageSchema,MessageSchema);
 export default Message;


