import express from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { List, Store, Edit, GetData, Delete, UniqueCheck, ExistUniqueCheck, getAllData, getAllParents, getParentName } from "../controller/Admin/LeftMenuController";

const router = express.Router();

router.get('/list', authMiddleware, List);
router.post('/store', authMiddleware, Store);
router.post('/update', authMiddleware, Edit);
router.get('/getData', authMiddleware, GetData);
router.post('/delete', authMiddleware, Delete);
router.post('/uniqueCheck', authMiddleware, UniqueCheck);
router.post('/ExistUniqueCheck', authMiddleware, ExistUniqueCheck);
router.get('/getAllData', authMiddleware, getAllData);
router.get('/getAllParents', authMiddleware, getAllParents);
router.get('/getParentName', authMiddleware, getParentName);

export default router;
