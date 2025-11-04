import { Request, Response } from "express";
import ContractApprovalLog from "../model/ContractApprovalLog";

const listByContract = async (req: Request, res: Response) => {
    try {
        const { contract_id } = req.query;
        if (!contract_id) {
            return res.status(400).json({ message: "Contract ID is required." });
        }

        const logs = await ContractApprovalLog.find({ contract_id, })
            .sort({ created_at: -1 });

        return res.status(200).json({ data: logs });
    } catch (err: any) {
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
}

export { listByContract };


