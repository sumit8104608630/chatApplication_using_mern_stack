import express from "express"
import http from "http"
import cookieParser from "cookie-parser"
import { Server } from "socket.io"
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

const userSocketMap = {}  // { userId: socketId }
const groupSocketMap = {} // { groupId: [socketIds] }
let active = []

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    const userId      = socket.handshake.query.userId;
    const authUserId  = socket.handshake.query.authUserId;
    const selectedId  = socket.handshake.query.selected_id;

    // Map user → socket
    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    // Track 1-to-1 active chat pairs
    if (selectedId && authUserId) {
        active.push({ authUserId, selectedId });
    }

    io.emit("onlineUser", Object.keys(userSocketMap));
    io.emit("getActiveUser", active);

    // ── Block / Unblock ───────────────────────────────────────────────────────

    socket.on("block", ({ to, from }) => {
        const targetId = getOnlineUserIds(to);
        console.log(to, from);
        io.to(targetId).emit("blocked", { to, from });
    });

    socket.on("unBlock", ({ to, from }) => {
        const targetId = getOnlineUserIds(to);
        console.log(to, from);
        io.to(targetId).emit("unBlocked", { to, from });
    });

    // ── Active user management ────────────────────────────────────────────────

    socket.on("delete_active_user", ({ authUserId, selectedId }) => {
        if (!authUserId || !selectedId) {
            console.log("Invalid IDs received:", authUserId, selectedId);
            return;
        }
        console.log("Deleting active user:", authUserId, selectedId);
        active = active.filter(
            pair => !(pair.authUserId === authUserId && pair.selectedId === selectedId)
        );
        io.emit("getActiveUser", active);
    });

    socket.on("delete_authUserMatchId", (userId) => {
        active = active.filter(pair => pair.authUserId !== userId);
        io.emit("getActiveUser", active);
    });

    socket.on("lastScene", (userId) => {
        console.log("user ID", userId);
        active = active.filter(pair => pair.authUserId !== userId);
        io.emit("new_Date", { userId, newDate: Date.now() });
        io.emit("getActiveUser", active);
    });


        // ── call ────────────────────────────────────────────────────────────────
socket.on("call-user", ({ to, from, offer }) => {
  const toSocket = getOnlineUserIds(to);
  if (!toSocket) {
    console.log(`[call-user] user ${to} is offline`);
    // Optionally notify caller that user is offline:
    socket.emit("call-unavailable", { to });
    return;
  }
  io.to(toSocket).emit("incoming_call", {
    from,   // caller's user object (name, photo, _id etc.)
    to,     // callee's userId — used by ChatHomePage to guard the popup
    offer,  // SDP offer
  });
});
 
// ── THIS WAS THE MAIN BUG: handler was empty, answer never reached caller ──
socket.on("accept-call", ({ to, from, answer }) => {
  const toSocket = getOnlineUserIds(to); // 'to' is the caller's userId
  if (!toSocket) {
    console.log(`[accept-call] caller ${to} is no longer online`);
    return;
  }
  // Forward the SDP answer back to the caller so they can call setAnswer()
  io.to(toSocket).emit("call-accepted", {
    from,   // callee's user object
    answer, // SDP answer — caller needs this
  });
  console.log(`[accept-call] answer forwarded to caller ${to}`);
});


    // ── Groups ────────────────────────────────────────────────────────────────

    socket.on("join-groups", (groupsIdString) => {
        if (groupsIdString && groupsIdString !== "undefined") {
            const groupIds = groupsIdString.split(",");
            groupIds.forEach(groupId => {
                socket.join(groupId);
                if (!groupSocketMap[groupId]) groupSocketMap[groupId] = [];
                if (!groupSocketMap[groupId].includes(socket.id)) {
                    groupSocketMap[groupId].push(socket.id);
                }
            });
        }
    });

    // ── Messages seen ─────────────────────────────────────────────────────────

    socket.on("messages_seen", ({ to }) => {
        const senderSocketId = getOnlineUserIds(to);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messages_seen", { by: userId });
        }
    });

    // ── Disconnect ────────────────────────────────────────────────────────────

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        delete userSocketMap[userId];

        for (const groupId in groupSocketMap) {
            groupSocketMap[groupId] = groupSocketMap[groupId].filter(id => id !== socket.id);
            if (groupSocketMap[groupId].length === 0) delete groupSocketMap[groupId];
        }

        io.emit("onlineUser", Object.keys(userSocketMap));
    });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getOnlineUserIds(userId) {
    return userSocketMap[userId];
}

export function getGroupId(groupId) {
    return groupSocketMap[groupId];
}

export function getActiveUserId(userId) {
    return active.filter(
        pair => pair.authUserId === userId || pair.selectedUserId === userId
    );
}

// ── Express middleware ────────────────────────────────────────────────────────

app.use(cors({ origin: origin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

import userRoutes       from "../routes/user.routes.js";
import messageRoute     from "../routes/message.routes.js";
import groupRoute       from "../routes/group.routes.js";
import groupMessageRoute from "../routes/groupMessage.routes.js";
import { isTypedArray } from "util/types"
import { Socket } from "dgram"

app.use("/user",         userRoutes);
app.use("/message",      messageRoute);
app.use("/group",        groupRoute);
app.use("/groupMessage", groupMessageRoute);

export default server;