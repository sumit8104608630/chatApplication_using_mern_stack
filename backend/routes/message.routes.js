import express from "express"
import {checkAuthenticationCookie} from "../middlewares/authentication.middleware.js"
import {store_messages,get_all_messages} from "../controllers/message.controller.js"
const messageRoute=express.Router();

messageRoute.post("/save_message",checkAuthenticationCookie("accessToken"),store_messages);
messageRoute.get("/get_message/:id",checkAuthenticationCookie("accessToken"),get_all_messages);

export default messageRoute