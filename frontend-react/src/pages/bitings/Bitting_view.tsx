import { useParams } from 'react-router-dom';
import Back_btn from '../../components/Buttons/Back_btn';
import BrudCrumbs from '../../components/BrudCrumbs';
import { useEffect, useState } from 'react';
import { getProjectData } from '../../services/Project';
import { useAuth } from '../../contexts/AuthContext';
import ChatWindow from '../../components/ChatDropdown/ChatWindow';
import Bitting_add from '../bitings/Bitting_add';
import { bittingApproval, getBittingData, getLastBittingData } from '../../services/Bittings';
import { displayDateTimeFormat, getThreeStatus } from '../../services/Helpers';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { ShowToast } from '../../utils/showToast';
import Approve_btn from '../../components/Buttons/Approve_btn';
import Reject_btn from '../../components/Buttons/Reject_btn';


type FormInputs = {
    bitting_id: string,
    reason: string,
}

const Bitting_view = () => {
    const { project_id, bitted_by } = useParams<({ project_id: string, bitted_by: string })>();
    const { user } = useAuth();
    const [editData, setEditData] = useState<any>(null);
    const [projectData, setProjectData] = useState<any>(null);
    const [openChat, setOpenChat] = useState(false);
    const [bittingVisible, setBittingVisible] = useState(false);
    const [chatUser, setChatUser] = useState<any>(null);
    const [isStartingChat, setIsStartingChat] = useState(false);
    const [, setChatDebug] = useState<any>({ lastEvent: null, status: null, body: null, error: null });
    const { register, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInputs>({ mode: "onChange" });
    const [actionStatus, setActionStatus] = useState(null);
    const [lastBitData, setLastBitData] = useState<any>(null);

    const userId = user?.id;

    const handleStartMessaging = async () => {
        const contactId = projectData?.created_by;
        if (!contactId) {
            alert("Contact not found for this project.");
            return;
        }
        if (!userId) {
            alert("Please login to start messaging.");
            console.warn("User not logged in, cannot start chat");
            return;
        }

        console.log("Starting chat", { userId, contactId });
        setChatDebug({ lastEvent: 'starting', status: null, body: null, error: null });
        setIsStartingChat(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_NODE_BASE_URL}/chatlist/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, contactId }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Chatlist API error:", res.status, text);
                setChatDebug({ lastEvent: 'http_error', status: res.status, body: text, error: null });
                alert("Unable to start chat. Server returned an error.");
                return;
            }

            const data = await res.json();
            if (!data?.success) {
                console.warn("Chatlist response missing success:", data);
                setChatDebug({ lastEvent: 'invalid_response', status: 200, body: data, error: null });
                alert("Unable to start chat. Unexpected server response.");
                return;
            }

            console.log("Chat started", data);
            setChatDebug({ lastEvent: 'started', status: 200, body: data, error: null });
            setChatUser({
                userId: contactId,
                name: data.contactName,
            });
            setOpenChat(true);
        } catch (err) {
            console.error("Error starting chat:", err);
            setChatDebug((d: any) => ({ ...d, lastEvent: 'exception', error: String(err) }));
            alert("Network error while starting chat.");
        }
        finally {
            setIsStartingChat(false);
        }
    };

    const crumbs = [
        { label: "Home", path: "/dashboard" },
        { label: "Bittings", path: "/bittings/list" },
        { label: "View" },
    ];

    const fetchData = async () => {
        const res = await getBittingData(project_id, bitted_by);
        setEditData(res);
    };

    const fetchLastBitData = async () => {
        const res = await getLastBittingData(project_id, bitted_by);
        setLastBitData(res);

    };

    const fetchProjData = async () => {
        const res = await getProjectData(project_id);
        setProjectData(res);

    };
    useEffect(() => {

        fetchData();
        fetchLastBitData();
        fetchProjData();

    }, [project_id, userId]);

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {

            const formData = new FormData();

            const action = actionStatus === 1 ? 2 : 3;

            formData.append("bitting_id", String(data?.bitting_id));
            formData.append("reason", String(data?.reason));
            formData.append("action", String(action));

            await bittingApproval(formData as any);

            fetchData();
            fetchProjData();

            if (actionStatus == 2) {
                ShowToast("Approved successfully!", "success")
            } else {
                ShowToast("Rejected successfully!", "success")

            }
            reset();
        } catch (err: any) {
            ShowToast(err.response?.data?.message || "Something went wrong", "error")

        }
    }

    return (
        <div className=''>
            <BrudCrumbs crumbs={crumbs} />

            <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
                <h3 className='text-2xl font-bold'>Bittings View</h3>
                <Back_btn url={"/bittings/list"} />
            </div>
            <div className='px-3'>
                <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
                    <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Bittings Details</h3>
                </div>

                <hr className='mt-5 mb-3' />

                <div className="grid grid-cols-1  gap-6 mt-6 px-3">
                    {editData?.map((bitting: any) => (
                        <div
                            key={bitting._id}
                            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col justify-between"
                        >
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
                                    {bitting?.project_id?.title || "No Project Name"}
                                </h3>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                    Budget: <span className="text-gray-800 dark:text-gray-200">{bitting?.budget || "-"}</span>
                                </p>
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                                {bitting?.message || "No message provided"}
                            </p>

                            {bitting?.bitting_status !== 1 && (
                                <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg px-3 py-2 mb-3 text-sm">
                                    <span className="font-medium">Remarks: </span>
                                    {bitting?.reason || "No remarks"}
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-auto">
                                <div>{getThreeStatus(bitting?.bitting_status)}</div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs">
                                    Created: {displayDateTimeFormat(bitting?.created_at)}
                                </div>
                            </div>
                            {bitting?.bitting_status == 1 && (projectData?.created_by == user?.id || user?.role == 1) &&(
                                <form onSubmit={handleSubmit(onSubmit)} className='px-3'>

                                    <div className='grid grid-cols-1 gap-4 mt-3'>
                                        <div className="mt-3">
                                            <input
                                                type="hidden" className="form-control" id='bitting_id' value={bitting?._id}
                                                {...register("bitting_id")}
                                            />
                                        </div>

                                        <div className="mt-3">
                                            <label htmlFor="reason" className='form-label'>Remarks</label>
                                            <textarea id="reason" className='form-control' rows={8}
                                                {...register("reason",
                                                    {
                                                        required: "Reason is required!",
                                                        minLength: {
                                                            value: 2,
                                                            message: "Reason must be minimum 2 characters length!"
                                                        }
                                                    })}></textarea>

                                            {errors.reason && (<span className="text-red-500 mt-1 text-sm"> {errors.reason.message}</span>)}

                                        </div>
                                    </div>

                                    <div className='flex justify-end mt-5'>
                                        <Reject_btn setActionStatus={setActionStatus} isSubmitting={isSubmitting} />
                                        <Approve_btn setActionStatus={setActionStatus} isSubmitting={isSubmitting} />
                                    </div>
                                </form>
                            )}
                        </div>
                    ))}
                </div>

            </div>

            {projectData?.created_by != user?.id &&

                <div className="flex justify-end gap-3">
                    {lastBitData?.bitting_status == 3 &&
                        <button
                            disabled={isStartingChat}
                            onClick={() => setBittingVisible(true)}
                            className={`
                            mt-3 px-5 py-2.5 rounded-xl font-semibold text-sm sm:text-base
                            transition-all duration-300
                            bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500
                            text-white shadow-[0_0_12px_rgba(99,102,241,0.6)]
                            hover:shadow-[0_0_20px_rgba(99,102,241,0.8)]
                            hover:scale-105 active:scale-95
                            dark:from-indigo-600 dark:via-purple-600 dark:to-pink-500
                            ${isStartingChat ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        >
                            {'Start Biting again'}
                        </button>
                    }
                    {/* Start Messaging */}
                    <button
                        onClick={handleStartMessaging}
                        disabled={isStartingChat}
                        className={`
                        mt-3 px-5 py-2.5 rounded-xl font-semibold text-sm sm:text-base
                        transition-all duration-300
                        bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500
                        text-white shadow-[0_0_12px_rgba(16,185,129,0.6)]
                        hover:shadow-[0_0_20px_rgba(16,185,129,0.8)]
                        hover:scale-105 active:scale-95
                        dark:from-emerald-600 dark:via-cyan-600 dark:to-sky-500
                        ${isStartingChat ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    >
                        {isStartingChat ? 'Starting...' : 'Start Messaging'}
                    </button>
                </div>
            }

            {/* 💬 Small popup chat window */}
            {openChat && chatUser && (
                <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center md:inset-auto md:bottom-20 md:right-5 md:left-auto md:justify-end">
                    <div className="w-full md:w-96 max-w-[90vw] md:rounded-xl bg-white dark:bg-zinc-900 shadow-lg md:shadow-lg md:static rounded-t-xl md:rounded-t-none overflow-hidden md:overflow-visible custom-scrollbar">
                        <ChatWindow
                            chat={chatUser}
                            userId={userId || ""}
                            onClose={() => setOpenChat(false)}
                        />
                    </div>
                </div>
            )}

            {bittingVisible && (
                <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center md:inset-auto md:bottom-20 md:right-5 md:left-auto md:justify-end">
                    <div className="w-full md:w-96 max-w-[90vw] md:rounded-xl bg-white dark:bg-zinc-900 shadow-lg md:shadow-lg md:static rounded-t-xl md:rounded-t-none overflow-auto md:overflow-visible custom-scrollbar">
                        <Bitting_add
                            setBittingVisible={setBittingVisible}
                            project_id={project_id as string}
                            fetchLastBitData={fetchLastBitData}
                        />
                    </div>
                </div>
            )}


        </div>
    )
}

export default Bitting_view