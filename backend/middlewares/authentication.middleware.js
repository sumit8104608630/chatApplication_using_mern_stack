import {setUser,get_user,refreshToken} from "../services/authenticate.service.js"
import {apiResponse} from "../util/apiResponse.js"
import User from "../models/user.model.js"
import jwt from "jsonwebtoken"

const {verify} =jwt;

const checkAuthenticationCookie=(cookieName)=>{
return async(req,res,next)=>{
    try {
        const cookie=req.cookies[cookieName];
        if(!cookie){
            return res.status(401).json({ message: "Unauthorized: No cookie provided.",statusCode:401 });
        }
        const user =await get_user(cookie);
        if(user.error){
            const refreshToken=req.cookies.refresh_token;
            if(!refreshToken){
                return res.status(401).json({ message: "Unauthorized: No refresh token provided.",statusCode:401 });
            }
            const {id}=await verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
            if(!id){
                return res.status(401).json({ message: "Unauthorized: Invalid refresh token."})
            }
            // get form the user db
            const user=await User.findById(id);
            if(!user){
                return res.status(401).json({ message: "Unauthorized: User not found."})
            }
            const new_accessToken=await setUser(user);
            const new_refreshToken=await refreshToken(user);
            req.user=user;
            res.status(200).cookie('accessToken',new_accessToken,{
                httpOnly:true,
                secure:true,
            }).cookie("refresh_token",new_refreshToken,{
                httpOnly:true,
                secure:true,
            }).json(new apiResponse(
                200,
            
                    loginUser
                ,
                "user logged in successfully"
            ))
        }
        if(!user){
            return res.status(401).json({ message: "Unauthorized: User not found."})
        }
        const currentUserDetail=await User.findById(user.id).select("-password -phoneNumber -salt -refreshToken")
        if(!currentUserDetail){
            return res.status(401).json({ message: "Unauthorized: User not found."})
        }
        req.user=currentUserDetail;

        next()
        
    } catch (error) {
        console.log(error)
           // console.error("Authentication error:", error.message || error);
      return res.status(500).json({ message: "Internal server error." });
    }
}
}

export{checkAuthenticationCookie}