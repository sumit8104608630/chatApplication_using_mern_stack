import express from "express"
import {checkAuthenticationCookie} from "../middlewares/authentication.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import {create_group} from "../controllers/userGroup.controller.js"

const groupRoute=express.Router();
groupRoute.post("/create_group",checkAuthenticationCookie("accessToken"),upload.single("groupImage"),create_group);

export default groupRoute;
