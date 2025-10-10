import mongoose, { Document, Schema } from "mongoose";

export interface NotificationLogDetails extends Document {
    notification_id: string,
    userId: string,
    status?: 1 | 0;
    trash?: "YES" | "NO";
    created_at?: Date;
    created_by: string;
    deletedAt?: Date;
}

const NotificationLogSchema: Schema<NotificationLogDetails> = new mongoose.Schema({
    notification_id: { type: String, required: true },
    userId: { type: String, required: true },
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    created_at: { type: Date, default: Date.now },
    created_by: { type: String },
    deletedAt: { type: Date },
});

export default mongoose.model<NotificationLogDetails>("NotificationLog", NotificationLogSchema);