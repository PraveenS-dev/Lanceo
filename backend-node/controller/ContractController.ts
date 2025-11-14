import { Request, Response } from "express";
import User from "../model/User";
import { getEmailIdFromIds, loadEmailTemplate } from "../utils/Helpers";
import { sendMail } from "../utils/mailer";
import { sendNotification } from "./Admin/NotificationController";
import Projects from "../model/Projects";
import Contracts from "../model/Contracts";
import Bittings from "../model/Bittings";
import path from "path";
import ContractAttachments from "../model/ContractAttachments";
import Transaction from "../model/Transaction";
import mongoose from "mongoose";
import ContractApprovalLog from "../model/ContractApprovalLog";
import Razorpay from "razorpay";
import crypto from "crypto";
import axios from "axios";

// ✅ Razorpay (for order/payments) — still can keep this if needed
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ✅ RazorpayX Base Setup (for payouts)
const razorpayAuth = {
    username: process.env.RAZORPAY_KEY_ID!,
    password: process.env.RAZORPAY_KEY_SECRET!,
};
const RAZORPAY_BASE_URL = process.env.RAZORPAY_BASE_URL || "https://api.razorpay.com";
// const ENABLE_PAYOUTS = String(process.env.ENABLE_PAYOUTS || "true").toLowerCase() === "true";
const ENABLE_PAYOUTS = false;


// RazorpayX Base URL (correct one for payouts)
const RAZORPAY_X_URL = "https://api.razorpayx.com";

const List = async (req: Request, res: Response) => {
    try {
        const { project_id, created_by, page, user_role, user_id } = req.query;

        const currentPage = parseInt(page as string) || 1;
        const limit = 30;
        const skip = (currentPage - 1) * limit;

        const searchCondition: any = { status: 1, trash: "NO" };

        if (project_id) searchCondition.project_id = project_id;
        if (created_by) searchCondition.created_by = created_by;
        if (user_role == "2") searchCondition.freelancer = user_id;
        if (user_role == "3") searchCondition.created_by = user_id;

        const listData = await Contracts.find(searchCondition)
            .populate("project_id", "title deadline") // get only 'title' from project
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);


        const total = await Contracts.countDocuments(searchCondition);

        res.json({
            data: listData,
            totalPages: Math.ceil(total / limit),
            currentPage,
            totalRecords: total,
        });
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

const GetData = async (req: Request, res: Response) => {
    try {
        const { contract_id } = req.query;

        if (!contract_id) {
            return res.status(400).json({ message: "Contract ID is required." });
        }

        const ViewData = await Contracts.findOne({
            _id: contract_id,
            status: 1,
            trash: "NO"
        }).populate("project_id", "title deadline");

        if (!ViewData) {
            return res.status(404).json({ message: "Contract not found." });
        }

        let AttachmentData;
        // For approval (status 5) show latest uploaded (temp percentage)
        // For rejected (status 7) show latest uploaded files as well
        if (ViewData.contract_status == 5 || ViewData.contract_status == 7) {
            const latestPercent = ViewData.temp_completion_percentage || ViewData.completion_percentage;
            if (latestPercent) {
                AttachmentData = await ContractAttachments.find({
                    contract_id: contract_id,
                    percentage: latestPercent,
                    status: 1,
                    trash: "NO"
                }).sort({ created_at: -1 });
            }
        }

        const result = {
            ...ViewData.toObject(),
            attachmentDetails: AttachmentData || []
        };
        return res.status(200).json({ data: result });

    } catch (err: any) {
        console.error("Error fetching Contract data:", err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
};

const Approval = async (req: Request, res: Response) => {
    try {

        const { contract_id, remarks, action } = req.body;

        const contract_details = await Contracts.findById(contract_id);
        const old_percentage = contract_details?.completion_percentage;
        let new_percentage;
        let status;

        if (action == 1) {
            new_percentage = contract_details?.temp_completion_percentage ?? 0;
            if (new_percentage >= (contract_details?.payed_percentage ?? 0)) {
                status = 1;
            } else if (new_percentage == 100) {
                status = 6;
            } else {
                status = 2;
            }

        } else {
            new_percentage = old_percentage;
            status = 7;
        }

        const data = await Contracts.findByIdAndUpdate(contract_id, { remarks: remarks, completion_percentage: new_percentage, contract_status: status });

        const creator = await User.findById(data?.created_by).select("name");
        const createdByName = creator ? creator.name : "Unknown User";

        const project_details = await Projects.findById(data?.project_id).select(["title", "created_by"]);
        const bitting_details = await Bittings.findById(data?.bitting_id).select(["created_by"]);
        const project_name = project_details ? project_details.title : "Unknown";
        const freelancer = bitting_details ? bitting_details.created_by : "";

        const creater_action = action == 1 ? "Approved" : "Rejected";

        // log approval/reject history
        const actingUserId = (req as any)?.user?.id || data?.created_by;
        const actingRole = (req as any)?.user?.role;
        const logPercentage = contract_details?.temp_completion_percentage || contract_details?.completion_percentage || 0;
        let createdApprovalLog;
        try {
            createdApprovalLog = await new ContractApprovalLog({
                contract_id,
                percentage: Number(logPercentage),
                action: Number(action) === 1 ? 1 : 0,
                remarks: remarks || "",
                acted_by: actingUserId,
                acted_by_role: actingRole,
            }).save();
        } catch (e) {
            // no-op on log failure
        }

        // write client remarks for the milestone under review
        const targetPercentage = action == 1 ? contract_details?.temp_completion_percentage : contract_details?.temp_completion_percentage;
        if (targetPercentage) {
            await ContractAttachments.updateMany({
                contract_id: contract_id,
                percentage: Number(targetPercentage),
                status: 1,
                trash: "NO"
            }, { client_remarks: remarks });
        }

        if (freelancer) {
            const emails = await getEmailIdFromIds(freelancer);
            if (emails.length) {
                const html = loadEmailTemplate("Mail_template", {
                    title: `for ${project_name}`,
                    module: "Contract",
                    subject: `Contract has been ${creater_action}`,
                    action: `${creater_action}`,
                    created_by: createdByName,
                    link: `${process.env.FRONTEND_URL}/contarct/list`,
                });

                await sendMail(emails, `Contract has been ${creater_action}`, html);
            }
        }

        if (freelancer) {
            const assigned_users = [freelancer];
            const io = req.app.get("io");
            if (assigned_users?.length) {
                await sendNotification({
                    title: `Contract ${creater_action}`,
                    subject: `Contract for "${project_name}" has been ${creater_action}.`,
                    assigned_users,
                    url: `/contract/view/${data?._id}`,
                    io,
                });
            }
        }

        return res.status(200).json({ message: `Contract ${creater_action} Successfully!`, log: createdApprovalLog });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const AttachmentSubmittion = async (req: any, res: Response) => {
    try {

        const { contract_id, remarks, percentage } = req.body;

        // validate contract_id
        if (!contract_id) {
            return res.status(400).json({ message: "Contract ID is required." });
        }

        if (!mongoose.Types.ObjectId.isValid(String(contract_id))) {
            return res.status(400).json({ message: "Invalid Contract ID." });
        }

        const data = await Contracts.findByIdAndUpdate(contract_id, { remarks: remarks, contract_status: 5, temp_completion_percentage: percentage });

        const project_details = await Projects.findById(data?.project_id).select(["title", "created_by"]);
        const bitting_details = await Bittings.findById(data?.bitting_id).select(["created_by"]);
        const project_name = project_details ? project_details.title : "Unknown";
        const freelancer = bitting_details ? bitting_details.created_by : "";

        const uploaded_by = await User.findById(freelancer).select("name");
        const uploaded_by_name = uploaded_by ? uploaded_by.name : "Unknown User";

        const existingAttachments = req.body.existing_attachments || [];

        // Remove/trash any older attachments at this same percentage that are not kept
        await ContractAttachments.updateMany({
            contract_id: contract_id,
            _id: { $nin: existingAttachments },
            percentage: { $eq: Number(percentage) },
        }, { status: 0, trash: "YES", deletedAt: new Date(), });

        // update kept existing attachments with latest freelancer remarks for this milestone
        if (existingAttachments.length) {
            await ContractAttachments.updateMany({
                contract_id: contract_id,
                _id: { $in: existingAttachments },
                percentage: { $eq: Number(percentage) },
            }, { freelancer_remarks: remarks });
        }

        let uploadedCount = 0;
        if (req.files && Array.isArray(req.files)) {
            const currentPercent = Number(percentage);
            const attachments = req.files.map((file: any) => ({
                contract_id: data?._id,
                project_id: data?.project_id,
                bitting_id: data?.bitting_id,
                file_name: file.originalname,
                percentage: currentPercent,
                extention: path.extname(file.originalname).replace(".", ""),
                file_size: (file.size / 1024).toFixed(2) + "KB",
                file_path: `/uploads/contracts/${file.filename}`,
                freelancer_remarks: remarks,
            }));

            if (attachments.length) {
                await ContractAttachments.insertMany(attachments);
                uploadedCount = attachments.length;
            }
        }

        // count total active attachments at this milestone after updates (includes kept + newly uploaded)
        let totalActiveCount = 0;
        try {
            totalActiveCount = await ContractAttachments.countDocuments({
                contract_id: contract_id,
                percentage: Number(percentage),
                status: 1,
                trash: "NO",
            });
        } catch (e) {
            totalActiveCount = uploadedCount; // fallback
        }

        if (freelancer) {
            const emails = await getEmailIdFromIds(freelancer);
            if (emails.length) {
                const html = loadEmailTemplate("Mail_template", {
                    title: `for ${project_name}`,
                    module: "Contract",
                    subject: `Contract attachment has been added`,
                    action: `attachment added`,
                    created_by: uploaded_by_name,
                    link: `${process.env.FRONTEND_URL}/contarct/list`,
                });

                await sendMail(emails, `Contract has been attachment added`, html);
            }
        }

        if (freelancer) {
            const assigned_users = [freelancer];
            const io = req.app.get("io");
            if (assigned_users?.length) {
                await sendNotification({
                    title: `Contract attachment added`,
                    subject: `Contract for "${project_name}" has been attachment added.`,
                    assigned_users,
                    url: `/contract/view/${data?._id}`,
                    io,
                });
            }
        }

        // log attachment submission event
        let createdSubmissionLog;
        try {
            createdSubmissionLog = await new ContractApprovalLog({
                contract_id,
                percentage: Number(percentage),
                action: 2,
                remarks: remarks || "",
                acted_by: freelancer,
                acted_by_role: 2,
                attachment_count: totalActiveCount,
            }).save();
        } catch (e) {
            // ignore logging failure
        }

        return res.status(200).json({ message: `Contract attachment added Successfully!`, log: createdSubmissionLog });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const Delete = async (req: Request, res: Response) => {
    try {

        const { id } = req.body;

        const data = await Bittings.findByIdAndUpdate(id, { status: 0, trash: "YES", deletedAt: new Date(), });
        return res.status(200).json({ message: "Contract deleted Successfully!" });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const getAllAttachment = async (req: Request, res: Response) => {
    try {
        const { contract_id, percentage } = req.query;

        if (!contract_id) {
            return res.status(400).json({ message: "Contract ID is required." });
        }

        const contractData = await Contracts.findOne({
            _id: contract_id,
            status: 1,
            trash: "NO"
        }).populate("project_id", "title deadline");

        if (!contractData) {
            return res.status(404).json({ message: "No attachments found." });
        }

        const AttachmentData = await ContractAttachments.find({
            contract_id: contract_id,
            percentage: percentage,
            status: 1,
            trash: "NO"
        });

        return res.status(200).json({ data: AttachmentData });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const submitPayment = async (req: Request, res: Response) => {
    try {
        const { contract_id, percentage, amount, user_id } = req.body;

        const contract_details = await Contracts.findById(contract_id);

        const status = contract_details?.status == 1 ? 2 : contract_details?.status;
        const payed_amount = Number(contract_details?.payed_amount) + Number(amount);
        const data = await Contracts.findByIdAndUpdate(contract_id, { payed_percentage: percentage, contract_status: status, payed_amount: payed_amount });

        const new_transaction = new Transaction({ project_id: contract_details?.project_id, bitting_id: contract_details?.bitting_id, contract_id: contract_details?._id, amount: amount, payment_person: user_id, payment_type: 1 });

        await new_transaction.save();
        return res.status(200).json({ message: `Payment completed Successfully!` });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}

const releasePayment = async (req?: Request | null, res?: Response | null): Promise<void | Response> => {
    const reply = (code: number, body: any) => {
        if (res && typeof res.status === "function") {
            return res.status(code).json(body);
        }
        if (code >= 400) console.error("releasePayment:", body);
        else console.log("releasePayment:", body);
        return;
    };

    try {
        if (
            !process.env.RAZORPAY_KEY_ID ||
            !process.env.RAZORPAY_KEY_SECRET ||
            !process.env.RAZORPAY_ACCOUNT_NO
        ) {
            return reply(500, {
                message:
                    "RazorpayX creds missing. Configure RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_ACCOUNT_NO.",
            }) as any;
        }

        const contracts = await Contracts.find({
            completion_percentage: 100,
            form_status: 0,
        });

        if (!contracts.length) {
            return reply(200, { message: "No contracts to release." }) as any;
        }

        const results: Array<{
            contractId: string;
            status: "success" | "skipped" | "failed";
            reason?: string;
            payoutId?: string;
        }> = [];

        await Promise.all(
            contracts.map(async (data) => {
                try {
                    const amountInPaise = Math.round(Number(data?.budget || 0) * 100);
                    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
                        results.push({
                            contractId: String(data?._id),
                            status: "skipped",
                            reason: "Invalid or zero budget",
                        });
                        return;
                    }

                    const freelancer = await User.findById(data?.freelancer);
                    if (!freelancer) {
                        results.push({
                            contractId: String(data?._id),
                            status: "skipped",
                            reason: "Freelancer not found",
                        });
                        return;
                    }

                    // Skip actual payouts in test/staging
                    if (!ENABLE_PAYOUTS) {
                        try {
                            const new_transaction = new Transaction({
                                project_id: data.project_id,
                                bitting_id: data.bitting_id,
                                contract_id: data._id,
                                amount: data.budget,
                                payment_person: data.freelancer,
                                payment_type: 2,
                            });
                            await new_transaction.save();
                        } catch { }
                        data.form_status = 1;
                        await data.save();
                        results.push({
                            contractId: String(data?._id),
                            status: "success",
                            payoutId: "skipped-payouts",
                        });
                        return;
                    }

                    // 1️⃣ Create or ensure Razorpay contact exists
                    let contactId: string | null = null;
                    try {
                        const contactRes = await axios.post(
                            `${RAZORPAY_X_URL}/v1/contacts`,
                            {
                                name: freelancer.name || "Freelancer",
                                email: freelancer.email || "test@example.com",
                                type: "vendor",
                                reference_id: String(freelancer._id),
                            },
                            { auth: razorpayAuth, timeout: 15000 }
                        );
                        contactId = contactRes.data?.id;
                    } catch (e: any) {
                        if (e?.response?.status === 409) {
                            contactId =
                                e?.response?.data?.error?.metadata?.contact_id || null;
                        }
                        if (!contactId) {
                            const reason =
                                e?.response?.data?.error?.description ||
                                e?.message ||
                                "Contact create failed";
                            results.push({
                                contractId: String(data?._id),
                                status: "failed",
                                reason: `contact:create - ${reason}`,
                            });
                            return;
                        }
                    }

                    // 2️⃣ Create fund account (test handle UPI)
                    let fundAccountId: string | null = null;
                    try {
                        const fundRes = await axios.post(
                            `${RAZORPAY_X_URL}/v1/fund_accounts`,
                            {
                                contact_id: contactId,
                                account_type: "vpa",
                                vpa: { address: "success@razorpay" },
                            },
                            { auth: razorpayAuth, timeout: 15000 }
                        );
                        fundAccountId = fundRes.data?.id;
                    } catch (e: any) {
                        fundAccountId =
                            e?.response?.data?.error?.metadata?.fund_account_id || null;
                        if (!fundAccountId) {
                            const reason =
                                e?.response?.data?.error?.description ||
                                e?.message ||
                                "Fund account create failed";
                            results.push({
                                contractId: String(data?._id),
                                status: "failed",
                                reason: `fund:create - ${reason}`,
                            });
                            return;
                        }
                    }

                    // 3️⃣ Create payout
                    let payoutId = "";
                    try {
                        const payoutRes = await axios.post(
                            `${RAZORPAY_X_URL}/v1/payouts`,
                            {
                                account_number: process.env.RAZORPAY_ACCOUNT_NO,
                                fund_account_id: fundAccountId,
                                amount: amountInPaise,
                                currency: "INR",
                                mode: "UPI",
                                purpose: "payout",
                                narration: `Auto payment for contract ${String(
                                    data.project_id
                                ).slice(0, 12)}`,
                                queue_if_low_balance: true,
                            },
                            { auth: razorpayAuth, timeout: 20000 }
                        );
                        payoutId = payoutRes.data?.id;
                    } catch (e: any) {
                        const reason =
                            e?.response?.data?.error?.description ||
                            e?.message ||
                            "Payout failed";
                        const acct = String(process.env.RAZORPAY_ACCOUNT_NO || "");
                        const acctMasked = acct
                            ? `${acct.slice(0, 2)}***${acct.slice(-2)}`
                            : "(unset)";
                        results.push({
                            contractId: String(data?._id),
                            status: "failed",
                            reason: `payout:create - ${reason} [base=${RAZORPAY_X_URL}, acct=${acctMasked}]`,
                        });
                        return;
                    }

                    // 4️⃣ Log transaction + update status
                    try {
                        const new_transaction = new Transaction({
                            project_id: data.project_id,
                            bitting_id: data.bitting_id,
                            contract_id: data._id,
                            amount: data.budget,
                            payment_person: data.freelancer,
                            payment_type: 2,
                        });
                        await new_transaction.save();
                    } catch { }

                    data.form_status = 1;
                    await data.save();

                    results.push({
                        contractId: String(data?._id),
                        status: "success",
                        payoutId,
                    });
                } catch (innerErr: any) {
                    const reason =
                        innerErr?.response?.data?.error?.description ||
                        innerErr?.message ||
                        "Unknown error";
                    results.push({
                        contractId: String(data?._id),
                        status: "failed",
                        reason,
                    });
                }
            })
        );

        return reply(200, { message: "Release run completed.", results }) as any;
    } catch (err: any) {
        console.error("❌ Release Payment Error:", err?.response?.data || err?.message);
        return reply(500, {
            message:
                err?.response?.data?.error?.description ||
                err?.message ||
                "Payment release failed.",
        }) as any;
    }
};

const createOrder = async (req: Request, res: Response) => {
    try {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ message: "Razorpay keys are not configured on server." });
        }

        let { amount, currency, receipt, notes } = req.body as { amount: number | string; currency?: string; receipt?: string; notes?: any };

        if (amount === undefined || amount === null) {
            return res.status(400).json({ message: "amount is required" });
        }

        // Normalize to integer paise
        let amountNumber = Number(amount);
        if (!Number.isFinite(amountNumber)) {
            return res.status(400).json({ message: "amount must be a number" });
        }

        // If client sent rupees (e.g., 123.45), convert to paise
        // If client sent paise (e.g., 12345), keep as-is
        // Heuristic: if amountNumber < 1000 and has decimals -> rupees, else assume paise
        const looksLikeRupees = amountNumber < 1000 && String(amount).includes(".");
        if (looksLikeRupees) {
            amountNumber = Math.round(amountNumber * 100);
        } else {
            amountNumber = Math.round(amountNumber);
        }

        if (amountNumber < 100) {
            return res.status(400).json({ message: "Minimum amount is ₹1.00" });
        }

        // Ensure receipt <= 40 chars; generate compact if missing
        let finalReceipt = typeof receipt === "string" && receipt.trim() ? receipt.trim() : `rp_${Date.now().toString(36)}`;
        if (finalReceipt.length > 40) finalReceipt = finalReceipt.slice(0, 40);

        const options = {
            amount: amountNumber,
            currency: currency || "INR",
            receipt: finalReceipt,
            notes: notes || undefined,
        } as any;

        const order = await razorpay.orders.create(options);
        return res.json(order);
    } catch (err: any) {
        return res.status(500).json({ message: err?.error?.description || err.message || "Failed to create order" });
    }
};

const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(sign)
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            return res.json({ message: "Payment verified successfully!" });
        } else {
            return res.status(400).json({ message: "Invalid signature" });
        }
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

const SubmitRating = async (req: Request, res: Response) => {
    try {
        const { contract_id, user_type, rating, review } = req.body; //user_type = 1 => freelancer , 2 => client

        if (user_type == 1) {
            const newFreelancerRating = await Contracts.findByIdAndUpdate(contract_id, { freelancer_rating: rating, freelancer_review: review, freelancer_rating_status: 1 });

        } else if (user_type == 2) {
            const newClientRating = await Contracts.findByIdAndUpdate(contract_id, { client_rating: rating, client_review: review, client_rating_status: 1 });

        } else {
            return res.status(500).json({ message: "User type required!" })
        }

        return res.status(200).json({ message: "Rating submitted successfully!" })

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
}


export { List, GetData, Delete, Approval, AttachmentSubmittion, getAllAttachment, submitPayment, releasePayment, createOrder, verifyPayment, SubmitRating };