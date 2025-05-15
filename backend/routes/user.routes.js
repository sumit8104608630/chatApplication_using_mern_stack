import express from "express"
import {userRegistration,user_login,user_logout,add_contact_no,get_all_contacts,
        getUserInfo,check_user_present,update_Profile,searchUser,blockUser,unblock} from "../controllers/user.controller.js"
const userRoutes=express.Router();
import {upload} from "../middlewares/multer.middleware.js"
import {checkAuthenticationCookie} from "../middlewares/authentication.middleware.js"



userRoutes.post("/register",upload.single("profilePhoto"),userRegistration);
userRoutes.post("/login",user_login);
userRoutes.get("/logout",checkAuthenticationCookie("accessToken"),user_logout);
userRoutes.post("/contact",checkAuthenticationCookie("accessToken"),add_contact_no);
userRoutes.get("/get_contact",checkAuthenticationCookie("accessToken"),get_all_contacts);
userRoutes.get("/userInfo",checkAuthenticationCookie("accessToken"),getUserInfo);
userRoutes.post("/check",checkAuthenticationCookie("accessToken"),check_user_present);
userRoutes.put("/update_profile",checkAuthenticationCookie("accessToken"),update_Profile);
userRoutes.get("/searchUser",checkAuthenticationCookie("accessToken"),searchUser);
userRoutes.put("/block_user",checkAuthenticationCookie("accessToken"),blockUser);
userRoutes.put("/unblock_user",checkAuthenticationCookie("accessToken"),unblock);


export default userRoutes 