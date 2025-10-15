import mongoose, { Document, Schema } from "mongoose";

export interface MessageDetails extends Document {
    senderId: string;
    receiverId: string;
    message: string;
    isRead?: boolean;
    status?: number;
    trash?: "YES" | "NO";
    createdAt?: Date;
    created_by?: string;
    deletedAt?: Date;
}

const MessageSchema: Schema<MessageDetails> = new mongoose.Schema({
    senderId: { type: String, required: true },
    receiverId: { type: String },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    createdAt: { type: Date, default: Date.now },
    created_by: { type: String },
    deletedAt: { type: Date },
});

export default mongoose.model<MessageDetails>("Messages", MessageSchema);