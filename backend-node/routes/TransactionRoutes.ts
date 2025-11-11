import express from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { List, GetData } from "../controller/TransactionController";

const router = express.Router();

router.get("/list", authMiddleware, List);
router.get("/getData", authMiddleware, GetData);

export default router;