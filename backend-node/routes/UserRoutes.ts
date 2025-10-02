import express, { Request, Response } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { Register, Login, uniqueEmail, uniqueUserName, fetchUser, getCurrentUser } from "../controller/Admin/UserController";

const router = express.Router();

// Public routes
router.post('/register', Register);
router.post('/login', Login);
router.post('/uniqueEmail', uniqueEmail);
router.post('/uniqueUserName', uniqueUserName);

// Protected routes (require authentication)
router.get('/fetchUser', fetchUser);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
