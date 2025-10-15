import express from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { Delete, GetData, List, Store, getLastData, Approval } from "../controller/BittingController";

const router = express.Router();

router.get('/list', authMiddleware, List);
router.post('/store', authMiddleware, Store);
router.get('/getData', authMiddleware, GetData);
router.post('/delete', authMiddleware, Delete);
router.get('/getLastData', authMiddleware, getLastData);
router.post('/approval', authMiddleware, Approval);

export default router;
