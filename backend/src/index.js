import dotenv from "dotenv"
dotenv.config({path:"./.env"})
dotenv.config();

import server from "./app.js"
import {connectio_to_data_base} from "../connection/connect.js"

connectio_to_data_base().then(()=>{
    server.on("error",(error)=>{
        console.error(error)
    }),
    server.listen(process.env.PORT||6000,()=>{
        console.log(`server is running on port ${process.env.PORT}`)
    })   , console.log("mongoDB is connected successfully ");

}).catch((error)=>{console.log({message:`error ${error}`})})