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
const userSocketMap={}//{userId:socketId}
let active={}// selected id 
// Socket.io event handling when a client connects
io.on("connection",(socket)=>{
    console.log(`A user connected: ${socket.id}`);
    
    const userId=socket.handshake.query.userId// this userId will come from the frontend
   // console.log(userId)
    if(userId) {
        userSocketMap[userId]=socket.id
    }
    const selectedId=socket.handshake.query.selected_id
    if(selectedId){
       console.log(selectedId)
        active[selectedId]=socket.id
    }
    io.emit("onlineUser",Object.keys(userSocketMap))
    io.emit("getActiveUser",Object.keys(active))
    socket.on('delete_active_user', (userId) => {
        delete active[userId];
        // Broadcast updated active users list
        io.emit('getActiveUser', Object.keys(active));
    });
    socket.on('delete_all_previous_activeUser', (activeContact) => {
        active={};
        
        // Broadcast updated active users list
        io.emit('getActiveUser', Object.keys(active));
    });
    socket.on('disconnect', () => {
        console.log('disconnected')
        delete userSocketMap[userId]
        io.emit("onlineUser",Object.keys(userSocketMap))
    })


})

// let make function who return the online id when messaging the online user
export  function getOnlineUserIds(userId) {
    return userSocketMap[userId]
}
//let return selected user id
export function getActiveUserId(userId) {
    return active[userId]
}


app.use(cors({origin:origin,
    credentials:true,
}))
app.use(express.json({limit:"1mb"}));
app.use(express.urlencoded({limit:"16kb",extended:true}));
app.use(express.static("public"))
app.use(cookieParser())

import userRoutes from "../routes/user.routes.js"
import messageRoute from "../routes/message.routes.js"
app.use("/user",userRoutes);
app.use("/message",messageRoute)

export default server;