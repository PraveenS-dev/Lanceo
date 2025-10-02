import User, { IUser } from "../../model/User";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { Request, Response } from "express";

const JWT_SECRET: string = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'test';
const JWT_EXPIRES: string = process.env.JWT_EXPIRES_IN || '1d';

const Register = async (req: Request, res: Response) => {
    try {
        const { name, username, email, role, password } = req.body;

        console.log(req.body);

        if (name == "" || name == null) {
            return res.status(400).json({ message: "Name is Required!" })
        }
        if (username == "" || username == null) {
            return res.status(400).json({ message: "Username is Required!" })
        }
        if (email == "" || email == null) {
            return res.status(400).json({ message: "Email is Required!" })
        }
        if (role == "" || role == null) {
            return res.status(400).json({ message: "Role is Required!" })
        }
        if (password == "" || password == null) {
            return res.status(400).json({ message: "Password is Required!" })
        }

        if (await User.findOne({ $or: [{ email }, { username }] })) {
            return res.status(400).json({ message: "Email or username already in use" });
        }

        const HashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name: name, username: username, email: email, role: role, password: HashedPassword });
        await newUser.save();

        return res.status(200).json({ data: newUser });

    } catch (err: any) {
        console.log(err.message);
        return res.status(500).json({ message: err });
    }
}

const Login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const existUser = await User.findOne({ email, status: 1, trash: "NO" });
        if (!existUser) return res.status(400).json({ message: "Invalid credentials !" });

        const isMatch = await bcrypt.compare(password, existUser.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials !" });

        const { password: _, ...userDataWithoutPass } = existUser.toObject();

        const payload = { userId: (existUser._id as any).toString() };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: 86400 }); // 24 hours in seconds

        res.json({
            token,
            user: { id: existUser._id, name: existUser.name, email: existUser.email }
        });
    }
    catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

const uniqueEmail = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const existValue = await User.findOne({ email, trash: "NO", status: 1 });

        if (existValue) {
            return res.status(200).json({ data: true });
        } else {
            return res.status(200).json({ data: false });
        }

    } catch (err: any) {
        return res.status(500).json({ message: err.message || "Server error" });
    }
}

const uniqueUserName = async (req: Request, res: Response) => {
    try {
        const { username } = req.body;
        const existValue = await User.findOne({ username, trash: "NO", status: 1 });

        if (existValue) {
            return res.status(200).json({ data: true });
        } else {
            return res.status(200).json({ data: false });
        }

    } catch (err: any) {
        console.log(err.message);

        return res.status(500).json({ message: err.message || "Server error" });
    }
}

const fetchUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.query;

        if (!id) return res.status(400).json({ message: "User ID is required" });

        const userDetails = await User.findById(id).select('-password');

        if (!userDetails) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ userDetails });
    } catch (err) {
        console.error("Fetch user error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get current user using auth middleware
const getCurrentUser = async (req: Request, res: Response) => {
    try {
        // This function expects req.user to be set by authMiddleware
        const user = (req as any).user;
        
        if (!user) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        return res.status(200).json({ 
            success: true,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                status: user.status,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error("Get current user error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

export { Register, Login, uniqueEmail, uniqueUserName, fetchUser, getCurrentUser };