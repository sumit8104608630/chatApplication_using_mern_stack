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
const groupSocketMap={}// all active userGroup
let active = [] // array of objects: [{authUserId: "123", selectedUserId: "456"}, ...]

// Socket.io event handling when a client connects
io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);
    
    const userId = socket.handshake.query.userId // this userId will come from the frontend
    const authUserId = socket.handshake.query.authUserId
    if(userId) {
        userSocketMap[userId] = socket.id
    }
    const groupsIdString = socket.handshake.query.groupsId;
if (groupsIdString && groupsIdString !== "undefined") {
        const groupIds = groupsIdString ? groupsIdString.split(",") : [];    
        console.log(groupIds)
        if(groupIds?.length != 0) {
            groupIds.forEach(groupId => {
                socket.join(groupId);
    
                // Initialize array if not exists
                if (!groupSocketMap[groupId]) {
                    groupSocketMap[groupId] = [];
                }
                if (!groupSocketMap[groupId].includes(socket.id)) {
                    groupSocketMap[groupId].push(socket.id);
                }
            });
        }
}
    console.log(groupSocketMap)
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

    socket.on('delete_active_user', (userId) => {
        // Remove all conversation pairs involving this user
        active = active.filter(pair => 
            pair.authUserId !== userId && pair.selectedUserId !== userId
        );
        
        // Broadcast updated active users list
        io.emit('getActiveUser', active);
    });
    
    socket.on('delete_all_previous_activeUser', () => {
        active = [];
        // Broadcast updated active users list
        io.emit('getActiveUser', active);
    });
    
    socket.on('disconnect', () => {
        console.log('disconnected');
        delete userSocketMap[userId];
        
        // Remove this socket from all group mappings
        Object.keys(groupSocketMap).forEach(groupId => {
            const index = groupSocketMap[groupId].indexOf(socket.id);
            if (index !== -1) {
                groupSocketMap[groupId].splice(index, 1);
                if (groupSocketMap[groupId].length === 0) {
                    delete groupSocketMap[groupId];
                }
            }
        });
        
        
        io.emit("onlineUser", Object.keys(userSocketMap));
    });
});

// Return the socket ID of an online user
export function getOnlineUserIds(userId) {
    return userSocketMap[userId];
}
export function getGroupId(groupId){
    return groupSocketMap[groupId];
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
import groupRoute from  "../routes/group.routes.js"
import groupMessageRoute from "../routes/groupMessage.routes.js"
app.use("/user", userRoutes);
app.use("/message", messageRoute);
app.use("/group",groupRoute);
app.use("/groupMessage",groupMessageRoute);


export default server;