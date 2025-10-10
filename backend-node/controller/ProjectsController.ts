import Projects, { ProjectDetails } from "../model/Projects";
import ProjectsAttachments, { ProjectAttachment } from "../model/ProjectsAttachments";
import { Request, Response } from "express";
import path from "path";
import { getEmailIdFromROles, getUserIdFromROles, loadEmailTemplate } from "../utils/Helpers";
import { sendMail } from "../utils/mailer";
import User from "../model/User";
import { sendNotification } from "./Admin/NotificationController";


const List = async (req: Request, res: Response) => {
    try {

        const { title, category, skills, experience, budget_type, estimated_budget, estimated_hour, deadline, no_of_freelancer, created_by, user_role, user_id, page } = req.query;

        const currentPage = parseInt(page as string) || 1;
        const limit = 30;
        const skip = (currentPage - 1) * limit;

        const searchCondition: any = { status: 1, trash: "NO" };

        if (title) searchCondition.title = { $regex: title, $options: "i" };
        if (category) searchCondition.category = Number(category);

        if (skills) {
            const skillsArray = (skills as string).split(",");
            searchCondition.$or = skillsArray.map(skill => ({
                skills: { $regex: new RegExp(`(^|,)${skill}(,|$)`) }
            }));
        }

        if (experience) searchCondition.experience = Number(experience);
        if (budget_type) searchCondition.budget_type = Number(budget_type);

        if (Number(budget_type) == 1) {
            if (estimated_hour) searchCondition.estimated_hour = { $regex: estimated_hour, $options: "i" };
        }
        if (Number(budget_type) == 2) {
            if (estimated_budget) searchCondition.estimated_budget = { $regex: estimated_budget, $options: "i" };
        }

        if (deadline) {
            const selectedDate = new Date(deadline as string);

            const startOfDay = new Date(selectedDate);
            startOfDay.setUTCHours(0, 0, 0, 0);

            const endOfDay = new Date(selectedDate);
            endOfDay.setUTCHours(23, 59, 59, 999);

            searchCondition.deadline = { $gte: startOfDay, $lte: endOfDay };
        }

        if (no_of_freelancer) searchCondition.no_of_freelancer = Number(no_of_freelancer);
        if (created_by) searchCondition.created_by = created_by;

        // Role-based filter
        if (user_role === "3" && user_id) {
            searchCondition.created_by = user_id;
        }

        const listData = await Projects.find(searchCondition)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Projects.countDocuments(searchCondition);

        res.json({
            data: listData,
            totalPages: Math.ceil(total / limit),
            currentPage,
            totalRecords: total,
            res: req.query
        });

    } catch (err: any) {
        return res.status(500).json({ message: err });
    }
}

const Store = async (req: any, res: Response) => {
    try {
        const { title, description, category, skills, experience, budget_type, estimated_budget, estimated_hour, deadline, no_of_freelancer, milestone, spl_instruction, created_by } = req.body;

        const newProject = new Projects({ title, description, category, skills, experience, budget_type, estimated_budget, estimated_hour, deadline, no_of_freelancer, milestone, spl_instruction, created_by });

        const savedProject = await newProject.save();

        const creator = await User.findById(savedProject.created_by).select("name");
        const createdByName = creator ? creator.name : "Unknown User";

        const notify_roles = "1";

        if (notify_roles) {
            const emails = await getEmailIdFromROles(notify_roles);
            if (emails.length) {
                const html = loadEmailTemplate("Mail_template", {
                    title,
                    module: "project",
                    subject: "New Project has been created",
                    action: "created",
                    created_by: createdByName,
                    project_link: `${process.env.FRONTEND_URL}/projects/list`,
                });

                await sendMail(emails, "New Project Created!", html);
            }
        }

        if (notify_roles) {

            const assigned_users = await getUserIdFromROles(notify_roles);

            const io = req.app.get("io");
            if (assigned_users?.length) {
                await sendNotification({
                    title: `Project Stored`,
                    subject: `New Project "${title}" has been Stored.`,
                    assigned_users,
                    url: `/projects/view/${savedProject._id}`,
                    io,
                });
            }
        }

        if (req.files && Array.isArray(req.files)) {
            const attachments = req.files.map((file: any) => ({
                project_id: savedProject._id,
                file_name: file.originalname,
                extention: path.extname(file.originalname).replace(".", ""),
                file_size: (file.size / 1024).toFixed(2) + "KB",
                file_path: `/uploads/projects/${file.filename}`,
            }));

            await ProjectsAttachments.insertMany(attachments);
        }

        return res.status(200).json({ message: "Project Stored Successfully!" });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const Edit = async (req: any, res: Response) => {
    try {
        const projectId = req.body.project_id;
        if (!projectId) return res.status(400).json({ message: "Project ID is required" });

        const title = req.body.title;
        const updateData = {
            title: title,
            description: req.body.description,
            category: req.body.category,
            skills: req.body.skills,
            experience: req.body.experience,
            budget_type: req.body.budget_type,
            estimated_budget: req.body.estimated_budget,
            estimated_hour: req.body.estimated_hour,
            deadline: req.body.deadline,
            no_of_freelancer: req.body.no_of_freelancer,
            milestone: req.body.milestone,
            spl_instruction: req.body.spl_instruction,
            updated_by: req.body.updated_by,
        };

        const updatedProject = await Projects.findByIdAndUpdate(projectId, updateData, { new: true });

        if (!updatedProject) {
            return res.status(404).json({ message: "Project not found" });
        }

        const creator = await User.findById(updatedProject.created_by).select("name");
        const createdByName = creator ? creator.name : "Unknown User";

        const notify_roles = "1";

        if (notify_roles) {
            const emails = await getEmailIdFromROles(notify_roles);
            if (emails.length) {
                const html = loadEmailTemplate("Mail_template", {
                    title,
                    module: `project`,
                    subject: "Project has been updated",
                    action: "Updated",
                    created_by: createdByName,
                    project_link: `${process.env.FRONTEND_URL}/projects/list`,
                });

                await sendMail(emails, "Project Updated!", html);
            }
        }
        if (notify_roles) {

            const assigned_users = await getUserIdFromROles(notify_roles);

            const io = req.app.get("io");
            if (assigned_users?.length) {
                await sendNotification({
                    title: `Project Updated`,
                    subject: `Project "${title}" has been updated.`,
                    assigned_users, // array of user IDs
                    url: `/projects/view/${updatedProject._id}`,
                    io,
                });
            }
        }

        const existingAttachments = req.body.existing_attachments || [];

        await ProjectsAttachments.updateMany({
            project_id: projectId,
            _id: { $nin: existingAttachments },
        }, { status: 0, trash: "YES", deletedAt: new Date(), });

        if (req.files && Array.isArray(req.files)) {
            const attachments = req.files.map((file: any) => ({
                project_id: projectId,
                file_name: file.originalname,
                extention: path.extname(file.originalname).replace(".", ""),
                file_size: (file.size / 1024).toFixed(2) + "KB",
                file_path: `/uploads/projects/${file.filename}`,
            }));

            await ProjectsAttachments.insertMany(attachments);
        }

        return res.status(200).json({ message: "Project updated successfully!" });
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

const GetData = async (req: Request, res: Response) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ message: "Project ID is required." });
        }

        const ViewData = await Projects.findOne({
            _id: id,
            status: 1,
            trash: "NO"
        });

        if (!ViewData) {
            return res.status(404).json({ message: "Project not found." });
        }

        const AttachmentData = await ProjectsAttachments.find({
            project_id: id,
            status: 1,
            trash: "NO"
        });

        const result = {
            ...ViewData.toObject(),
            attachmentDetails: AttachmentData || []
        };

        return res.status(200).json({ data: result });

    } catch (err: any) {
        console.error("Error fetching project data:", err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
};

const Delete = async (req: Request, res: Response) => {
    try {

        const { id } = req.body;

        const data = await Projects.findByIdAndUpdate(id, { status: 0, trash: "YES", deletedAt: new Date(), });
        return res.status(200).json({ message: "Project deleted Successfully!" });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const UniqueCheck = async (req: Request, res: Response) => {
    try {

        const { title, id } = req.body;

        const exist = await Projects.findOne({ title: title, created_by: id });

        if (exist) {
            return res.status(200).json({ data: false });
        }
        return res.status(200).json({ data: true });

    } catch (err: any) {
        return res.status(500).json({ message: err });
    }
}

const ExistUniqueCheck = async (req: Request, res: Response) => {
    try {

        const { title, id, project_id } = req.body;

        const exist = await Projects.findOne({ _id: { $ne: project_id }, title: title, created_by: id });

        if (exist) {
            return res.status(200).json({ data: false });
        }
        return res.status(200).json({ data: true });

    } catch (err: any) {
        return res.status(500).json({ message: err });
    }
}

export { List, Store, Edit, GetData, Delete, UniqueCheck, ExistUniqueCheck };