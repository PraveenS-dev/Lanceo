import mongoose, { Document, Schema } from "mongoose";

export interface ContractApprovalLog extends Document {
    contract_id: string,
    percentage: number,
    action: 1 | 0 | 2, // 1 approved, 0 rejected, 2 attachment submit
    remarks: string,
    acted_by?: string,
    acted_by_role?: number,
    attachment_count?: number,
    created_at?: Date,
}

const ContractApprovalLogSchema: Schema<ContractApprovalLog> = new mongoose.Schema({
    contract_id: { type: String, required: true },
    percentage: { type: Number, required: true },
    action: { type: Number, enum: [1, 0, 2], required: true },
    remarks: { type: String, default: "" },
    acted_by: { type: String },
    acted_by_role: { type: Number },
    attachment_count: { type: Number },
    created_at: { type: Date, default: Date.now },
});

export default mongoose.model<ContractApprovalLog>("contract_approval_log", ContractApprovalLogSchema);


