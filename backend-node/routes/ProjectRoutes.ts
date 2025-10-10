import express from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { List, Store, Edit, GetData, Delete, UniqueCheck, ExistUniqueCheck } from "../controller/ProjectsController";
import path from "path";
import fs from "fs";
const multer = require('multer');

const router = express.Router();

const upload_path = path.join(__dirname, "../uploads/projects");
if (!fs.existsSync(upload_path)) {
    fs.mkdirSync(upload_path, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => cb(null, upload_path),
    filename: (req: any, file: any, cb: any) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.get('/list', authMiddleware, List);
router.post('/store', authMiddleware, upload.array("attachments", 3), Store);
router.post('/update', authMiddleware, upload.array("attachments", 3), Edit);
router.get('/getData', authMiddleware, GetData);
router.post('/delete', authMiddleware, Delete);
router.post('/uniqueCheck', authMiddleware, UniqueCheck);
router.post('/ExistUniqueCheck', authMiddleware, ExistUniqueCheck);

export default router;
