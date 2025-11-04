import mongoose, { Document, Schema } from "mongoose";

export interface ContractAttachment extends Document {
    contract_id: string,
    project_id: string,
    bitting_id: string,
    file_name: string,
    extention: string,
    file_size: string,
    percentage: Number,
    file_path: string,
    status?: 1 | 0;
    trash?: "YES" | "NO";
    freelancer_remarks?: string;
    client_remarks?: string;
    created_at?: Date;
    deletedAt?: Date;
}

const ContractAttachmentSchema: Schema<ContractAttachment> = new mongoose.Schema({
    contract_id: { type: String, required: true },
    project_id: { type: String, required: true },
    bitting_id: { type: String, required: true },
    file_name: { type: String, required: true },
    extention: { type: String, required: true },
    file_size: { type: String, required: true },
    percentage: { type: Number, required: true },
    file_path: { type: String, required: true },
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    freelancer_remarks: { type: String },
    client_remarks: { type: String },
    created_at: { type: Date, default: Date.now },
    deletedAt: { type: Date },

});

export default mongoose.model<ContractAttachment>("contract_attachment", ContractAttachmentSchema);