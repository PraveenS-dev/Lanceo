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
import Swal from 'sweetalert2';
import { getAllProjectName } from '../../services/Project';
import { displayDateTimeFormat, getTransactionType } from '../../services/Helpers';
import { deleteItem, getListData } from '../../services/Transaction';
import { useUserName } from '../../utils/useUserName';
import { FaDownLeftAndUpRightToCenter, FaArrowUpRightFromSquare } from "react-icons/fa6";


type FormInputs = {
    project_id: string | null,
    created_by: string | null,
    type: string | null,
}

const Transaction_list = () => {
    const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormInputs>({
        defaultValues: {
            project_id: null,
            created_by: null,
            type: null,
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

    const deleteListItem = async (id: string) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        });

        if (result.isConfirmed) {
            try {
                await deleteItem(id); // your delete function
                await handleSubmit(onSubmit)(); // refresh or re-fetch list

                Swal.fire({
                    title: "Deleted!",
                    text: "Item has been deleted.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } catch (err) {
                Swal.fire({
                    title: "Error!",
                    text: "Something went wrong.",
                    icon: "error",
                });
            }
        }
    };

    const crumbs = [
        { label: "Home", path: "/dashboard" },
        { label: "Transaction" },
    ];

    useEffect(() => {
        const getProjects = async () => {
            const res = await getAllProjectName();
            setProjects(res);
        }
        getProjects();
    }, []);

    const typeOptions = [
        { "value": 1, "label": "Received" },
        { "value": 2, "label": "Sent" },
    ];

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            const params: any = {
                user_id: user?.id,
                user_role: user?.role,
                page: page,
            };

            if (data.project_id !== undefined) params.project_id = data.project_id;
            if (data.type !== undefined) params.type = data.type;

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
                <h3 className='text-2xl font-bold'>Transaction List</h3>
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
                                    <label htmlFor="type" className="form-label">Payment Type</label>
                                    <Controller
                                        name="type"
                                        control={control}
                                        render={({ field }) => (
                                            <DarkModeSelect
                                                {...field}                  // pass field directly
                                                options={typeOptions}
                                                placeholder="Select payment type..."
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
                {/* Summary */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6 flex flex-wrap justify-between text-sm sm:text-base">
                    <p className="font-medium text-green-600 dark:text-green-400">
                        💰 Total Received:{" "}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            ₹{listData?.total_received_amount?.toLocaleString()}
                        </span>
                    </p>
                    <p className="font-medium text-red-500 dark:text-red-400">
                        💸 Total Sent:{" "}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            ₹{listData?.total_send_amount?.toLocaleString()}
                        </span>
                    </p>
                </div>

                {/* Transaction History List */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                    {listData?.data?.map((transaction) => {
                        const isReceived = (transaction?.payment_type == 1 && user?.role == 1) || (transaction?.payment_type == 2 && user?.role != 1);

                        return (
                            <div
                                key={transaction?._id}
                                onClick={() => navigate(`/transactions/view/${transaction?._id}`)}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors duration-200 cursor-pointer"
                            >
                                {/* Left: Icon + User Info */}
                                <div className="flex items-center space-x-4">
                                    <div
                                        className={`w-10 h-10 flex items-center justify-center rounded-full shadow-sm ${isReceived
                                                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                            }`}
                                    >
                                        {isReceived ? (
                                            <FaDownLeftAndUpRightToCenter className="text-lg" />
                                        ) : (
                                            <FaArrowUpRightFromSquare className="text-lg" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-800 dark:text-gray-100">
                                            <UserNameDisplay userId={transaction?.payment_person} />
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {isReceived ? "Received From" : "Sent To"} •{" "}
                                            {transaction?.project_id?.title || "No Project"}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Amount + Date */}
                                <div className="text-right">
                                    <p
                                        className={`font-semibold ${isReceived
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-red-500 dark:text-red-400"
                                            }`}
                                    >
                                        {isReceived ? "+" : "-"}₹{Number(transaction?.amount).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {displayDateTimeFormat(transaction?.created_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
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


export default Transaction_list