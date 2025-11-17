import { Request, Response } from "express";
import { ParsedQs } from "qs";
import Projects from "../../model/Projects";
import Bittings from "../../model/Bittings";
import Contracts from "../../model/Contracts";
import Tickets from "../../model/Tickets";
import Transaction from "../../model/Transaction";


export const MonthWiseProjects = async (req: Request, res: Response) => {
  try {
    const { year, user_id, role } = req.query;

    const searchCondition: any = { status: 1, trash: "NO" };

    if (role == "3" && user_id) {
      searchCondition.created_by = user_id;
    }

    // 📅 Filter by year if year provided (e.g., "2025" → year = 2025)
    const yearParam = extractStringParam(year);

    if (yearParam) {
      const yearNum = parseInt(yearParam, 10);
      searchCondition.created_at = {
        $gte: new Date(`${yearNum}-01-01T00:00:00Z`),
        $lt: new Date(`${yearNum + 1}-01-01T00:00:00Z`),
      };
    }

    const Data = await Projects.find(searchCondition).sort({ created_at: -1 });

    // 📊 Prepare monthly count for chart
    const monthlyCounts = Array(12).fill(0); // Jan (0) → Dec (11)
    Data.forEach((p) => {
      const month = new Date(p.created_at ?? new Date()).getMonth();
      monthlyCounts[month]++;
    });

    return res.status(200).json({
      success: true,
      year: year ? parseInt(year as string) : "All Years",
      monthlyCounts,
      total: Data.length,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

type QueryValue = string | ParsedQs | Array<string | ParsedQs> | undefined;

const extractStringParam = (param: QueryValue): string | undefined => {
  if (param === undefined || param === null) return undefined;
  if (Array.isArray(param)) {
    return extractStringParam(param[0]);
  }
  if (typeof param === "string") {
    return param;
  }
  return undefined;
};

const buildDateRange = (year?: QueryValue, month?: QueryValue) => {
  const rawYear = extractStringParam(year);
  if (!rawYear) return null;

  const parsedYear = parseInt(rawYear, 10);
  if (Number.isNaN(parsedYear)) return null;

  let startDate = new Date(parsedYear, 0, 1);
  let endDate = new Date(parsedYear + 1, 0, 1);

  const rawMonth = extractStringParam(month);
  if (rawMonth) {
    const parsedMonth = parseInt(rawMonth, 10);
    if (!Number.isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
      startDate = new Date(parsedYear, parsedMonth - 1, 1);
      endDate = new Date(parsedYear, parsedMonth, 1);
    }
  }

  return { startDate, endDate };
};

export const BittingsStats = async (req: Request, res: Response) => {
  try {
    const { user_id, role, year, month } = req.query;

    const match: any = { status: 1, trash: "NO" };

    // Apply role-based filtering (same logic as BittingsController List)
    if (role === "2" && user_id) {
      // Freelancer → only their own bittings
      match.created_by = user_id;
    } else if (role === "3" && user_id) {
      // Client → all bittings under their projects
      const clientProjects = await Projects.find({ created_by: user_id }).select("_id");
      const projectIds = clientProjects.map((p) => p._id);
      match.project_id = { $in: projectIds };
    }
    // Admin (role 1) → no filter needed

    const range = buildDateRange(year, month);
    if (range) {
      match.created_at = {
        $gte: range.startDate,
        $lt: range.endDate,
      };
    }

    // Get bittings counts by status
    const bittingsData = await Bittings.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$bitting_status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Count total bittings
    const totalBittings = await Bittings.countDocuments(match);

    // Organize data by status
    const statusMap: any = {
      1: "Pending",
      2: "Accepted",
      3: "Rejected",
    };

    const stats = {
      total: totalBittings,
      pending: 0,
      accepted: 0,
      rejected: 0,
      breakdown: [] as any[],
    };

    bittingsData.forEach((item) => {
      if (item._id === 1) stats.pending = item.count;
      if (item._id === 2) stats.accepted = item.count;
      if (item._id === 3) stats.rejected = item.count;

      stats.breakdown.push({
        status: item._id,
        statusName: statusMap[item._id],
        count: item.count,
      });
    });

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

export const ContractsStats = async (req: Request, res: Response) => {
  try {
    const { user_id, role, year, month } = req.query;

    const match: any = { status: 1, trash: "NO" };

    // Apply role-based filtering (same logic as ContractController List)
    if (role === "2" && user_id) {
      // Freelancer → only their own contracts
      match.freelancer = user_id;
    } else if (role === "3" && user_id) {
      // Client → contracts they created
      match.created_by = user_id;
    }
    // Admin (role 1) → no filter needed

    const range = buildDateRange(year, month);
    if (range) {
      match.created_at = {
        $gte: range.startDate,
        $lt: range.endDate,
      };
    }

    // Get contracts counts by status
    const contractsData = await Contracts.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$contract_status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Count total contracts
    const totalContracts = await Contracts.countDocuments(match);

    // Status mapping
    const statusMap: any = {
      1: "Payment Pending",
      2: "Working",
      3: "Ticket Raised",
      4: "Ticket Closed",
      5: "Submitted",
      6: "Completed",
      7: "Re-work Needed",
    };

    // Color mapping for pie chart
    const colorMap: any = {
      1: "#fbbf24", // Yellow - Payment Pending
      2: "#3b82f6", // Blue - Working
      3: "#f97316", // Orange - Ticket Raised
      4: "#10b981", // Green - Ticket Closed
      5: "#a78bfa", // Purple - Submitted
      6: "#34d399", // Teal - Completed
      7: "#ef4444", // Red - Re-work Needed
    };

    const stats = {
      total: totalContracts,
      paymentPending: 0,
      working: 0,
      ticketRaised: 0,
      ticketClosed: 0,
      submitted: 0,
      completed: 0,
      reworkNeeded: 0,
      breakdown: [] as any[],
    };

    contractsData.forEach((item) => {
      if (item._id === 1) stats.paymentPending = item.count;
      if (item._id === 2) stats.working = item.count;
      if (item._id === 3) stats.ticketRaised = item.count;
      if (item._id === 4) stats.ticketClosed = item.count;
      if (item._id === 5) stats.submitted = item.count;
      if (item._id === 6) stats.completed = item.count;
      if (item._id === 7) stats.reworkNeeded = item.count;

      stats.breakdown.push({
        status: item._id,
        statusName: statusMap[item._id],
        count: item.count,
        color: colorMap[item._id],
      });
    });

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

export const TicketsStats = async (req: Request, res: Response) => {
  try {
    const { user_id, role, year, month } = req.query;

    const match: any = { status: 1, trash: "NO" };

    if (role === "2" && user_id) {
      match.freelancer = user_id;
    } else if (role === "3" && user_id) {
      match.$or = [{ client: user_id }, { created_by: user_id }];
    }

    const range = buildDateRange(year, month);
    if (range) {
      match.created_at = {
        $gte: range.startDate,
        $lt: range.endDate,
      };
    }

    const ticketsData = await Tickets.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$ticketstatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalTickets = await Tickets.countDocuments(match);

    const statusMap: Record<number, string> = {
      1: "Refund Pending",
      2: "Closed",
      3: "Cancelled",
    };

    const colorMap: Record<number, string> = {
      1: "#facc15",
      2: "#34d399",
      3: "#ef4444",
    };

    const stats = {
      total: totalTickets,
      refundPending: 0,
      closed: 0,
      cancelled: 0,
      breakdown: [] as Array<{
        status: number;
        statusName: string;
        count: number;
        color: string;
      }>,
    };

    ticketsData.forEach((item) => {
      if (item._id === 1) stats.refundPending = item.count;
      if (item._id === 2) stats.closed = item.count;
      if (item._id === 3) stats.cancelled = item.count;

      stats.breakdown.push({
        status: item._id,
        statusName: statusMap[item._id] || "Unknown",
        count: item.count,
        color: colorMap[item._id] || "#9ca3af",
      });
    });

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

export const TransactionStats = async (req: Request, res: Response) => {
  try {
    const { year, month, user_id, role } = req.query;

    const isAdmin = role === "1";

    const typeMapping = {
      received: isAdmin ? 1 : 2,
      sent: isAdmin ? 2 : 1
    };

    const match: any = { status: 1, trash: "NO" };

    if (role === "2" || role === "3") {
      match.payment_person = user_id;
    }

    let filterYear = parseInt(year as string) || new Date().getFullYear();
    let filterMonth = month && month !== 'undefined' ? parseInt(month as string) : null;


    const totalCount = await Transaction.countDocuments(match);

    if (filterMonth !== null) {
      const startDate = new Date(filterYear, filterMonth, 1);
      const endDate = filterMonth === 11
        ? new Date(filterYear + 1, 0, 1)
        : new Date(filterYear, filterMonth + 1, 1);

      match.created_at = {
        $gte: startDate,
        $lt: endDate,
      };

      // Get transaction data for selected month
      const transactionData = await Transaction.aggregate([
        { $match: match },
        { $group: { _id: "$payment_type", amount: { $sum: { $toDouble: "$amount" } } } },
      ]);

      let sentAmount = 0;
      let receivedAmount = 0;

      transactionData.forEach((item) => {
        if (item._id === typeMapping.received) {
          receivedAmount = item.amount;
        } else if (item._id === typeMapping.sent) {
          sentAmount = item.amount;
        }
      });

      const totalAmount = sentAmount + receivedAmount;

      // Get remaining purse
      const purseData = await Transaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $cond: [
                  { $eq: ["$payment_type", typeMapping.received] },
                  { $toDouble: "$amount" },
                  { $multiply: [{ $toDouble: "$amount" }, -1] }
                ]
              },
            },
          },
        },
      ]);

      const remainingPurse = purseData.length > 0 ? purseData[0].total : 0;

      return res.status(200).json({
        success: true,
        stats: {
          sentAmount: Math.round(sentAmount * 100) / 100,
          receivedAmount: Math.round(receivedAmount * 100) / 100,
          totalAmount: Math.round(totalAmount * 100) / 100,
          remainingPurse: Math.round(remainingPurse * 100) / 100,
          monthlyReceived: Array(12).fill(0),
          monthlySent: Array(12).fill(0),
        },
      });
    } else {
      // Get monthly data for the entire year
      const startDate = new Date(filterYear, 0, 1);
      const endDate = new Date(filterYear + 1, 0, 1);

      const matchYearly = { ...match, created_at: { $gte: startDate, $lt: endDate } };

      // Get all transactions for the year grouped by month
      const monthlyTransactions = await Transaction.aggregate([
        { $match: matchYearly },
        {
          $group: {
            _id: {
              month: { $month: "$created_at" },
              type: "$payment_type",
            },
            amount: { $sum: { $toDouble: "$amount" } },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]);

      // Initialize arrays for 12 months
      const monthlyReceived = Array(12).fill(0);
      const monthlySent = Array(12).fill(0);

      // Populate the arrays
      monthlyTransactions.forEach((item) => {
        const monthIndex = item._id.month - 1; // Convert 1-12 to 0-11
        if (item._id.type === 1) {
          monthlyReceived[monthIndex] = Math.round(item.amount * 100) / 100;
        } else if (item._id.type === 2) {
          monthlySent[monthIndex] = Math.round(item.amount * 100) / 100;
        }
      });

      // Get overall stats for the year
      const yearTransactionData = await Transaction.aggregate([
        { $match: matchYearly },
        { $group: { _id: "$payment_type", amount: { $sum: { $toDouble: "$amount" } } } },
      ]);

      let sentAmount = 0;
      let receivedAmount = 0;

      yearTransactionData.forEach((item) => {
        if (item._id === typeMapping.received) {
          receivedAmount = item.amount;
        } else if (item._id === typeMapping.sent) {
          sentAmount = item.amount;
        }
      });

      const totalAmount = sentAmount + receivedAmount;

      // Get remaining purse for the year
      const purseData = await Transaction.aggregate([
        { $match: matchYearly },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $cond: [
                  { $eq: ["$payment_type", typeMapping.received] },
                  { $toDouble: "$amount" },
                  { $multiply: [{ $toDouble: "$amount" }, -1] }
                ]
              },
            },
          },
        },
      ]);

      const remainingPurse = purseData.length > 0 ? purseData[0].total : 0;

      // console.log("TransactionStats - Year data:", { monthlyReceived, monthlySent, sentAmount, receivedAmount });

      return res.status(200).json({
        success: true,
        stats: {
          sentAmount: Math.round(sentAmount * 100) / 100,
          receivedAmount: Math.round(receivedAmount * 100) / 100,
          totalAmount: Math.round(totalAmount * 100) / 100,
          remainingPurse: Math.round(remainingPurse * 100) / 100,
          monthlyReceived,
          monthlySent,
        },
      });
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};