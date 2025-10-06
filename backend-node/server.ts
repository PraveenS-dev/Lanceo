import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { connectDB } from "./config/Db";
import userRoutes from "./routes/UserRoutes"; 
import ProjectRoutes from "./routes/ProjectRoutes"

connectDB();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api", userRoutes);
app.use("/api/projects", ProjectRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
