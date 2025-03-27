import express from "express"
import {checkAuthenticationCookie} from "../middlewares/authentication.middleware.js"
import {store_messages,get_all_messages,update_message_status,update_message_array_received} from "../controllers/message.controller.js"
import {upload} from "../middlewares/multer.middleware.js"

const messageRoute=express.Router();

messageRoute.post("/save_message",checkAuthenticationCookie("accessToken"),  upload.fields([{ name: "file", maxCount: 1 },{ name: "image", maxCount: 1 },]),store_messages);
messageRoute.get("/get_message/:id",checkAuthenticationCookie("accessToken"),get_all_messages);
messageRoute.post("/update_message_status",checkAuthenticationCookie("accessToken"),update_message_status);
messageRoute.post("/update_message_array_received",checkAuthenticationCookie("accessToken"),update_message_array_received);

export default messageRoute