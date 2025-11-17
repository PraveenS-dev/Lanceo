import express from "express";
import authMiddleware from "../middlewares/authMiddleware";
const multer = require('multer');
import path from "path";
import { Register, Login, uniqueEmail, uniqueUserName, fetchUser, getCurrentUser, getUserName, updateProfileImage, updateCoverImage, updateProfileInfo, getReviewData, List, ChangeStatus, Delete } from "../controller/Admin/UserController";

const router = express.Router();

// Multer setup for user images
const storage = multer.diskStorage({
	destination: function (req: any, file: any, cb: any) {
		cb(null, path.resolve(__dirname, "../uploads/users"));
	},
	filename: function (req: any, file: any, cb: any) {
		const unique = Date.now() + '_' + Math.round(Math.random() * 1e9);
		cb(null, unique + path.extname(file.originalname));
	}
});
const upload = multer({ storage });

// Public routes
router.post('/register', Register);
router.post('/login', Login);
router.post('/uniqueEmail', uniqueEmail);
router.post('/uniqueUserName', uniqueUserName);

// Protected routes (require authentication)
router.get('/fetchUser', fetchUser);
router.get('/me', authMiddleware, getCurrentUser);
router.get('/getUserName', authMiddleware, getUserName);
router.get('/list', authMiddleware, List);
router.post('/changeStatus', authMiddleware, ChangeStatus);
router.post('/delete', authMiddleware, Delete);

// Upload endpoints
router.post('/updateProfileImage', authMiddleware, upload.single('image'), updateProfileImage);
router.post('/updateCoverImage', authMiddleware, upload.single('image'), updateCoverImage);
router.post('/updateProfileInfo', authMiddleware, updateProfileInfo);
router.get('/getReviewData', authMiddleware, getReviewData);

export default router;
