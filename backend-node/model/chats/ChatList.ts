import mongoose, { Document, Schema } from "mongoose";

export interface ChatListDetails extends Document {
    userId: string,
    contactId: string,
    lastMessage: string,
    lastMessageTime: Date;
    unreadCount: Number;
    status?: 1 | 0;
    trash?: "YES" | "NO";
    created_at?: Date;
    created_by: string;
    deletedAt?: Date;
}

const ChatListSchema: Schema<ChatListDetails> = new mongoose.Schema({
    userId: { type: String, required: true },
    contactId: { type: String },
    lastMessage: { type: String },
    lastMessageTime: { type: Date, default: Date.now },
    unreadCount: { type: Number },
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    created_at: { type: Date, default: Date.now },
    created_by: { type: String },
    deletedAt: { type: Date },
});

export default mongoose.model<ChatListDetails>("ChatList", ChatListSchema);