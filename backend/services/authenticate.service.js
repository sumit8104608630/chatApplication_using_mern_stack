import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config({path:"./.env"})
dotenv.config();
const access_secrete=process.env.ACCESS_SECRET;

const setUser=(user)=>{
try {
    if(!user){
        return {error:"User not found"};
    }
    const payload={
        id:user.id,
        name:user.name,
        email:user.email
    }
    const token=jwt.sign(payload,access_secrete,{
        expiresIn:process.env.ACCESS_EXPIRE
    });
    return token;
} catch (error) {
    console.log(error)
}
}

const fun_refreshToken=async(user)=>{
    if(!user){
        return {error:"user not found"};
    }
    const payLoad={
        id:user._id,
    };
    const refresh_token=jwt.sign(payLoad,process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:process.env.REFRESH_EXPIRE
    });
    return refresh_token;
    
}

const get_user=(token)=>{
    try {
       if (token) {
        
         const payload=jwt.verify(token,access_secrete);
         if(!payload){
             return {error:"Invalid token"};
         }
         return payload;
       }
       else{
        return null
       }
    } catch (error) {
        console.log(error)
        return({
            error:"Invalid token",
            status:401,
            success:false
        })
    }
}


export{
    setUser,
    fun_refreshToken,
    get_user
}