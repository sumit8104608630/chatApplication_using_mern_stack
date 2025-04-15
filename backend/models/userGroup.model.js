// let's create  group model for creating group 
import mongoose from "mongoose"

const groupSchema= mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        default:null
    },
    groupImage:{
        type:String,
        default:null
    },
    members:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    admins:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }], 
},{
    timestamps:true
})
// let's create the module

groupSchema.path("admins").validate(function(value){
    return value.length<=3;
},"You can only assign up to 3 admins.")
const Group=mongoose.model("Group",groupSchema);

export default Group;