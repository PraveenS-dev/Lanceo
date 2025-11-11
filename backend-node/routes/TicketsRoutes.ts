import express from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { List, GetData, Store,GetExitData } from "../controller/Admin/TicketsController";

const router = express.Router();

router.post("/store", authMiddleware, Store);
router.get("/list", authMiddleware, List);
router.get("/getData", authMiddleware, GetData);
router.get("/getExitData", authMiddleware, GetExitData);

export default router;