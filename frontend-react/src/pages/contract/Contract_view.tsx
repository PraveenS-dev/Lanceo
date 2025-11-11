import { useNavigate, useParams } from 'react-router-dom';
import Back_btn from '../../components/Buttons/Back_btn';
import BrudCrumbs from '../../components/BrudCrumbs';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { displayDateTimeFormat, getContractStatus } from '../../services/Helpers';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { ShowToast } from '../../utils/showToast';
import Approve_btn from '../../components/Buttons/Approve_btn';
import Reject_btn from '../../components/Buttons/Reject_btn';
import { AttachmentSubmition, ContractApproval, getContractData, getContractAttachmentsByPercentage, getApprovalLogs } from '../../services/Contract';
import { useUserName } from '../../utils/useUserName';
import { AiOutlinePlus } from 'react-icons/ai';
import { Dialog } from "@headlessui/react";
import Submit_btn from '../../components/Buttons/Submit_btn';
import DarkModeSelect from '../../components/DarkModeSelect';
import TicketReasons from "../../data/TicketReasons.json";
import { CheckTicketExist, Store } from '../../services/Tickets';


type FormInputs = {
    contract_id: string,
    remarks: string,
    percent: number,
    reason: number,
}


// normalized file object shape is defined inline in state type below

const Contract_view = () => {
    const { contract_id } = useParams<({ contract_id: string })>();
    const { user } = useAuth();
    const [editData, setEditData] = useState<any>(null);
    const { register, control, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInputs>({ mode: "onChange" });
    const [actionStatus, setActionStatus] = useState(null);
    const [files, setFiles] = useState<
        {
            id?: string;
            file?: File;
            preview: string;
            isNew?: boolean;
            isRemoved?: boolean;
            file_name: string;
            extention: string;
            file_path: string;
        }[]
    >([]);
    const navigate = useNavigate();
    const userId = user?.id;
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [isTicketExist, setIsTicketExist] = useState(false);
    const [isTicketOpen, setIsTicketOpen] = useState(false);
    const [availablePercents, setAvailablePercents] = useState<
        { value: number; label: string }[]
    >([]);
    const [previousAttachments, setPreviousAttachments] = useState<Record<number, {
        id?: string;
        preview: string;
        file_name: string;
        extention: string;
        file_path: string;
        freelancer_remarks?: string;
        client_remarks?: string;
    }[]>>({});
    const [approvalLogs, setApprovalLogs] = useState<{
        _id: string;
        percentage: number;
        action: Number;
        remarks: string;
        acted_by?: string;
        acted_by_role?: number;
        created_at?: string;
        attachment_count?: number;
    }[]>([]);

    const crumbs = [
        { label: "Home", path: "/dashboard" },
        { label: "Contracts", path: "/contracts/list" },
        { label: "View" },
    ];

    const fetchData = async () => {
        const res = await getContractData(contract_id);
        setEditData(res);
        const allPercents = [25, 50, 75, 100];
        const prevPercent = res.completion_percentage || 0;
        const available = allPercents
            .filter((p) => p > prevPercent)
            .map((p) => ({ value: p, label: `${p}%` }));
        setAvailablePercents(available);
    };

    const CheckTicket = async () => {
        const res = await CheckTicketExist(contract_id);        
        setIsTicketExist(res);
    }

    useEffect(() => {
        fetchData();
        CheckTicket();
    }, [contract_id, userId]);

    useEffect(() => {
        if (editData?.attachmentDetails) {
            const existing = editData.attachmentDetails.map((a: any) => ({
                id: a._id,
                preview: `${import.meta.env.VITE_NODE_BASE_URL}${a.file_path}`,
                isNew: false,
                isRemoved: false,
                extention: a.extention,
                file_name: a.file_name,
                file_path: a.file_path,
            }));
            setFiles(existing);
        } else {
            setFiles([]);
        }
    }, [editData]);

    useEffect(() => {
        const loadAllMilestones = async () => {
            if (!editData?._id) return;
            const milestones = [25, 50, 75, 100];
            const entries: [number, any[]][] = await Promise.all(
                milestones.map(async (p) => {
                    const data = await getContractAttachmentsByPercentage(String(editData?._id), p);
                    const normalized = (data || []).map(a => ({
                        id: a._id,
                        preview: `${import.meta.env.VITE_NODE_BASE_URL}${a.file_path}`,
                        file_name: a.file_name,
                        extention: a.extention,
                        file_path: a.file_path,
                        freelancer_remarks: (a as any).freelancer_remarks,
                        client_remarks: (a as any).client_remarks,
                    }));
                    return [p, normalized] as [number, any[]];
                })
            );
            const map: Record<number, any[]> = {};
            entries.forEach(([p, arr]) => { map[p] = arr; });
            setPreviousAttachments(map);
        };
        loadAllMilestones();
    }, [editData?._id, editData?.temp_completion_percentage, editData?.completion_percentage]);

    useEffect(() => {
        const loadApprovalLogs = async () => {
            if (!editData?._id) return;
            const logs = await getApprovalLogs(String(editData?._id));
            setApprovalLogs((logs || []) as any);
        }
        loadApprovalLogs();
    }, [editData?._id]);

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const newFiles: any[] = [];
        for (let i = 0; i < e.target.files.length; i++) {
            const file = e.target.files[i];
            if (files.filter(f => !f.isRemoved).length + newFiles.length >= 5) break; // max 5 files

            const ext = file.name.split(".").pop()?.toLowerCase();
            const allowed = ["pdf", "xls", "xlsx", "jpg", "jpeg", "heif", "heic", "png", "zip"];
            if (!ext || !allowed.includes(ext)) continue;

            const isImage = ["jpg", "jpeg", "heif", "heic", "png"].includes(ext);

            // normalize new file object to match the shape used in state
            newFiles.push({
                id: undefined,
                file,
                preview: isImage ? URL.createObjectURL(file) : "",
                isNew: true,
                isRemoved: false,
                extention: ext || "",
                file_name: file.name,
                file_path: "",
            });
        }

        setFiles(prev => [...prev, ...newFiles]);
        e.target.value = ""; // reset input
    };

    // remove file by identity (or by id) to avoid index mismatch when filtering
    const removeFile = (target: {
        id?: string;
        file?: File;
        preview: string;
        isNew?: boolean;
        isRemoved?: boolean;
        file_name: string;
        extention: string;
        file_path: string;
    }) => {
        setFiles(prev => prev.map(p => {
            // match by id when available, otherwise by preview or file_name + isNew
            const sameId = p.id && target.id && p.id === target.id;
            const samePreview = !p.id && target.preview && p.preview === target.preview;
            const sameFileName = p.file_name && target.file_name && p.file_name === target.file_name && Boolean(p.isNew) === Boolean(target.isNew);

            if (sameId || samePreview || sameFileName || p === target) {
                return { ...p, isRemoved: true };
            }
            return p;
        }));
    };

    const onTicketSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            const formData = new FormData();

            formData.append("contract_id", String(editData?._id));
            formData.append("reason", String(data?.reason));
            formData.append("remarks", String(data?.remarks));
            formData.append("created_by", String(user?.id));

            const res = await Store(formData);
            ShowToast("Ticket Raised successfully!", "success");
            setIsTicketOpen(false);
            CheckTicket();

            reset();
        } catch (err: any) {
            ShowToast(err.response?.data?.message || "Something went wrong", "error")

        }
    }

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {

            const payload = {
                contract_id: String(editData?._id),
                remarks: String(data?.remarks),
                action: String(actionStatus),
            };

            const resp = await ContractApproval(payload as any);

            // optimistic: prepend approval/reject log
            const newLog = resp?.data?.log;
            if (newLog) {
                setApprovalLogs(prev => [{
                    _id: newLog._id,
                    percentage: Number(newLog.percentage || editData?.temp_completion_percentage || 0),
                    action: Number(newLog.action),
                    remarks: newLog.remarks || String(data?.remarks || ""),
                    acted_by: newLog.acted_by,
                    acted_by_role: newLog.acted_by_role,
                    created_at: newLog.created_at,
                    attachment_count: newLog.attachment_count,
                }, ...prev]);
            }

            fetchData();

            if (actionStatus == 1) {
                ShowToast("Approved successfully!", "success")
            } else {
                ShowToast("Rejected successfully!", "success")

            }
            reset();
        } catch (err: any) {
            ShowToast(err.response?.data?.message || "Something went wrong", "error")

        }
    }

    const onAttachmentSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {

            const formData = new FormData();

            files.forEach((f) => {
                if (f.isNew && !f.isRemoved && f.file) {
                    formData.append("attachments", f.file);
                }
            });

            files.forEach(f => {
                if (!f.isNew && !f.isRemoved && f.id) {
                    formData.append("existing_attachments[]", f.id);
                }
            });

            formData.append("contract_id", String(editData?._id));
            formData.append("remarks", String(data?.remarks));
            const percentToUse = editData?.contract_status == 7
                ? Number(editData?.temp_completion_percentage || 0)
                : Number(data?.percent || 0);
            formData.append("percentage", String(percentToUse));
            formData.append("created_by", String(user?.id));

            const resp = await AttachmentSubmition(formData as any);

            // optimistic: prepend submission log
            const newLog = resp?.data?.log;
            if (newLog) {
                setApprovalLogs(prev => [{
                    _id: newLog._id,
                    percentage: Number(newLog.percentage || data?.percent || 0),
                    action: Number(newLog.action),
                    remarks: newLog.remarks || String(data?.remarks || ""),
                    acted_by: newLog.acted_by,
                    acted_by_role: newLog.acted_by_role,
                    created_at: newLog.created_at,
                    attachment_count: newLog.attachment_count,
                }, ...prev]);
            }

            fetchData();

            ShowToast("Attachments added successfully!", "success")
            reset();
        } catch (err: any) {
            ShowToast(err.response?.data?.message || "Something went wrong", "error")

        }
    }

    return (
        <div className='custom-scrollbar'>
            <BrudCrumbs crumbs={crumbs} />

            <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
                <h3 className='text-2xl font-bold'>Contract View</h3>
                <div className='flex'>
                    {!isTicketExist &&
                        <button
                            onClick={() => setIsTicketOpen(true)}
                            className="flex items-center gap-2  bg-red-600 dark:bg-red-800 font-medium transition-all duration-200  hover:bg-red-700 dark:hover:bg-red-300 active:scale-95 rounded-md  text-white dark:text-gray-200 py-2 px-4 cursor-pointer me-3"
                        >
                            <i className="fa-solid fa-ticket text-lg"></i>
                            Raise Ticket
                        </button>
                    }
                    <Back_btn url={"/contracts/list"} />
                </div>
            </div>
            <div className='px-3'>
                <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
                    <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Contract Details</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 mt-6 px-3">
                    <div
                        key={editData?._id}
                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md p-6 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                        {/* Header Section */}
                        <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                    {editData?.project_id?.title || "No Project Name"}
                                </h3>

                                <p className="text-sm text-gray-500 dark:text-gray-400 italic flex items-center gap-2">
                                    Contract ID:{" "}
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                                        {editData?._id}
                                    </span>

                                    {/* ❤️ Inline Info Icon with Red Glow */}
                                    <button
                                        onClick={() => setIsTermsOpen(true)}
                                        className="relative flex items-center text-red-500 hover:text-red-400 font-medium
                                        transition-all duration-300 ease-in-out group cursor-pointer"
                                    >
                                        {/* Icon */}
                                        <span
                                            className="w-5 h-5 flex items-center justify-center rounded-full border border-red-500/30 text-[10px] shadow-[0_0_10px_rgba(239,68,68,0.5)]
                                            group-hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] transition-all duration-300"
                                        >
                                            i
                                        </span>

                                        {/* Expanding text on hover */}
                                        <span
                                            className="max-w-0 overflow-hidden whitespace-nowrap text-xs text-red-500
                                            group-hover:max-w-[100px] group-hover:ml-2 transition-all duration-300 ease-in-out"
                                        >
                                            View Terms
                                        </span>
                                    </button>
                                </p>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                                Freelancer:{" "}
                                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                    {useUserName(editData?.freelancer) || "-"}
                                </span>
                            </p>
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                                Budget:{" "}
                                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                    ₹{editData?.budget || "-"}
                                </span>
                            </p>
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                                Payed Amount:{" "}
                                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                    ₹{editData?.payed_amount || "-"}
                                </span>
                            </p>
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                                Payed Percentage:{" "}
                                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                    {editData?.payed_percentage || "0"}%
                                </span>
                            </p>
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                                Completion:{" "}
                                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                    {editData?.completion_percentage || "0"}%
                                </span>
                            </p>
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                                Status:{" "}
                                <span>{getContractStatus(editData?.contract_status)}</span>
                            </p>
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                                Created At:{" "}
                                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                    {displayDateTimeFormat(editData?.created_at)}
                                </span>
                            </p>
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                                Deadline:{" "}
                                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                    {displayDateTimeFormat(editData?.project_id?.deadline)}
                                </span>
                            </p>
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                                Created By:{" "}
                                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                    {useUserName(editData?.created_by)}
                                </span>
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 dark:border-gray-700 my-6"></div>

                        {/* Payment Btn */}
                        {(editData?.created_by == user?.id || user?.role == 1) && editData?.payed_percentage != 100 && (
                            <div className="flex justify-end mt-4">
                                <button
                                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
                                    onClick={() => navigate(`/payment/${editData?._id}`)}
                                >
                                    💳 Make payment
                                </button>
                            </div>
                        )}

                        {/* Attachment Submittion */}
                        {(editData?.contract_status == 2 || editData?.contract_status == 7) && editData?.freelancer == user?.id &&
                            <form onSubmit={handleSubmit(onAttachmentSubmit)} className="px-1">

                                <div className='grid grid-cols-1 md:grid-cols-3'>
                                    <div>
                                        <label className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                                            Select Payment Percentage:
                                        </label>
                                        {editData?.contract_status == 7 ? (
                                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 px-3 py-2 bg-gray-50 dark:bg-zinc-800 rounded">
                                                {(editData?.temp_completion_percentage || 0)}%
                                            </div>
                                        ) : (
                                            <Controller
                                                name="percent"
                                                control={control}
                                                render={({ field }) => (
                                                    <DarkModeSelect
                                                        {...field}
                                                        options={availablePercents}
                                                        placeholder="Select percentage..."
                                                    />
                                                )}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
                                    <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Attachments</h3>
                                </div>

                                <div className="mt-3">

                                    <div className="flex flex-wrap gap-4 mt-5">
                                        {files
                                            .filter(f => !f.isRemoved)
                                            .map((f, i) => {
                                                const ext =
                                                    f.extention?.toLowerCase() ||
                                                    f.file?.name.split(".").pop()?.toLowerCase() ||
                                                    "";

                                                const isImage = ["jpg", "jpeg", "png", "heif", "heic"].includes(ext);
                                                const fileName = f.file_name || f.file?.name;
                                                const fileUrl = f.file_path
                                                    ? `${import.meta.env.VITE_NODE_BASE_URL}${f.file_path}`
                                                    : f.preview || "";

                                                return (
                                                    <div
                                                        key={f.id || f.preview || f.file_name || i}
                                                        className="relative border rounded p-2 flex flex-col items-center justify-center w-32 h-32 bg-white dark:bg-gray-800 shadow-sm"
                                                    >
                                                        {/* ❌ Remove Button */}
                                                        <button
                                                            type="button"
                                                            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-sm hover:bg-red-600"
                                                            onClick={() => removeFile(f)}
                                                        >
                                                            ×
                                                        </button>

                                                        {/* 📸 Image Preview */}
                                                        {isImage ? (
                                                            <img
                                                                src={fileUrl}
                                                                alt={fileName}
                                                                className="w-28 h-28 object-cover rounded cursor-pointer"
                                                                onClick={() => window.open(fileUrl, "_blank")}
                                                                title="Click to view full image"
                                                            />
                                                        ) : (
                                                            // 📄 Non-image file
                                                            <a
                                                                href={fileUrl}
                                                                download={fileName}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-blue-500 dark:text-blue-300 text-center underline hover:text-blue-600 break-all px-2"
                                                            >
                                                                {fileName}
                                                            </a>
                                                        )}

                                                        {/* Hidden field to send attachment ID to backend */}
                                                        {!f.isNew && f.id && (
                                                            <input type="hidden" name="existing_attachments[]" value={f.id} />
                                                        )}
                                                    </div>
                                                );
                                            })}

                                        {/* ➕ Add New Upload Box */}
                                        {files.filter(f => !f.isRemoved).length < 5 && (
                                            <label className="border border-dashed rounded w-32 h-32 flex items-center justify-center cursor-pointer hover:border-gray-400 relative bg-gray-50 dark:bg-gray-700">
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".pdf,.xls,.xlsx,.jpg,.jpeg,.heif,.heic,.png,.zip"
                                                    onChange={handleFilesChange}
                                                    multiple
                                                />
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300">
                                                        <AiOutlinePlus size={18} />
                                                    </div>
                                                    <span className="text-gray-400 text-sm mt-1 text-center">Upload</span>
                                                </div>
                                            </label>
                                        )}
                                    </div>


                                </div>

                                <div className="mt-4">
                                    <label
                                        htmlFor="remarks"
                                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                                    >
                                        Remarks
                                    </label>
                                    <textarea
                                        id="remarks"
                                        rows={6}
                                        placeholder="Write your remarks here..."
                                        className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-zinc-800 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        {...register("remarks", {
                                            required: "Remarks is required!",
                                            minLength: {
                                                value: 2,
                                                message: "Remarks must be at least 2 characters long!",
                                            },
                                        })}
                                    ></textarea>
                                    {errors.remarks && (
                                        <span className="text-red-500 mt-1 text-sm">
                                            {errors.remarks.message}
                                        </span>
                                    )}
                                </div>
                                <div className='flex justify-end mt-5'>
                                    <Submit_btn isSubmitting={isSubmitting} />
                                </div>
                            </form>
                        }

                        {/* Submission Log Table with attachments */}
                        <div className="mt-8">
                            <div className='p-2 border-l-4 border-blue-400 dark:border-blue-500 bg-blue-100 dark:bg-blue-600/20 rounded-sm'>
                                <h3 className='text-xl font-semibold text-blue-700 dark:text-blue-100'>Submission Log</h3>
                            </div>
                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded">
                                    <thead className="bg-gray-50 dark:bg-zinc-800">
                                        <tr>
                                            <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Milestone</th>
                                            <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Status</th>
                                            <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Freelancer Remarks</th>
                                            <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Client Remarks</th>
                                            <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Attachments</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[25, 50, 75, 100].map((p) => {
                                            const latestPercent = editData?.temp_completion_percentage || 0;
                                            const approvedPercent = editData?.completion_percentage || 0;
                                            let statusLabel = "-";
                                            if (approvedPercent >= p) statusLabel = "Approved";
                                            else if (editData?.contract_status == 5 && latestPercent == p) statusLabel = "Pending Approval";
                                            else if (editData?.contract_status == 7 && latestPercent == p) statusLabel = "Rejected";
                                            const list = previousAttachments[p] || [];
                                            return (
                                                <tr key={p} className="border-b border-gray-100 dark:border-gray-800">
                                                    <td className="p-3 font-semibold text-gray-800 dark:text-gray-100">{p}%</td>
                                                    <td className="p-3">
                                                        <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">{statusLabel}</span>
                                                    </td>
                                                    <td className="p-3 align-top max-w-[260px] text-gray-800 dark:text-gray-100">
                                                        <div className="whitespace-pre-wrap break-words">
                                                            {(list[0]?.freelancer_remarks) || "-"}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 align-top max-w-[260px] text-gray-800 dark:text-gray-100">
                                                        <div className="whitespace-pre-wrap break-words">
                                                            {(list[0]?.client_remarks) || "-"}
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex flex-wrap gap-3">
                                                            {list.length === 0 && <span className="text-gray-400">No files</span>}
                                                            {list.map((f, i) => {
                                                                const ext = f.extention?.toLowerCase() || "";
                                                                const isImage = ["jpg", "jpeg", "png", "heif", "heic"].includes(ext);
                                                                const fileUrl = f.file_path ? `${import.meta.env.VITE_NODE_BASE_URL}${f.file_path}` : f.preview || "";
                                                                const fileName = f.file_name;
                                                                return (
                                                                    <div key={f.id || f.preview || f.file_name || i} className="border rounded p-2 flex items-center gap-2 bg-white dark:bg-gray-800">
                                                                        {isImage ? (
                                                                            <img src={fileUrl} alt={fileName} className="w-10 h-10 object-cover rounded cursor-pointer" onClick={() => window.open(fileUrl, "_blank")} />
                                                                        ) : (
                                                                            <span className="text-[10px] px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">{ext.toUpperCase()}</span>
                                                                        )}
                                                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-300 underline break-all max-w-[220px]">
                                                                            {fileName}
                                                                        </a>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Approval History - minimal genz style */}
                        {approvalLogs.length > 0 && (
                            <div className="mt-6">
                                <div className='p-2 border-l-4 border-purple-400 dark:border-purple-500 bg-purple-100 dark:bg-purple-600/20 rounded-sm'>
                                    <h3 className='text-xl font-semibold text-purple-700 dark:text-purple-100'>Approval History</h3>
                                </div>
                                <div className="mt-3 flex flex-col gap-2">
                                    {approvalLogs.map((log) => {
                                        const actionNum = Number((log as any).action);
                                        const isApproved = actionNum === 1;
                                        const isSubmission = actionNum === 2;
                                        return (
                                            <div key={log._id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-zinc-900/70 backdrop-blur">
                                                {isSubmission ? (
                                                    <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-blue-500 text-white">📎</span>
                                                ) : (
                                                    <span className={`mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${isApproved ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                        {isApproved ? '✓' : '✕'}
                                                    </span>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{isSubmission ? 'Submitted Attachments' : isApproved ? 'Approved' : 'Rejected'}</span>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">{log.percentage}%</span>
                                                        {isSubmission && typeof log.attachment_count === 'number' && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200">{log.attachment_count} files</span>
                                                        )}
                                                        {log.created_at && (
                                                            <span className="text-xs text-gray-500">{displayDateTimeFormat(log.created_at)}</span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
                                                        {log.remarks || '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Approval Form */}
                        {editData?.contract_status == 5 &&
                            ((editData?.created_by == user?.id) || user?.role == 1) && (
                                <form onSubmit={handleSubmit(onSubmit)} className="px-1">

                                    <div className="mt-4">
                                        <label
                                            htmlFor="remarks"
                                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                                        >
                                            Remarks
                                        </label>
                                        <textarea
                                            id="remarks"
                                            rows={6}
                                            placeholder="Write your remarks here..."
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-zinc-800 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            {...register("remarks", {
                                                required: "Remarks is required!",
                                                minLength: {
                                                    value: 2,
                                                    message: "Remarks must be at least 2 characters long!",
                                                },
                                            })}
                                        ></textarea>
                                        {errors.remarks && (
                                            <span className="text-red-500 mt-1 text-sm">
                                                {errors.remarks.message}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-end mt-6">
                                        <Reject_btn setActionStatus={setActionStatus} isSubmitting={isSubmitting} />
                                        <Approve_btn setActionStatus={setActionStatus} isSubmitting={isSubmitting} />
                                    </div>
                                </form>
                            )
                        }

                    </div>
                </div>

            </div>

            <Dialog
                open={isTermsOpen}
                onClose={() => setIsTermsOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-lg rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-gray-300 dark:border-gray-700">
                        <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            ⚠️ Contract Safety Guidelines
                        </Dialog.Title>

                        <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            <p>
                                <strong>1. For Freelancers:</strong> Do <u>not start working</u> before the
                                client makes a payment into the app. Your payment is protected only when the
                                contract status shows <b>“Working”</b>.
                            </p>

                            <p>
                                <strong>2. Contract Safety:</strong> We are <u>not responsible</u> for any
                                payment or loss if work starts before the payment confirmation.
                            </p>

                            <p>
                                <strong>3. Disputes:</strong> If either the client or freelancer is not
                                satisfied with the contract progress, they can <b>raise a ticket</b> with a
                                valid reason.
                            </p>

                            <p>
                                <strong>4. Project Submissions:</strong> Freelancers must submit project
                                deliverables at <b>25%, 50%, 75%, and 100%</b> completion milestones.
                                These submissions are required to process refunds fairly if a ticket is raised.
                            </p>

                            <p>
                                <strong>5. Transparency:</strong> Keep all communication and progress updates
                                inside the platform to maintain dispute protection.
                            </p>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setIsTermsOpen(false)}
                                className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition-all"
                            >
                                I Understand
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            <Dialog
                open={isTicketOpen}
                onClose={() => setIsTicketOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-xl w-xl rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-gray-300 dark:border-gray-700">
                        <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            ⚠️ Raise Ticket
                        </Dialog.Title>

                        <form onSubmit={handleSubmit(onTicketSubmit)} className="px-1">

                            <div className="mt-4">
                                <label
                                    htmlFor="reason"
                                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Reason
                                </label>
                                <Controller
                                    name="reason"
                                    control={control}
                                    render={({ field }) => (
                                        <DarkModeSelect
                                            {...field}                  // pass field directly
                                            options={TicketReasons}
                                            placeholder="Select reason..."
                                        />
                                    )}
                                />
                            </div>

                            <div className="mt-4">
                                <label
                                    htmlFor="remarks"
                                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Remarks
                                </label>
                                <textarea
                                    id="remarks"
                                    rows={6}
                                    placeholder="Write your remarks here..."
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-zinc-800 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    {...register("remarks", {
                                        required: "Remarks is required!",
                                        minLength: {
                                            value: 2,
                                            message: "Remarks must be at least 2 characters long!",
                                        },
                                    })}
                                ></textarea>
                                {errors.remarks && (
                                    <span className="text-red-500 mt-1 text-sm">
                                        {errors.remarks.message}
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-end mt-6">
                                <Submit_btn isSubmitting={isSubmitting} />
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>


        </div>

    )
}

export default Contract_view