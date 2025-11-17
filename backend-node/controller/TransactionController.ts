import { Request, Response } from "express";
import Transaction from "../model/Transaction";


const List = async (req: Request, res: Response) => {
    try {
        const { project_id, created_by, page, user_role, user_id, type } = req.query;

        const currentPage = parseInt(page as string) || 1;
        const limit = 30;
        const skip = (currentPage - 1) * limit;

        const searchCondition: any = { status: 1, trash: "NO" };

        if (project_id) searchCondition.project_id = project_id;
        if (created_by) searchCondition.created_by = created_by;
        if (type) searchCondition.payment_type = type;

        if (user_role == "2") searchCondition.payment_person = user_id;
        if (user_role == "3") searchCondition.payment_person = user_id;

        const listData = await Transaction.find(searchCondition)
            .populate("project_id", "title deadline") // get only 'title' and 'deadline' from project
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Transaction.countDocuments(searchCondition);
        let total_received_amount = 0;
        let total_send_amount = 0;

        listData.forEach((data) => {
            if (user_role == "1") {
                if (data.payment_type == 1) {
                    total_received_amount += Number(data.amount);
                } else {
                    total_send_amount += Number(data.amount);
                }
            } else {
                if (data.payment_type == 2) {
                    total_received_amount += Number(data.amount);
                } else {
                    total_send_amount += Number(data.amount);
                }
            }
        });

        res.json({
            data: listData,
            totalPages: Math.ceil(total / limit),
            currentPage,
            totalRecords: total,
            total_send_amount: total_send_amount,
            total_received_amount: total_received_amount,
        });
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

const GetData = async (req: Request, res: Response) => {
    try {
        const { transaction_id } = req.query;

        if (!transaction_id) {
            return res.status(400).json({ message: "Transaction ID is required." });
        }

        const ViewData = await Transaction.findOne({
            _id: transaction_id,
            status: 1,
            trash: "NO"
        }).populate("project_id", "title");

        if (!ViewData) {
            return res.status(404).json({ message: "Transaction not found." });
        }

        return res.status(200).json({ data: ViewData });

    } catch (err: any) {
        console.error("Error fetching Transaction data:", err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
};

export { List, GetData };