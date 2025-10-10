import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    _id: string;
    name: string;
    username: string;
    email: string;
    role: 2 | 3;
    password: string;
    isVerified?: boolean;
    verifyToken?: string;
    status?: 1 | 0;
    trash?: "YES" | "NO";
    created_at?: Date;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    role: { type: Number, enum: [1, 2, 3], required: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verifyToken: { type: String },
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    created_at: { type: Date, default: Date.now },
});


export default mongoose.model<IUser>("Users", userSchema);
