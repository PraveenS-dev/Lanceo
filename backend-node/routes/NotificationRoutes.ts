import express from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { GetData, ViewNotification } from "../controller/Admin/NotificationController";

const router = express.Router();

router.get("/getdata", authMiddleware, GetData)
router.post("/notificationLog/store", authMiddleware, ViewNotification)

export default router;