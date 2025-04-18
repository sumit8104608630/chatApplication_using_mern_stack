import mongoose from "mongoose";

//let's create a group schema for the group message sending

const groupMessageSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
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
// further we will add feature of sent,received and seen 
},{
    timestamps: true, // adds createdAt & updatedAt
  });

const GroupMessages= mongoose.model("GroupMessages",groupMessageSchema);

export default GroupMessages