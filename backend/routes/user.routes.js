import express from "express"
import {userRegistration,user_login,user_logout,add_contact_no,get_all_contacts,getUserInfo} from "../controllers/user.controller.js"
const userRoutes=express.Router();
import {upload} from "../middlewares/multer.middleware.js"
import {checkAuthenticationCookie} from "../middlewares/authentication.middleware.js"



userRoutes.post("/register",upload.single("profilePhoto"),userRegistration);
userRoutes.post("/login",upload.single("profilePhoto"),user_login);
userRoutes.get("/logout",checkAuthenticationCookie("accessToken"),user_logout);
userRoutes.post("/contact",checkAuthenticationCookie("accessToken"),add_contact_no);
userRoutes.get("/get_contact",checkAuthenticationCookie("accessToken"),get_all_contacts);
userRoutes.get("/userInfo",checkAuthenticationCookie("accessToken"),getUserInfo);


export default userRoutes 