import mongoose, { Document, Schema } from "mongoose";

export interface ProjectAttachment extends Document {
    project_id: number,
    file_name: string,
    extention: string,
    file_size: string,
    status?: 1 | 0;
    trash?: "YES" | "NO";
    createdAt?: Date;
}

const ProjectAttachmentSchema: Schema<ProjectAttachment> = new mongoose.Schema({
    project_id: { type: Number, required: true },
    file_name: { type: String, required: true },
    extention: { type: String, required: true },
    file_size: { type: String, required: true },
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ProjectAttachment>("project_attachment", ProjectAttachmentSchema);