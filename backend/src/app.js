import express from "express"
import http from "http"
import {ExpressPeerServer} from "peer"
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
    console.log(`User connected: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    const authUserId = socket.handshake.query.authUserId;
    const selectedId = socket.handshake.query.selected_id;

    // ✅ Map user to socket
    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    // ✅ Handle 1-to-1 active user logic
    if (authUserId && selectedId) {
        active.push({ authUserId, selectedId });
    }


    // ✅ Handle group joining (if groupIds provided)
    socket.on("join-groups", (groupsIdString) => {
        if (groupsIdString && groupsIdString !== "undefined") {
            const groupIds = groupsIdString.split(",");
            groupIds.forEach(groupId => {
                socket.join(groupId);

                if (!groupSocketMap[groupId]) {
                    groupSocketMap[groupId] = [];
                }

                if (!groupSocketMap[groupId].includes(socket.id)) {
                    groupSocketMap[groupId].push(socket.id);
                }
            });
        }

        console.log("Groups joined:", groupSocketMap);
    });

 // In socket.on("connection")
socket.on("call-user", ({ to, from }) => {
    const receiverSocket=getActiveUserId(to)
    if (receiverSocket) {
      io.to(receiverSocket).emit("incoming-call", {
        from,
        to
      });
    }
  });
  
      
  socket.on("accept-call", ({ to }) => {
    const callerSocket = getOnlineUserIds(to);
    if (callerSocket) {
      io.to(callerSocket).emit("call-accepted");
    }
  });
  
    
    socket.on("end-call", ({ to }) => {
        const targetSocketId = getOnlineUserIds(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit("call-ended");
        }
    });
    

    // Emit initial data
    io.emit("onlineUser", Object.keys(userSocketMap));
    io.emit("getActiveUser", active);

    // ✅ Clear a specific user's active chats
    socket.on('delete_active_user', (userId) => {
        active = active.filter(pair =>
            pair.authUserId !== userId && pair.selectedId !== userId
        );
        io.emit('getActiveUser', active);
    });

    socket.on('delete_all_previous_activeUser', () => {
        active = [];
        io.emit('getActiveUser', active);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        delete userSocketMap[userId];

        for (const groupId in groupSocketMap) {
            groupSocketMap[groupId] = groupSocketMap[groupId].filter(id => id !== socket.id);
            if (groupSocketMap[groupId].length === 0) {
                delete groupSocketMap[groupId];
            }
        }

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