import express from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { List, GetData, Delete, Approval, AttachmentSubmittion, getAllAttachment, submitPayment } from "../controller/ContractController";
import { listByContract as approvalLogList } from "../controller/ContractApprovalLogController";
import path from "path";
import fs from "fs";
const multer = require('multer');

const router = express.Router();

const upload_path = path.join(__dirname, "../uploads/contracts");
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
router.post('/attachmentSubmittion', authMiddleware, upload.array("attachments", 3), AttachmentSubmittion);
router.get('/getData', authMiddleware, GetData);
router.post('/delete', authMiddleware, Delete);
router.post('/approval', authMiddleware, Approval);
router.get('/getAllAttachment', authMiddleware, getAllAttachment);
router.post('/submitPayment', authMiddleware, submitPayment);
router.get('/approvalLogs', authMiddleware, approvalLogList);

export default router;
