import mongoose, { Document, Schema } from "mongoose";

export interface NotificationDetails extends Document {
    title: string,
    subject: string,
    assigned_users: string,
    url: string,
    status?: 1 | 0;
    trash?: "YES" | "NO";
    created_at?: Date;
    created_by: string;
    deletedAt?: Date;
}

const NotificationSchema: Schema<NotificationDetails> = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    assigned_users: { type: String, required: true },
    url: { type: String },
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    created_at: { type: Date, default: Date.now },
    created_by: { type: String },
    deletedAt: { type: Date },
});

export default mongoose.model<NotificationDetails>("Notifications", NotificationSchema);