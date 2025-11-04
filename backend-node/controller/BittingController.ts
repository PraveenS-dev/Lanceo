import Bittings from "../model/Bittings";
import { Request, Response } from "express";
import User from "../model/User";
import { getEmailIdFromIds, loadEmailTemplate } from "../utils/Helpers";
import { sendMail } from "../utils/mailer";
import { sendNotification } from "./Admin/NotificationController";
import Projects from "../model/Projects";
import mongoose, { set } from "mongoose";
import Contracts from "../model/Contracts";

const List = async (req: Request, res: Response) => {
    try {
        const { page, user_id, user_role, project_id, created_by } = req.query;

        const currentPage = parseInt(page as string) || 1;
        const limit = 30;
        const skip = (currentPage - 1) * limit;

        const match: any = { status: 1, trash: "NO" };

        if (created_by) match.created_by = created_by;

        if (user_role === "2" && user_id) {
            // Freelancer → only their own bittings
            match.created_by = user_id;
        } else if (user_role === "3" && user_id) {
            // Client → all bittings under their projects
            const clientProjects = await Projects.find({ created_by: user_id }).select("_id");
            const projectIds = clientProjects.map((p) => p._id);
            match.project_id = { $in: projectIds };
        }
        // Admin → no filter needed

        if (project_id) {
            match.project_id = new mongoose.Types.ObjectId(project_id as string);
        }
        const pipeline: any[] = [
            { $match: match },
            { $sort: { created_at: -1 as const } },
            {
                $group: {
                    _id: { project_id: "$project_id", created_by: "$created_by" },
                    latest: { $first: "$$ROOT" },
                },
            },
            { $replaceRoot: { newRoot: "$latest" } },
            { $sort: { created_at: -1 as const } },
            { $skip: skip },
            { $limit: limit },
        ];


        const bittings = await Bittings.aggregate(pipeline);

        // populate fields manually after aggregation
        await Bittings.populate(bittings, [
            { path: "project_id", select: "title created_by created_at" }
        ]);

        const total = await Bittings.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { project_id: "$project_id", created_by: "$created_by" },
                },
            },
            { $count: "total" },
        ]);

        const totalRecords = total[0]?.total || 0;

        return res.json({
            data: bittings,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage,
            totalRecords,
            match,
            req: req.query
        });
    } catch (err: any) {
        console.error("Error fetching bittings:", err);
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
                    url: `/bittings/view/${data._id}/${data?.created_by}`,
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
        const { project_id, bitted_by } = req.query;

        if (!project_id) {
            return res.status(400).json({ message: "Project ID is required." });
        }

        const ViewData = await Bittings.find({
            project_id: project_id,
            created_by: bitted_by,
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
        const { id, bitted_by } = req.query;

        if (!id) {
            return res.status(400).json({ message: "Project ID is required." });
        }

        const ViewData = await Bittings.findOne({
            project_id: id,
            created_by: bitted_by,
            status: 1,
            trash: "NO"
        }).sort({ created_at: -1 });


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

        if (action == 2) {

            const contarct_details = new Contracts({ project_id: data?.project_id, bitting_id: data?._id, budget: data?.budget, created_by: project_details?.created_by, freelancer: data?.created_by });

            const contarct_data = await contarct_details.save();
        }

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

                await sendMail(emails, `Bittings has been ${creater_action}`, html);
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
                    url: `/bittings/view/${data?._id}/${data?.created_by}`,
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