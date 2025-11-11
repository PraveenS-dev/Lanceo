import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";

import { connectDB } from "./config/Db";
import userRoutes from "./routes/UserRoutes";
import ProjectRoutes from "./routes/ProjectRoutes";
import NotificationRouter from "./routes/NotificationRoutes";
import LeftMenuRoutes from "./routes/LeftMenuRoutes";
import Messages from "./model/chats/Messages";
import MessageRoutes from "./routes/MessageRoutes";
import ChatList from "./model/chats/ChatList";
import ChatlistRoutes from "./routes/ChatlistRoutes";
import BittingRoutes from "./routes/BittingRoutes";
import ContractRoutes from "./routes/ContractorRoutes";
import { sendNotification } from "./controller/Admin/NotificationController";
import TransactionRoutes from "./routes/TransactionRoutes";
import TicketsRoutes from "./routes/TicketsRoutes";
// Start cron jobs (side-effect import)
import "./controller/Admin/CronController";

connectDB();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

app.use(cors());
app.use(express.json());

const uploadsDir = path.resolve(__dirname, "./uploads/projects");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const contractUploadsDir = path.resolve(__dirname, "./uploads/contracts");
if (!fs.existsSync(contractUploadsDir)) {
  fs.mkdirSync(contractUploadsDir, { recursive: true });
}

// Static files
app.use("/api/uploads/projects", express.static(uploadsDir));
app.use("/api/uploads/contracts", express.static(contractUploadsDir));

// Routes
app.use("/api", userRoutes);
app.use("/api/projects", ProjectRoutes);
app.use("/api/notifications", NotificationRouter);
app.use("/api/LeftMenu", LeftMenuRoutes)
app.use("/api/messages", MessageRoutes);
app.use("/api/chatlist", ChatlistRoutes);
app.use("/api/bittings", BittingRoutes);
app.use("/api/contracts", ContractRoutes);
app.use("/api/transactions", TransactionRoutes);
app.use("/api/tickets", TicketsRoutes);

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  socket.on("join", (userId) => {
    socket.join(`notification_${userId}`);
    socket.join(`user_${userId}`);
    console.log(`✅ User ${userId} joined notification and chat rooms`);
  });

  socket.on("join_user", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`✅ User ${userId} joined chat room user_${userId}`);
  });

  // Send message event
  socket.on("private_message", async ({ senderId, receiverId, message, userName }) => {
    try {
      const newMsg = await Messages.create({
        senderId,
        receiverId,
        message,
        createdAt: new Date(),
        isRead: false,
      });

      // Reload to ensure all defaults and schema fields are present when emitting
      const freshMsg = await Messages.findById(newMsg._id).lean();

      // Update or create chatlist for both users
      await Promise.all([
        ChatList.findOneAndUpdate(
          { userId: senderId, contactId: receiverId },
          { lastMessage: message, lastMessageTime: new Date(), $inc: { unreadCount: 0 } },
          { upsert: true }
        ),
        ChatList.findOneAndUpdate(
          { userId: receiverId, contactId: senderId },
          { lastMessage: message, lastMessageTime: new Date(), $inc: { unreadCount: 1 } },
          { upsert: true }
        ),
      ]);

      // Emit the message to receiver and confirmation to sender
      io.to(`user_${receiverId}`).emit("receive_message", freshMsg);
      io.to(`user_${senderId}`).emit("message_sent", freshMsg);

      // Send a notification to the receiver (persist and emit)
      try {
        const title = "New message";
        const subject = `${userName ?? senderId} sent you a message: ${message?.slice(0, 100)}`;
        // sendNotification expects assigned_users array and io instance
        await sendNotification({ title, subject, assigned_users: [receiverId], url: `/chat/${senderId}`, io });
      } catch (notifErr) {
        console.error("Failed to send notification for private_message:", notifErr);
      }
    } catch (err) {
      console.error("Error in private_message handler:", err);
    }
  });

  // Mark message as read
  socket.on("mark_as_read", async ({ senderId, receiverId }) => {
    await Messages.updateMany(
      { senderId, receiverId, isRead: false },
      { $set: { isRead: true } }
    );
    io.to(`user_${senderId}`).emit("messages_read", receiverId);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected: " + socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
