import User, { IUser } from "../../model/User";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { Request, Response } from "express";
import Contracts from "../../model/Contracts";

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
        return res.status(500).json({ message: err });
    }
}

const Login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const existUser = await User.findOne({ email });
        if (!existUser) return res.status(400).json({ message: "Invalid credentials !" });

        if (existUser.trash === "YES") {
            return res.status(400).json({ message: "Your account has been deleted please contact support!" });
        } else if (existUser.status === 0) {
            return res.status(400).json({ message: "Your account has been deactivated please contact support!" });
        }

        const isMatch = await bcrypt.compare(password, existUser.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials !" });

        const { password: _, ...userDataWithoutPass } = existUser.toObject();

        const payload = { userId: (existUser._id as any).toString() };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: 86400 }); // 24 hours in seconds

        res.json({
            token,
            user: { id: existUser._id, name: existUser.name, email: existUser.email, role: existUser.role }
        });
    }
    catch (err) {
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
                created_at: user.created_at
            }
        });
    } catch (err) {
        console.error("Get current user error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

const getUserName = async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;

        const user = await User.findById(userId).select("name");
        const userName = user?.name;
        return res.status(200).json({ name: userName })

    } catch (err) {
        console.error("Fetch user error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export { Register, Login, uniqueEmail, uniqueUserName, fetchUser, getCurrentUser, getUserName };

// Update profile image (expects multer to have saved file on disk as req.file)
const updateProfileImage = async (req: any, res: any) => {
    try {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const file = req.file;
        if (!file) return res.status(400).json({ message: 'Image is required' });

        // Build public URL - server serves users uploads at /api/uploads/users
        const profileUrl = `/uploads/users/${file.filename}`;

        await User.findByIdAndUpdate(user._id, { profile_url: profileUrl });

        return res.status(200).json({ success: true, profile_url: profileUrl });
    } catch (err) {
        console.error('updateProfileImage error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Update cover image
const updateCoverImage = async (req: any, res: any) => {
    try {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const file = req.file;
        if (!file) return res.status(400).json({ message: 'Image is required' });

        const coverUrl = `/uploads/users/${file.filename}`;

        await User.findByIdAndUpdate(user._id, { cover_url: coverUrl });

        return res.status(200).json({ success: true, cover_url: coverUrl });
    } catch (err) {
        console.error('updateCoverImage error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};


// Update basic profile info: name, profile_description, upi_id
const updateProfileInfo = async (req: any, res: any) => {
    try {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const { name, profile_description, upi_id } = req.body;

        const updateData: any = {};
        if (typeof name !== 'undefined') updateData.name = name;
        if (typeof profile_description !== 'undefined') updateData.profile_description = profile_description;
        if (typeof upi_id !== 'undefined') updateData.upi_id = upi_id;

        await User.findByIdAndUpdate(user._id, updateData, { new: true });

        return res.status(200).json({ success: true, data: updateData });
    } catch (err) {
        console.error('updateProfileInfo error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getReviewData = async (req: any, res: any) => {
    try {
        const { user_id, user_role } = req.query;

        const reviewArray: {
            profile_url: string[];
            name: string[];
            rating: number[];
            review: string[];
        } = {
            profile_url: [],
            name: [],
            rating: [],
            review: [],
        };

        let contracts;

        if (user_role == 2) {
            // Freelancer → Get reviews given by clients
            contracts = await Contracts.find({ freelancer: user_id, client_rating_status: 1 });
            for (const data of contracts) {
                const userData = await User.findById(data.created_by).select("profile_url name");
                reviewArray.profile_url.push(userData?.profile_url || "");
                reviewArray.name.push(userData?.name || "");
                reviewArray.rating.push(data.client_rating || 0);
                reviewArray.review.push(data.client_review || "");
            }
        } else if (user_role == 3) {
            // Client → Get reviews given by freelancers
            contracts = await Contracts.find({ created_by: user_id, freelancer_rating_status: 1 });
            for (const data of contracts) {
                const userData = await User.findById(data.freelancer).select("profile_url name");
                reviewArray.profile_url.push(userData?.profile_url || "");
                reviewArray.name.push(userData?.name || "");
                reviewArray.rating.push(data.freelancer_rating || 0);
                reviewArray.review.push(data.freelancer_review || "");
            }
        }

        return res.status(200).json({
            success: true,
            data: reviewArray,
        });
    } catch (err) {
        console.error("getReviewData error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

const List = async (req: Request, res: Response) => {

    try {
        const { name, role, email, page } = req.query;

        const currentPage = parseInt(page as string) || 1;
        const limit = 10;
        const skip = (currentPage - 1) * limit;

        const searchCondition: any = { trash: "NO" };

        if (name) searchCondition.name = { $regex: name, $options: "i" };
        if (role) searchCondition.role = role;
        if (email) searchCondition.email = email;

        const listData = await User.find(searchCondition)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(searchCondition);

        res.json({
            data: listData,
            totalPages: Math.ceil(total / limit),
            currentPage,
            totalRecords: total,
            res: req.query
        });

    } catch (err: any) {
        return res.status(500).json({ message: err });
    }
}

const Delete = async (req: Request, res: Response) => {
    try {

        const { id } = req.body;

        const data = await User.findByIdAndUpdate(id, { status: 0, trash: "YES", deletedAt: new Date(), });
        return res.status(200).json({ message: "User deleted Successfully!" });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const ChangeStatus = async (req: Request, res: Response) => {
    try {

        const { id, old_status } = req.body;

        let new_status = old_status == 1 ? 0 : 1;

        const data = await User.findByIdAndUpdate(id, { status: new_status });
        return res.status(200).json({ message: "Status Changed Successfully!" });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

export { updateProfileInfo, getReviewData, updateProfileImage, updateCoverImage, List, ChangeStatus, Delete };