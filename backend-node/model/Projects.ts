import mongoose, { Document, Schema } from "mongoose";

export interface ProjectDetails extends Document {
    title: string,
    description: string,
    category: number,
    skills: string,
    experience: number,
    budget_type: number,
    estimated_budget: string | null,
    estimated_hour: string | null,
    deadline: Date,
    no_of_freelancer: number,
    milestone: string,
    spl_instruction: string,
    status?: 1 | 0;
    trash?: "YES" | "NO";
    created_at?: Date;
    created_by: string;
    deletedAt?: Date;
}

const ProjectSchema: Schema<ProjectDetails> = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: Number, required: true },
    skills: { type: String, required: true },
    experience: { type: Number, required: true },
    budget_type: { type: Number, required: true },
    estimated_budget: { type: String },
    estimated_hour: { type: String },
    deadline: { type: Date, required: true },
    no_of_freelancer: { type: Number, required: true },
    milestone: { type: String },
    spl_instruction: { type: String },
    status: { type: Number, enum: [1, 0], default: 1 },
    trash: { type: String, enum: ["YES", "NO"], default: "NO" },
    created_at: { type: Date, default: Date.now },
    created_by: { type: String },
    deletedAt: { type: Date },
});

export default mongoose.model<ProjectDetails>("projects", ProjectSchema);