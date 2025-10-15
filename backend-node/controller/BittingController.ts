import Bittings from "../model/Bittings";
import { Request, Response } from "express";
import User from "../model/User";
import { getEmailIdFromIds, loadEmailTemplate } from "../utils/Helpers";
import { sendMail } from "../utils/mailer";
import { sendNotification } from "./Admin/NotificationController";
import Projects from "../model/Projects";
import { set } from "mongoose";


const List = async (req: Request, res: Response) => {
    try {
        const { project_id, created_by, page } = req.query;

        const currentPage = parseInt(page as string) || 1;
        const limit = 30;
        const skip = (currentPage - 1) * limit;

        const searchCondition: any = { status: 1, trash: "NO" };

        if (project_id) searchCondition.project_id = project_id;
        if (created_by) searchCondition.created_by = created_by;

        const listData = await Bittings.find(searchCondition)
            .populate("project_id", "title") // get only 'title' from project
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const uniqueProjectData = <any>[];
        const seenIds = new Set();

        for (const data of listData) {
            const projectId = data.project_id?.toString();

            if (projectId && !seenIds.has(projectId)) {
                seenIds.add(projectId);

                const latestData = await Bittings.findOne({
                    project_id: data.project_id,
                    status: 1,
                    trash: "NO"
                })
                    .sort({ created_at: -1 })
                    .lean();

                uniqueProjectData.push({
                    project: data,
                    latest: latestData
                });
            }
        }

        const total = await Bittings.countDocuments(searchCondition);

        res.json({
            data: uniqueProjectData,
            totalPages: Math.ceil(total / limit),
            currentPage,
            totalRecords: total,
            res: req.query,
        });
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

const Store = async (req: any, res: Response) => {
    try {
        const { project_id, budget, message, created_by } = req.body;

        const newBittings = new Bittings({ project_id, budget, message, created_by });

        const data = await newBittings.save();

        const creator = await User.findById(data.created_by).select("name");
        const createdByName = creator ? creator.name : "Unknown User";

        const project_details = await Projects.findById(project_id).select(["title", "created_by"]);
        const project_name = project_details ? project_details.title : "Unknown";
        const project_creator = project_details ? project_details.created_by : "";

        if (project_creator) {
            const emails = await getEmailIdFromIds(project_creator);
            if (emails.length) {
                const html = loadEmailTemplate("Mail_template", {
                    title: `for ${project_name}`,
                    module: "Bittings",
                    subject: "New Bittings has been created",
                    action: "created",
                    created_by: createdByName,
                    link: `${process.env.FRONTEND_URL}/bittings/list`,
                });

                await sendMail(emails, "New Bittings Created!", html);
            }
        }

        if (project_creator) {

            const assigned_users = [project_creator];
            const io = req.app.get("io");
            if (assigned_users?.length) {
                await sendNotification({
                    title: `Bittings Stored`,
                    subject: `New Bittings for "${project_name}" has been Stored.`,
                    assigned_users,
                    url: `/bittings/view/${data._id}`,
                    io,
                });
            }
        }

        return res.status(200).json({ message: "Bittings Stored Successfully!" });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const GetData = async (req: Request, res: Response) => {
    try {
        const { project_id, user_id } = req.query;

        if (!project_id) {
            return res.status(400).json({ message: "Project ID is required." });
        }

        const ViewData = await Bittings.find({
            project_id: project_id,
            created_by: user_id,
            status: 1,
            trash: "NO"
        }).populate("project_id", "title");

        if (!ViewData) {
            return res.status(404).json({ message: "Bittings not found." });
        }

        return res.status(200).json({ data: ViewData });

    } catch (err: any) {
        console.error("Error fetching Bittings data:", err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
};

const getLastData = async (req: Request, res: Response) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ message: "Project ID is required." });
        }

        const ViewData = await Bittings.findOne({
            project_id: id,
            status: 1,
            trash: "NO"
        }).sort({ created_at: -1 });

        if (!ViewData) {
            return res.status(404).json({ message: "Bittings not found." });
        }

        return res.status(200).json({ data: ViewData });

    } catch (err: any) {
        console.error("Error fetching Bittings data:", err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
};

const Approval = async (req: Request, res: Response) => {
    try {

        const { bitting_id, reason, action } = req.body;

        const data = await Bittings.findByIdAndUpdate(bitting_id, { reason: reason, bitting_status: action });

        const creator = await User.findById(data?.created_by).select("name");
        const createdByName = creator ? creator.name : "Unknown User";

        const project_details = await Projects.findById(data?.project_id).select(["title", "created_by"]);
        const project_name = project_details ? project_details.title : "Unknown";
        const bit_creator = data ? data.created_by : "";

        const creater_action = action == 2 ? "Approved" : "Rejected"

        if (bit_creator) {
            const emails = await getEmailIdFromIds(bit_creator);
            if (emails.length) {
                const html = loadEmailTemplate("Mail_template", {
                    title: `for ${project_name}`,
                    module: "Bittings",
                    subject: `Bittings has been ${creater_action}`,
                    action: `${creater_action}`,
                    created_by: createdByName,
                    link: `${process.env.FRONTEND_URL}/bittings/list`,
                });

                await sendMail(emails,`Bittings has been ${creater_action}`, html);
            }
        }

        if (bit_creator) {
            const assigned_users = [bit_creator];
            const io = req.app.get("io");
            if (assigned_users?.length) {
                await sendNotification({
                    title: `Bittings ${creater_action}`,
                    subject: `Bittings for "${project_name}" has been ${creater_action}.`,
                    assigned_users,
                    url: `/bittings/view/${data?._id}`,
                    io,
                });
            }
        }
        
        return res.status(200).json({ message: `Bittings ${creater_action} Successfully!` });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const Delete = async (req: Request, res: Response) => {
    try {

        const { id } = req.body;

        const data = await Bittings.findByIdAndUpdate(id, { status: 0, trash: "YES", deletedAt: new Date(), });
        return res.status(200).json({ message: "Bittings deleted Successfully!" });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}


export { List, Store, GetData, Delete, getLastData, Approval };