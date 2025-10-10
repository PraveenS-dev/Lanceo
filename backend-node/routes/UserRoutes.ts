import express, { Request, Response } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { Register, Login, uniqueEmail, uniqueUserName, fetchUser, getCurrentUser, getUserName } from "../controller/Admin/UserController";

const router = express.Router();

// Public routes
router.post('/register', Register);
router.post('/login', Login);
router.post('/uniqueEmail', uniqueEmail);
router.post('/uniqueUserName', uniqueUserName);

// Protected routes (require authentication)
router.get('/fetchUser', fetchUser);
router.get('/me', authMiddleware, getCurrentUser);
router.get('/getUserName', authMiddleware, getUserName);

export default router;
