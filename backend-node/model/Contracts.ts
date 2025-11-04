import mongoose, { Document, Schema } from "mongoose";

export interface ContractDetails extends Document {
    project_id: mongoose.Schema.Types.ObjectId,
    bitting_id: mongoose.Schema.Types.ObjectId,
    budget: string,
    payed_amount: Number,
    payed_percentage: Number,
    completion_percentage: Number,
    temp_completion_percentage: Number,
    freelancer: string,
    remarks: string,
    contract_status: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    form_status?: 1 | 0;
    status?: 1 | 0;
    trash?: "YES" | "NO";
    created_at?: Date;
    created_by: string;
    deletedAt?: Date;
}

const ContractSchema: Schema<ContractDetails> = new mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "projects", required: true },
    bitting_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bittings", required: true },
    budget: { type: String },
    payed_amount: { type: Number, default: 0 },
    payed_percentage: { type: Number, default: 0 },
    completion_percentage: { type: Number, default: 0 },
    temp_completion_percentage: { type: Number, default: 0 },
    freelancer: { type: String },
    remarks: { type: String },
    contract_status: { type: Number, enum: [1, 2, 3, 4, 5, 6, 7], default: 1 },
    // 1 => payment pending, 2 => working, 3 => Ticket raised , 4 => Ticket closed ,
    // 5 => project submitted , 6 => completed , 7 => Re-work needed

    form_status: { type: Number, enum: [1, 0], default: 0 }, //0 => open, 1 => close
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    created_at: { type: Date, default: Date.now },
    created_by: { type: String },
    deletedAt: { type: Date },
});

export default mongoose.model<ContractDetails>("Contracts", ContractSchema);