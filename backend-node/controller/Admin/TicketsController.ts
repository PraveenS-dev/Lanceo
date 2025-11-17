import { Request, Response } from "express";
import Tickets from "../../model/Tickets";
import Contracts from "../../model/Contracts";
import User from "../../model/User";
import { getEmailIdFromIds, getEmailIdFromROles, getUserIdFromROles, loadEmailTemplate } from "../../utils/Helpers";
import { sendMail } from "../../utils/mailer";
import { sendNotification } from "./NotificationController";
import Razorpay from "razorpay";
import crypto from "crypto";
import axios from "axios";
import Transaction from "../../model/Transaction";

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

// const ENABLE_PAYOUTS = String(process.env.ENABLE_PAYOUTS || "true").toLowerCase() === "true";
const ENABLE_PAYOUTS = false;


// RazorpayX Base URL (correct one for payouts)
const RAZORPAY_X_URL = "https://api.razorpayx.com";

const List = async (req: Request, res: Response) => {
    try {
        const { project_id, created_by, page, user_role, user_id, reason } = req.query;

        const currentPage = parseInt(page as string) || 1;
        const limit = 30;
        const skip = (currentPage - 1) * limit;

        const searchCondition: any = { status: 1, trash: "NO" };

        if (project_id) searchCondition.project_id = project_id;
        if (created_by) searchCondition.created_by = created_by;
        if (reason) searchCondition.reason = reason;

        const listData = await Tickets.find(searchCondition)
            .populate("project_id", "title deadline") // get only 'title' from project
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Tickets.countDocuments(searchCondition);

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

const Store = async (req: Request, res: Response) => {
    try {
        const { contract_id, reason, remarks, created_by } = req.body;

        if (!contract_id || !reason || !created_by) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const contractDetails = await Contracts.findById(contract_id);

        if (!contractDetails) {
            return res.status(404).json({ message: "Contract not found." });
        }

        const newTicket = new Tickets({
            project_id: contractDetails?.project_id, bitting_id: contractDetails?.bitting_id,
            freelancer: contractDetails?.freelancer, client: contractDetails?.created_by, contract_id, reason, remarks, created_by
        });

        await newTicket.save();
        const creator = await User.findById(newTicket.created_by).select("name role");
        const createdByName = creator ? creator.name : "Unknown User";

        let another_assigned_user =
            contractDetails?.freelancer == created_by
                ? contractDetails?.created_by
                : contractDetails?.freelancer;

        const another_emails = another_assigned_user
            ? await getEmailIdFromIds(another_assigned_user)
            : [];

        const notify_roles = "1";

        if (notify_roles) {
            let emails = await getEmailIdFromROles(notify_roles);
            emails = [...new Set([...emails, ...another_emails])];

            if (emails.length) {
                const html = loadEmailTemplate("Mail_template", {
                    name: "",
                    module: "support ticket",
                    title: "",
                    subject: "New Ticket has been Raised",
                    action: "Raised",
                    created_by: createdByName,
                    link: `${process.env.FRONTEND_URL}/tickets/view/${newTicket._id}`,
                });

                await sendMail(emails, "New Ticket Raised!", html);
            }
        }

        if (notify_roles) {

            let assigned_users = await getUserIdFromROles(notify_roles);
            assigned_users = [...assigned_users, another_assigned_user || ""];

            const io = req.app.get("io");
            if (assigned_users?.length) {
                await sendNotification({
                    title: `Ticket raised`,
                    subject: `New Ticket has been Raised.`,
                    assigned_users,
                    url: `/tickets/view/${newTicket._id}`,
                    io,
                });
            }
        }

        res.json({ message: "Ticket Raised successfully!" });
    } catch (err: any) {
        return res.status(500).json({ message: req.body });
    }
};

const GetData = async (req: Request, res: Response) => {
    try {
        const { ticket_id } = req.query;

        if (!ticket_id) {
            return res.status(400).json({ message: "Tickets ID is required." });
        }

        const ViewData = await Tickets.findOne({
            _id: ticket_id,
            status: 1,
            trash: "NO"
        }).populate("project_id", "title");

        return res.status(200).json({ data: ViewData });

    } catch (err: any) {
        console.error("Error fetching Tickets data:", err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
};

const GetExitData = async (req: Request, res: Response) => {
    try {
        const { contract_id } = req.query;

        if (!contract_id) {
            return res.status(400).json({ message: "Contract ID is required." });
        }

        const ViewData = await Tickets.findOne({
            contract_id: contract_id,
            status: 1,
            trash: "NO"
        }).populate("project_id", "title");

        return res.status(200).json({ data: ViewData });

    } catch (err: any) {
        console.error("Error fetching Tickets data:", err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
};

const closeTicket = async (req?: Request | null, res?: Response | null) => {
    try {

        // Calculate date range for exactly 3 days ago (full day)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 1);

        const startOfDay = new Date(threeDaysAgo);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(threeDaysAgo);
        endOfDay.setHours(23, 59, 59, 999);

        // Find tickets created exactly 3 days ago
        const TicketsDetails = await Tickets.find({
            ticketstatus: 1,
            created_at: { $lte: endOfDay },
        });

        if (!TicketsDetails.length) {
            console.log("🟡 No tickets found for 3 days ago.");
            if (res) return res.status(200).json({ message: "No tickets to process." });
            return;
        }

        console.log(`🚀 Found ${TicketsDetails.length} tickets to process.`);

        const allResults: any[] = [];

        // Use for...of for proper async handling
        for (const ticket of TicketsDetails) {
            const ticket_id = ticket._id;

            const ticket_details = await Tickets.findById(ticket_id);
            if (!ticket_details) {
                allResults.push({ ticket_id, status: "failed", reason: "Ticket not found" });
                continue;
            }

            const contract_details = await Contracts.findById(ticket_details?.contract_id);
            if (!contract_details) {
                allResults.push({ ticket_id, status: "failed", reason: "Contract not found" });
                continue;
            }

            const budget = Number(contract_details?.budget || 0);
            const freelancer_percent = Number(contract_details?.completion_percentage || 0);
            const client_percent = Number(contract_details?.payed_percentage || 0) - freelancer_percent;

            // update ticket status
            await Tickets.findByIdAndUpdate(ticket_id, {
                ticketstatus: 2,
                freelancer_percent,
                client_percent,
            });

            // Razorpay credential check
            if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || !process.env.RAZORPAY_ACCOUNT_NO) {
                console.error("❌ Razorpay creds missing.");
                allResults.push({ ticket_id, status: "failed", reason: "Missing Razorpay credentials" });
                continue;
            }

            const freelancer = await User.findById(contract_details?.freelancer);
            const client = await User.findById(contract_details?.created_by);

            const freelancerAmount = (budget * freelancer_percent) / 100;
            const clientAmount = (budget * client_percent) / 100;

            const results: any[] = [];

            // Helper payout function
            const sendPayout = async (user: any, amount: number, role: string) => {
                if (!user || !Number.isFinite(amount) || amount <= 0) {
                    results.push({ user: role, status: "skipped", reason: `No valid ${role} or amount <= 0` });
                    return;
                }

                if (!ENABLE_PAYOUTS) {
                    await new Transaction({
                        project_id: contract_details?.project_id,
                        bitting_id: contract_details?.bitting_id,
                        contract_id: contract_details?._id,
                        amount,
                        payment_person: user?._id,
                        payment_type: 2,
                    }).save();

                    results.push({ user: role, status: "success", payoutId: "skipped-payouts", amount });
                    return;
                }

                try {
                    // Create contact
                    let contactId = null;
                    try {
                        const contactRes = await axios.post(
                            `${RAZORPAY_X_URL}/v1/contacts`,
                            {
                                name: user.name || role,
                                email: user.email || "test@example.com",
                                type: "vendor",
                                reference_id: String(user._id),
                            },
                            { auth: razorpayAuth, timeout: 15000 }
                        );
                        contactId = contactRes.data?.id;
                    } catch (e: any) {
                        if (e?.response?.status === 409) {
                            contactId = e?.response?.data?.error?.metadata?.contact_id || null;
                        }
                        if (!contactId) throw new Error(`Contact creation failed: ${e.message}`);
                    }

                    // Create fund account
                    let fundAccountId = null;
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
                        if (e?.response?.status === 409) {
                            fundAccountId = e?.response?.data?.error?.metadata?.fund_account_id || null;
                        }
                        if (!fundAccountId) throw new Error(`Fund account failed: ${e.message}`);
                    }

                    // Create payout
                    const payoutRes = await axios.post(
                        `${RAZORPAY_X_URL}/v1/payouts`,
                        {
                            account_number: process.env.RAZORPAY_ACCOUNT_NO,
                            fund_account_id: fundAccountId,
                            amount: Math.round(amount * 100),
                            currency: "INR",
                            mode: "UPI",
                            purpose: "payout",
                            narration: `Auto payment for ${role} - ${String(contract_details?.project_id).slice(0, 12)}`,
                            queue_if_low_balance: true,
                        },
                        { auth: razorpayAuth, timeout: 20000 }
                    );

                    const payoutId = payoutRes.data?.id;

                    await new Transaction({
                        project_id: contract_details?.project_id,
                        bitting_id: contract_details?.bitting_id,
                        contract_id: contract_details?._id,
                        amount,
                        payment_person: user?._id,
                        payment_type: 2,
                    }).save();

                    results.push({ user: role, status: "success", payoutId, amount });
                } catch (err: any) {
                    results.push({ user: role, status: "failed", reason: err.message || "Unknown error" });
                }
            };

            // 🔹 Run both payouts
            await sendPayout(freelancer, freelancerAmount, "freelancer");
            await sendPayout(client, clientAmount, "client");

            // Mark contract closed
            contract_details.form_status = 1;
            await contract_details.save();

            allResults.push({ ticket_id, results });
        }

        console.log("✅ Ticket close process complete.");
        if (res) {
            return res.status(200).json({ message: "Ticket close process complete.", allResults });
        }

        return; // for cron mode

    } catch (err: any) {
        console.error("❌ Error closing ticket:", err);
        if (res) return res.status(500).json({ message: err.message || "Internal server error" });
    }
};



export { List, Store, GetData, GetExitData, closeTicket };