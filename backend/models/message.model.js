import mongoose from "mongoose";

const MessageSchema=mongoose.Schema({
    message:{
        type:String,
    },
    images:{
        type:String,
    },
    file:{
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


 const Message=mongoose.model("Message",MessageSchema);
 export default Message;


