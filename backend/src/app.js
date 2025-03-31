import express from "express"
import http from "http"
import cookieParser from "cookie-parser"
import {Server} from "socket.io"
import cors from "cors"
const app = express();
const server = http.createServer(app)
const origin = process.env.ORIGIN

export const io = new Server(server, {
    cors: {
        origin: origin,
        methods: ["GET", "POST"],
        credentials: true
    }
})

const userSocketMap = {} // {userId: socketId}
let active = [] // array of objects: [{authUserId: "123", selectedUserId: "456"}, ...]

// Socket.io event handling when a client connects
io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);
    
    const userId = socket.handshake.query.userId // this userId will come from the frontend
    const authUserId = socket.handshake.query.authUserId
    
    if(userId) {
        userSocketMap[userId] = socket.id
    }
    
    const selectedId = socket.handshake.query.selected_id
    if(selectedId && authUserId) {
      
       
    
       
            // Add both directions of the relationship
            active.push({
                authUserId: authUserId,
                selectedId: selectedId
            });
            // Also add the reverse relationship
        
        
      
    }
    
    io.emit("onlineUser", Object.keys(userSocketMap))
    io.emit('getActiveUser', active);
    console.log("Updated active conversations:", active);

    socket.on('delete_active_user', (userId) => {
        // Remove all conversation pairs involving this user
        active = active.filter(pair => 
            pair.authUserId !== userId && pair.selectedUserId !== userId
        );
        
        // Broadcast updated active users list
        io.emit('getActiveUser', active);
        console.log("Active conversations after deletion:", active);
    });
    
    socket.on('delete_all_previous_activeUser', () => {
        active = [];
        
        // Broadcast updated active users list
        io.emit('getActiveUser', active);
    });
    
    socket.on('disconnect', () => {
        console.log('disconnected');
        delete userSocketMap[userId];
        io.emit("onlineUser", Object.keys(userSocketMap));
    });
});

// Return the socket ID of an online user
export function getOnlineUserIds(userId) {
    return userSocketMap[userId];
}

// Return all active conversations involving this user
export function getActiveUserId(userId) {
    return active.filter(pair => 
        pair.authUserId === userId || pair.selectedUserId === userId
    );
}

app.use(cors({
    origin: origin,
    credentials: true,
}));
app.use(express.json({limit:"1mb"}));
app.use(express.urlencoded({limit:"16kb", extended:true}));
app.use(express.static("public"));
app.use(cookieParser());

import userRoutes from "../routes/user.routes.js";
import messageRoute from "../routes/message.routes.js";
app.use("/user", userRoutes);
app.use("/message", messageRoute);

export default server;