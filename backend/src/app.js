import express from "express"
import http from "http"
import { ExpressPeerServer } from "peer";
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
let active = []

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
    if(selectedId && authUserId) {
    active.push({
      authUserId: authUserId, 
      selectedId: selectedId
  });
    } 
   // console.log(active)
    io.emit("onlineUser", Object.keys(userSocketMap));
   io.emit("getActiveUser", active);


   socket.on("block",({to,from})=>{
    const targetId=getOnlineUserIds(to);
  console.log(to,from)
    io.to(targetId).emit("blocked",{ 
      to,
      from
    })
  })

  socket.on("unBlock",({to,from})=>{
    const targetId=getOnlineUserIds(to);
  console.log(to,from)
    io.to(targetId).emit("unBlocked",{ 
      to,
      from
    })
  })
  
   
   socket.on('delete_active_user', ({ authUserId, selectedId }) => {
    // First check if either ID is null or undefined
    if (!authUserId || !selectedId) {
      console.log('Invalid IDs received:', authUserId, selectedId);
      return; // Exit early if either ID is missing
    }
    
    console.log('Deleting active user:', authUserId, selectedId);
    
    // Remove the specific pair that matches both IDs exactly
    active = active.filter(pair => 
      !(pair.authUserId === authUserId && pair.selectedId === selectedId)
    );
    
    io.emit('getActiveUser', active);
  });

  socket.on('delete_authUserMatchId', (userId) => {
    // console.log(userId)
    active = active.filter(pair => 
      !(pair.authUserId === userId )
    );
    io.emit('getActiveUser', active);
});


//send real time last scene

socket.on("lastScene", (userId) => {
  io.emit("new_Date", {userId, newDate: Date.now()})
})

 


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

        // console.log("Groups joined:", groupSocketMap);
    });

 // In socket.on("connection")
socket.on("call-user", ({ to, from,offer }) => {
    const receiverSocket=getOnlineUserIds(to)
    if (receiverSocket) {
      io.to(receiverSocket).emit("incoming-call", {
        from,
        to,
        offer 
      });
    }
  });
   
      
  socket.on("accept-call", ({from, to ,answer}) => {
    const callerSocket = getOnlineUserIds(to);
    if (callerSocket) {
      io.to(callerSocket).emit("call-accepted",{answer});
    }
  });
  
    
  socket.on("decline", ({ to }) => {
    console.log("user",to)
    const targetSocketId = getOnlineUserIds(to);  // this should return caller's socket ID
    if (targetSocketId) {
        console.log("yes")
      io.to(targetSocketId).emit("decline",{
        to
      });
    }
  });


  socket.on("ice-candidate", ({ candidate, to }) => {
    console.log(`Received ICE candidate for ${to}`);
    const targetSocketId = getOnlineUserIds(to);
    if (targetSocketId) {  
      console.log(`Forwarding ICE candidate to ${to} (${targetSocketId})`);
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    } else {
      console.log(`Target user ${to} is not online`);
    }
  });

  socket.on("endCall",({to,from})=>{
    const targetId=getOnlineUserIds(to);
    if(targetId){
        io.to(targetId).emit("endCall",{
            to,
            from
        })
    }
  })

//let' create real time block and un block  function

  
    // ✅ Clear a specific user's active chats
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