import { Request, Response } from "express";
import LeftMenu from "../../model/LeftMenu";
import User from "../../model/User";
import { getEmailIdFromROles, getUserIdFromROles, loadEmailTemplate } from "../../utils/Helpers";
import { sendMail } from "../../utils/mailer";
import { sendNotification } from "./NotificationController";


const List = async (req: Request, res: Response) => {

    try {
        const { name, role, isParent, created_by, parentId, page } = req.query;

        const currentPage = parseInt(page as string) || 1;
        const limit = 10;
        const skip = (currentPage - 1) * limit;

        const searchCondition: any = { status: 1, trash: "NO" };

        if (name) searchCondition.name = { $regex: name, $options: "i" };
        if (role) searchCondition.role = { $regex: role, $options: "i" };
        if (isParent) searchCondition.isParent = Number(isParent);
        if (created_by) searchCondition.created_by = created_by;
        if (parentId) searchCondition.parentId = parentId;

        const listData = await LeftMenu.find(searchCondition)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const total = await LeftMenu.countDocuments(searchCondition);

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
        const { name, link, role, icon, isParent, parentId, sort_order, created_by } = req.body;

        const newLeftMenu = new LeftMenu({ name, link, role, icon, isParent, parentId, sort_order, created_by });

        const savedMenu = await newLeftMenu.save();

        const creator = await User.findById(savedMenu.created_by).select("name");
        const createdByName = creator ? creator.name : "Unknown User";

        const notify_roles = "1";

        if (notify_roles) {
            const emails = await getEmailIdFromROles(notify_roles);
            if (emails.length) {
                const html = loadEmailTemplate("Mail_template", {
                    name,
                    module: "leftmenu",
                    title: "",
                    subject: "New LeftMenu has been created",
                    action: "created",
                    created_by: createdByName,
                    link: `${process.env.FRONTEND_URL}/LeftMenu/list`,
                });

                await sendMail(emails, "New LeftMenu Created!", html);
            }
        }

        if (notify_roles) {

            const assigned_users = await getUserIdFromROles(notify_roles);

            const io = req.app.get("io");
            if (assigned_users?.length) {
                await sendNotification({
                    title: `LeftMenu Stored`,
                    subject: `New LeftMenu "${name}" has been Stored.`,
                    assigned_users,
                    url: `/LeftMenu/view/${savedMenu._id}`,
                    io,
                });
            }
        }

        return res.status(200).json({ message: "LeftMenu Stored Successfully!" });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const Edit = async (req: any, res: Response) => {
    try {
        const LeftMenuId = req.body.LeftMenu_id;
        if (!LeftMenuId) return res.status(400).json({ message: "LeftMenu ID is required" });

        const name = req.body.name;
        const updateData = {
            name: name,
            link: req.body.link,
            role: req.body.role,
            icon: req.body.icon,
            isParent: req.body.isParent,
            parentId: req.body.parentId,
            sort_order: req.body.sort_order,
            updated_by: req.body.updated_by,
        };

        const updatedMenu = await LeftMenu.findByIdAndUpdate(LeftMenuId, updateData, { new: true });

        if (!updatedMenu) {
            return res.status(404).json({ message: "LeftMenu not found" });
        }

        const creator = await User.findById(updatedMenu.created_by).select("name");
        const createdByName = creator ? creator.name : "Unknown User";

        const notify_roles = "1";

        if (notify_roles) {
            const emails = await getEmailIdFromROles(notify_roles);
            if (emails.length) {
                const html = loadEmailTemplate("Mail_template", {
                    name,
                    module: "leftmenu",
                    title: "",
                    subject: "LeftMenu has been updated",
                    action: "updated",
                    created_by: createdByName,
                    link: `${process.env.FRONTEND_URL}/LeftMenu/list`,
                });

                await sendMail(emails, "LeftMenu updated!", html);
            }
        }

        if (notify_roles) {

            const assigned_users = await getUserIdFromROles(notify_roles);

            const io = req.app.get("io");
            if (assigned_users?.length) {
                await sendNotification({
                    title: `LeftMenu Updated`,
                    subject: `LeftMenu "${name}" has been updated.`,
                    assigned_users, // array of user IDs
                    url: `/LeftMenu/view/${updatedMenu._id}`,
                    io,
                });
            }
        }

        return res.status(200).json({ message: "LeftMenu updated successfully!" });
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

const GetData = async (req: Request, res: Response) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ message: "LeftMenu ID is required." });
        }

        const ViewData = await LeftMenu.findOne({
            _id: id,
            status: 1,
            trash: "NO"
        });

        if (!ViewData) {
            return res.status(404).json({ message: "LeftMenu not found." });
        }

        return res.status(200).json({ data: ViewData });

    } catch (err: any) {
        console.error("Error fetching LeftMenu data:", err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
};

const Delete = async (req: Request, res: Response) => {
    try {

        const { id } = req.body;

        const data = await LeftMenu.findByIdAndUpdate(id, { status: 0, trash: "YES", deletedAt: new Date(), });
        return res.status(200).json({ message: "LeftMenu deleted Successfully!" });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const UniqueCheck = async (req: Request, res: Response) => {
    try {

        const { name } = req.body;

        const exist = await LeftMenu.findOne({ name: name });

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

        const { name, LeftMenu_id } = req.body;

        const exist = await LeftMenu.findOne({ _id: { $ne: LeftMenu_id }, name: name });

        if (exist) {
            return res.status(200).json({ data: false });
        }
        return res.status(200).json({ data: true });

    } catch (err: any) {
        return res.status(500).json({ message: err });
    }
}

const getAllData = async (req: Request, res: Response) => {

    try {

        const { user_role } = req.query;

        const searchCondition: any = { status: 1, trash: "NO" };

        const listData = await LeftMenu.find(searchCondition);

        let finalList: any[] = [];
        listData.map(
            (data: any) => {
                let role = data.role.split(",");
                if (role.includes(String(user_role))) {
                    finalList.push(data);
                }
            }
        )
        res.json({ data: finalList });

    } catch (err: any) {
        return res.status(500).json({ message: err });
    }
}

const getAllParents = async (req: Request, res: Response) => {

    try {

        const searchCondition: any = { isParent: 1, status: 1, trash: "NO" };

        const listData = await LeftMenu.find(searchCondition);

        const result = listData.map((data) => (
            { value: data._id, label: data.name }
        ))

        res.json({ data: result });

    } catch (err: any) {
        return res.status(500).json({ message: err });
    }
}

const getParentName = async (req: Request, res: Response) => {

    try {
        const { parentId } = req.query;

        const menu = await LeftMenu.findById(parentId).select("name");
        const menuName = menu?.name;
        return res.status(200).json({ name: menuName })

    } catch (err) {
        console.error("Fetch menu error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

export { List, Store, Edit, GetData, Delete, UniqueCheck, ExistUniqueCheck, getAllData, getAllParents, getParentName };