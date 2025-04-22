import express from "express"
import {checkAuthenticationCookie} from "../middlewares/authentication.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import {create_group,get_all_group,filterGroup} from "../controllers/userGroup.controller.js"

const groupRoute=express.Router();
groupRoute.post("/create_group",checkAuthenticationCookie("accessToken"),upload.single("groupImage"),create_group);
groupRoute.get("/get_all_group",checkAuthenticationCookie("accessToken"),get_all_group);
groupRoute.get("/filterGroup",checkAuthenticationCookie("accessToken"),filterGroup);
export default groupRoute;
