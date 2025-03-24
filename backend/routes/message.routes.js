import express from "express"
import {checkAuthenticationCookie} from "../middlewares/authentication.middleware.js"
import {store_messages,get_all_messages} from "../controllers/message.controller.js"
import {upload} from "../middlewares/multer.middleware.js"

const messageRoute=express.Router();

messageRoute.post("/save_message",checkAuthenticationCookie("accessToken"),  upload.fields([{ name: "file", maxCount: 1 },{ name: "image", maxCount: 1 },]),store_messages);
messageRoute.get("/get_message/:id",checkAuthenticationCookie("accessToken"),get_all_messages);

export default messageRoute