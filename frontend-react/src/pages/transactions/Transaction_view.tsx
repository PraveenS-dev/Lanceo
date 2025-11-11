import { useParams } from 'react-router-dom';
import Back_btn from '../../components/Buttons/Back_btn';
import BrudCrumbs from '../../components/BrudCrumbs';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { displayDateTimeFormat, getTransactionType } from '../../services/Helpers';
import { useUserName } from '../../utils/useUserName';
import { getData } from '../../services/Transaction';

const Transaction_view = () => {
    const { transaction_id } = useParams<({ transaction_id: string })>();
    const { user } = useAuth();
    const [editData, setEditData] = useState<any>(null);

    const crumbs = [
        { label: "Home", path: "/dashboard" },
        { label: "Transactions", path: "/transactions/list" },
        { label: "View" },
    ];

    const fetchData = async () => {
        const res = await getData(transaction_id);
        setEditData(res);
    };

    useEffect(() => {
        fetchData();
    }, [transaction_id]);

    const UserNameDisplay = ({ userId }: { userId: string }) => {
        const name = useUserName(userId);
        return <>{name || "Loading..."}</>;
    };

    return (
        <div className='custom-scrollbar'>
            <BrudCrumbs crumbs={crumbs} />

            <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
                <h3 className='text-2xl font-bold'>Transaction View</h3>
                <div className='flex'>
                    <Back_btn url={"/transactions/list"} />
                </div>
            </div>
            <div className='px-3'>
                <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
                    <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Transaction Details</h3>
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
                                    Transaction ID:{" "}
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                                        {editData?._id}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                            {editData?.payment_type == 1 &&
                                <div>
                                    <p className="font-medium text-gray-600 dark:text-gray-400">
                                        Payment From:{" "}
                                        <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                            <UserNameDisplay userId={editData?.payment_person} />

                                        </span>
                                    </p>
                                    <p className="font-medium text-gray-600 dark:text-gray-400">
                                        Payment To:{" "}
                                        <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                            Lanceo
                                        </span>
                                    </p>
                                </div>
                            }
                            {editData?.payment_type == 2 &&
                                <div>
                                    <p className="font-medium text-gray-600 dark:text-gray-400">
                                        Payment From:{" "}
                                        <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                            Lanceo
                                        </span>
                                    </p>
                                    <p className="font-medium text-gray-600 dark:text-gray-400">
                                        Payment To:{" "}
                                        <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                            <UserNameDisplay userId={editData?.payment_person} />

                                        </span>
                                    </p>
                                </div>
                            }
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                                Amount:{" "}
                                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                    ₹{editData?.amount || "-"}
                                </span>
                            </p>
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                                Payment Type:{" "}
                                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                    {getTransactionType(editData?.payment_type)}
                                </span>
                            </p>
                            <p className="font-medium text-gray-600 dark:text-gray-400">
                                Payment time:{" "}
                                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                                    {displayDateTimeFormat(editData?.created_at)}
                                </span>
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </div>

    )
}

export default Transaction_view