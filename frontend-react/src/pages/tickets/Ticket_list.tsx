import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { ShowToast } from '../../utils/showToast';
import { useNavigate } from 'react-router-dom';
import BrudCrumbs from '../../components/BrudCrumbs';
import DarkModeSelect from '../../components/DarkModeSelect';
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from 'react';
import "flatpickr/dist/flatpickr.min.css";
import Search_btn from '../../components/Buttons/Search_btn';
import Reset_btn from '../../components/Buttons/Reset_btn';
import FilterBtn from '../../components/Buttons/Filter_btn';
import { getAllProjectName } from '../../services/Project';
import { useUserName } from '../../utils/useUserName';
import TicketReasons from "../../data/TicketReasons.json";
import { getListData } from '../../services/Tickets';
import { displayDateTimeFormat, getTicketReason, getTicketStatus } from '../../services/Helpers';


type FormInputs = {
    project_id: string | null,
    created_by: string | null,
    reason: Number | null,
}

const Ticket_list = () => {
    const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormInputs>({
        defaultValues: {
            project_id: null,
            created_by: null,
            reason: null,
        },
    });

    const { user } = useAuth();
    const navigate = useNavigate();
    const [page, setPage] = useState<Number>(1);
    const [listData, setListData] = useState<any>(null);
    const [showFilter, setShowFilter] = useState(false);
    const [projects, setProjects] = useState<any>(null);

    useEffect(() => {
        handleSubmit(onSubmit)();

    }, [page]);

    const crumbs = [
        { label: "Home", path: "/dashboard" },
        { label: "Tickets" },
    ];

    useEffect(() => {
        const getProjects = async () => {
            const res = await getAllProjectName();
            setProjects(res);
        }
        getProjects();
    }, []);

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            const params: any = {
                user_id: user?.id,
                user_role: user?.role,
                page: page,
            };

            if (data.project_id !== undefined) params.project_id = data.project_id;
            if (data.reason !== undefined) params.reason = data.reason;

            const res = await getListData(params);
            setListData(res.data);
        } catch (err: any) {
            ShowToast(err.response?.data?.message || "Something went wrong", "error");
        }
    };

    const handleReset = () => {
        reset();            // reset all fields
        handleSubmit(onSubmit)(); // fetch data with defaults
    };

    const UserNameDisplay = ({ userId }: { userId: string }) => {
        const name = useUserName(userId);
        return <>{name || "Loading..."}</>;
    };

    return (
        <div className=''>
            <BrudCrumbs crumbs={crumbs} />

            <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
                <h3 className='text-2xl font-bold'>Ticket List</h3>
                <div className='px-3 flex'>
                    <FilterBtn showFilter={showFilter} setShowFilter={setShowFilter} />
                </div>
            </div>

            <AnimatePresence>
                {showFilter && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3"
                    >
                        <form onSubmit={handleSubmit(onSubmit)} className='px-3 border-b-2 pb-4 rounded bg-white dark:bg-gray-700 border-red-300 dark:border-red-600/30'>

                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>

                                <div className="mt-3 z-50">
                                    <label htmlFor="project_id" className="form-label">Project Name</label>
                                    <Controller
                                        name="project_id"
                                        control={control}
                                        render={({ field }) => (
                                            <DarkModeSelect
                                                {...field}                  // pass field directly
                                                options={projects}
                                                placeholder="Select project..."
                                            />
                                        )}
                                    />
                                </div>

                                <div className="mt-3 z-50">
                                    <label htmlFor="reason" className="form-label">Reason</label>
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
                            </div>

                            <div className='flex justify-end mt-5'>

                                <Reset_btn onClick={handleReset} />
                                <Search_btn isSubmitting={isSubmitting} />
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-6 px-3">

                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                    {listData?.data?.map((ticket: any) => (
                        <div
                            key={ticket?._id}
                            onClick={() => navigate(`/tickets/view/${ticket?._id}`)}
                            className="group border border-gray-200 dark:border-zinc-700 rounded-xl p-5 mb-3 
                                bg-white dark:bg-zinc-900 hover:shadow-md hover:-translate-y-1 
                                transition-all duration-300 cursor-pointer"
                        >
                            <div className="flex justify-between items-start">
                                {/* LEFT SIDE */}
                                <div className="flex flex-col space-y-2">
                                    {/* Project Title */}
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-500">
                                        {ticket?.project_id?.title || "Untitled Project"}
                                    </h3>

                                    {/* Created By / Users */}
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Raised by:</span>{" "}
                                            <UserNameDisplay userId={ticket?.created_by} />
                                        </span>
                                    </div>

                                    {/* Reason & Status */}
                                    <div className="flex items-center flex-wrap gap-3 mt-1 text-sm">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs 
                                            font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                            {getTicketReason(ticket?.reason)}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium `}>
                                            {getTicketStatus(ticket?.ticketstatus)}
                                        </span>
                                    </div>
                                </div>

                                {/* RIGHT SIDE - Created Date */}
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {displayDateTimeFormat(ticket?.created_at)}
                                </div>
                            </div>
                        </div>
                    ))}

                </div>
            </div>


            {(!listData?.data || listData?.data.length === 0) && (
                <div className='flex justify-center'>
                    <p className="text-gray-500 text-center py-10 text-lg font-medium rounded-lg">
                        🚫 No Data Found
                    </p>
                </div>
            )}

            <div className='flex justify-center mt-6 gap-2'>
                {Array.from({ length: listData?.totalPages || 0 }).map((_, i) => (
                    <button
                        key={i}
                        className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                        onClick={() => setPage(i + 1)}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>

        </div>
    )

}


export default Ticket_list