import express from "express"
import http from "http"
import cookieParser from "cookie-parser"
import {Server} from "socket.io"
import cors from "cors"
const app =express();
const server =http.createServer(app)
const origin=process.env.ORIGIN

export const io=new Server(server,{
    cors: {
        origin: origin,
        methods: ["GET", "POST"],
        credentials: true
    }
})

// Socket.io event handling when a client connects
io.on("connection",(socket)=>{
    console.log(`A user connected: ${socket.id}`);


    socket.on('disconnect', () => {
        console.log('disconnected')
    })


})

app.use(cors({origin:origin,
    credentials:true,
}))
app.use(express.json({limit:"1mb"}));
app.use(express.urlencoded({limit:"16kb",extended:true}));
app.use(express.static("public"))
app.use(cookieParser())

import userRoutes from "../routes/user.routes.js"
app.use("/user",userRoutes);

export default app