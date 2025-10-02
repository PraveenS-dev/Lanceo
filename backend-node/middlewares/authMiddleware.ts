import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../model/User";

const JWT_SECRET: string = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env file");
}

interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Fetch user data from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.status === 0 || user.trash === "YES") {
      return res.status(401).json({ message: "User account is disabled" });
    }

    // Attach user data to request object
    req.user = user;
    req.userId = (user._id as any).toString();
    
    next();
  } catch (err) {
    console.error("Token verify error:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;