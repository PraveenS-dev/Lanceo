import mongoose, { Document, Schema } from "mongoose";

export interface TransactionDetails extends Document {
    project_id: mongoose.Schema.Types.ObjectId,
    bitting_id: mongoose.Schema.Types.ObjectId,
    contract_id: string,
    amount: string,
    payment_person: string,
    payment_type: Number,
    status?: 1 | 0;
    trash?: "YES" | "NO";
    created_at?: Date;
    created_by: string;
    deletedAt?: Date;
}

const TransactionSchema: Schema<TransactionDetails> = new mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "projects", required: true },
    bitting_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bittings", required: true },
    contract_id: { type: String },
    amount: { type: String },
    payment_person: { type: String },
    payment_type: { type: Number }, // 1 => received 2 => sent
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    created_at: { type: Date, default: Date.now },
    created_by: { type: String },
    deletedAt: { type: Date },
});

export default mongoose.model<TransactionDetails>("Transactions", TransactionSchema);