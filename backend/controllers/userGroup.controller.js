import { asyncHandler } from "../util/asyncHandler.js";
import {apiResponse} from "../util/apiResponse.js"
import {apiError} from "../util/apiError.js"
import {uploadGroupImageFile} from "../util/cloudinary.js"
import { fileURLToPath } from "url"; // Import to define __dirname

// Define __dirname manually in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import path from "path" 
import Group from "../models/userGroup.model.js";

// let's create group contact making 
const create_group = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user;

        if (!id) {
            return res.status(401).json(new apiResponse(401, {}, "Unauthorized"));
        }

        const { name, description, members } = req.body;
        const new_array_members=members.split(",").map((item)=>item.trim());

        if (!members || !Array.isArray(new_array_members) || new_array_members.length < 1) {
            return res.status(400).json(new apiResponse(400, {}, "At least one member is required"));
        }

        if (!req.file || !req.file.filename) {
            return res.status(400).json(new apiResponse(400, {}, "Group image is required"));
        }

        const local_path = path.join(__dirname, `../public/temp/${req.file.filename}`);

        const upload = await uploadGroupImageFile(local_path);
        console.log(upload)
        const group = {
            name,
            description,
            members:new_array_members,
            groupImage: upload.secure_url,
            admins: [id],
        };

        const new_group = await Group.create(group);

        return res.status(201).json(new apiResponse(201, new_group, "Group created successfully"));

    } catch (error) {
        console.error("Create Group Error:", error);
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
});

// let's create function which get all the group channel or contact
const get_all_group=asyncHandler(async(_,res)=>{
    try {
        //there will be two situation
        //1. user is admin of group
        //2. user is member of group
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
})

export{
    create_group,
    get_all_group
}