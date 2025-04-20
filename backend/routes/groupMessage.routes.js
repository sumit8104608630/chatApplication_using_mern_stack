import express from "express"
import {checkAuthenticationCookie} from "../middlewares/authentication.middleware.js"
import {store_groupMessages,get_all_messages} from "../controllers/groupMessage.controller.js"
import {upload} from "../middlewares/multer.middleware.js"

const groupMessageRoute=express.Router();


groupMessageRoute.post("/save_groupMessage",checkAuthenticationCookie("accessToken"),upload.fields([{ name: "file", maxCount: 1 },{ name: "image", maxCount: 1 },{ name: "video", maxCount: 1 }]),store_groupMessages);
groupMessageRoute.get("/get_all_groupMessage/:groupId",checkAuthenticationCookie("accessToken"),get_all_messages);
export default groupMessageRoute;