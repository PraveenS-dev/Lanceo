import express from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { MonthWiseProjects, BittingsStats, ContractsStats, TicketsStats, TransactionStats } from "../controller/Admin/DashboardController";

const router = express.Router();

router.get('/MonthWiseProjects', authMiddleware, MonthWiseProjects);
router.get('/BittingsStats', authMiddleware, BittingsStats);
router.get('/ContractsStats', authMiddleware, ContractsStats);
router.get('/TicketsStats', authMiddleware, TicketsStats);
router.get('/TransactionStats', authMiddleware, TransactionStats);

export default router;
