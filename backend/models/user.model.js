import mongoose from "mongoose"
import bcrypt from "bcrypt"
import {setUser,fun_refreshToken} from "../services/authenticate.service.js"
const UserSchema=new mongoose.Schema({
name:{
    type:String,
    required:true
},
phoneNumber:{
    type:String,
    required:true,
    unique:true,
},
email:{ 
    type:String,
    unique:true,
    required:true,
},
password:{
    type:String,
    required:true
},
salt:{
    type:String,
},
avatar:{
    type:String,
},
profilePhoto:{
    type:String,
    default:"../public/default.png"
},
contacts: [
    {
      name: String,
      phone: {
        type: String,
      },

      save_contact:{
        type:Boolean,
        default:false
      },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }
  ],
status: { 
    type: String, 
    default: "Hey there! I'm using ChatApp."
},
lastSeen:{
    type:String,
    default:Date.now()
},
refreshToken:{
    type:String,
    },

},{ timestamps: true });

UserSchema.pre('save', async function (next) {
    try {
        const user = this;
        if (!user.isModified('password')) return next();
        const salt = await bcrypt.genSalt(10);
        user.salt = salt;
        user.password = await bcrypt.hash(user.password, salt);
        
        next();  // 🔥 **Important: Call next() to continue saving the user**
    } catch (error) {
        next(error);  // Pass error to Mongoose
    }
});


UserSchema.static("matchPasswordGenerateToken",async function(phoneNumber,password){
try {
    const user=await this.findOne({phoneNumber:phoneNumber})
    if(!user){
        throw new Error("User not found");
    }
    const salt=user.salt;
    const hashedPassword=await bcrypt.hash(password,salt);
    if(hashedPassword!==user.password){
        return ({ success: true, message: "Invalid password" });
    }
    const token=await setUser(user);
    const refresh_token=await fun_refreshToken(user);
    return {token,refresh_token};
} catch (error) {
    console.log(error)
    throw new Error(error.message);
}
})

const User =mongoose.model("User",UserSchema)

export default User