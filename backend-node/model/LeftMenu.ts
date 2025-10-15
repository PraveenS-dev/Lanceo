import mongoose, { Document, Schema } from "mongoose";

export interface LeftMenuDetails extends Document {
    name: string,
    link: string,
    role: string,
    icon: string | null,
    isParent?: 1 | 0;
    parentId: string,
    sort_order: number,
    status?: 1 | 0;
    trash?: "YES" | "NO";
    created_at?: Date;
    created_by: string;
    updated_by: string;
    deletedAt?: Date;
}

const LeftMenuSchema: Schema<LeftMenuDetails> = new mongoose.Schema({
    name: { type: String, required: true },
    link: { type: String },
    role: { type: String, required: true },
    icon: { type: String },
    isParent: { type: Number, enum: [1, 0], default: 1 },
    parentId: { type: String },
    sort_order: { type: Number, required: true },
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    created_at: { type: Date, default: Date.now },
    created_by: { type: String },
    updated_by: { type: String },
    deletedAt: { type: Date },
});

export default mongoose.model<LeftMenuDetails>("LeftMenu", LeftMenuSchema);