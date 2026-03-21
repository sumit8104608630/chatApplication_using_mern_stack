import { asyncHandler } from "../util/asyncHandler.js";
import {apiResponse} from "../util/apiResponse.js"
import {apiError} from "../util/apiError.js"
import {createClient} from "redis"
const redis_url=process.env.REDIS_URL

const client=createClient({
    url : redis_url
})

client.on("error",(error)=>console.log(error));

const call_info=asyncHandler(async(req,res)=>{
    try {
            const {to,from,calling} = req.body;
            if(to==""||from==""||calling==""){
              return  res.status(200).json(new  apiResponse(200,"","call save success"))
            }
            else{
                const data={
                    to,
                    from,
                    calling,
                }
                client.set("",data)
            }
    } catch (error) {
        
    }
})