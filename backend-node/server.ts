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

// Static files
app.use("/api/uploads/projects", express.static(uploadsDir));

// Routes
app.use("/api", userRoutes);
app.use("/api/projects", ProjectRoutes);
app.use("/api/notifications", NotificationRouter);
app.use("/api/LeftMenu",LeftMenuRoutes)

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  socket.on("join", (userId) => {
    socket.join(`notification_${userId}`);
    console.log(`✅ User ${userId} joined their personal room`);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected: " + socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
