import mongoose, { Document, Schema } from "mongoose";

export interface TicketDetails extends Document {
    project_id: mongoose.Schema.Types.ObjectId,
    bitting_id: mongoose.Schema.Types.ObjectId,
    contract_id: mongoose.Schema.Types.ObjectId,
    client: string,
    freelancer: string,
    freelancer_percent: number,
    client_percent: number,
    reason: number,
    remarks: string,
    ticketstatus?: 1 | 2 | 3; //1=> refund pending 2=> closed 3=> canceled
    status?: 1 | 0;
    trash?: "YES" | "NO";
    created_at?: Date;
    created_by: string;
    deletedAt?: Date;
}

const TicketSchema: Schema<TicketDetails> = new mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "projects", required: true },
    bitting_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bittings", required: true },
    contract_id: { type: mongoose.Schema.Types.ObjectId, ref: "Contracts", required: true },
    client: { type: String, required: true },
    freelancer: { type: String, required: true },
    freelancer_percent: { type: Number },
    client_percent: { type: Number },
    reason: { type: Number },
    remarks: { type: String },
    ticketstatus: { type: Number, enum: [1, 2, 3], default: 1 },
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    created_at: { type: Date, default: Date.now },
    created_by: { type: String },
    deletedAt: { type: Date },
});

export default mongoose.model<TicketDetails>("Tickets", TicketSchema);