import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { connectDB } from "./config/Db";
import userRoutes from "./routes/UserRoutes"; 

connectDB();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
