import mongoose, { Document, Schema } from "mongoose";

export interface BittingDetails extends Document {
    project_id: mongoose.Schema.Types.ObjectId,
    budget: string,
    message: string,
    bitting_status: 1 | 2 | 3;
    reason: string,
    form_status?: 1 | 0;
    status?: 1 | 0;
    trash?: "YES" | "NO";
    created_at?: Date;
    created_by: string;
    deletedAt?: Date;
}

const BittingSchema: Schema<BittingDetails> = new mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "projects", required: true },
    budget: { type: String },
    message: { type: String, required: true },
    bitting_status: { type: Number, enum: [1, 2, 3], default: 1 }, // 1 => pending, 2 => Approved, 3 => rejected
    reason: { type: String },
    form_status: { type: Number, enum: [1, 0], default: 0 }, //0 => open, 1 => close
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    created_at: { type: Date, default: Date.now },
    created_by: { type: String },
    deletedAt: { type: Date },
});

export default mongoose.model<BittingDetails>("Bittings", BittingSchema);