import { useParams } from 'react-router-dom';
import Back_btn from '../../components/Buttons/Back_btn';
import BrudCrumbs from '../../components/BrudCrumbs';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserName } from '../../utils/useUserName';
import { getData } from '../../services/Tickets';
import { displayDateTimeFormat, getTicketReason, getTicketStatus } from '../../services/Helpers';

const Ticket_view = () => {
    const { ticket_id } = useParams<({ ticket_id: string })>();
    const { user } = useAuth();
    const [editData, setEditData] = useState<any>(null);

    const crumbs = [
        { label: "Home", path: "/dashboard" },
        { label: "Tickets", path: "/tickets/list" },
        { label: "View" },
    ];

    const fetchData = async () => {
        const res = await getData(ticket_id);
        setEditData(res);
    };

    useEffect(() => {
        fetchData();
    }, [ticket_id]);

    const UserNameDisplay = ({ userId }: { userId: string }) => {
        const name = useUserName(userId);
        return <>{name || "Loading..."}</>;
    };

    return (
        <div className='custom-scrollbar'>
            <BrudCrumbs crumbs={crumbs} />

            <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
                <h3 className='text-2xl font-bold'>Ticket View</h3>
                <div className='flex'>
                    <Back_btn url={"/tickets/list"} />
                </div>
            </div>
            <div className='px-3'>
                <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
                    <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Ticket Details</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 mt-6 px-3">
                    <div
                        key={editData?._id}
                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 
               rounded-2xl shadow-md p-6 hover:shadow-xl transition-all duration-300"
                    >
                        {/* HEADER */}
                        <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                                    {editData?.project_id?.title || "No Project Name"}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    Ticket ID:{" "}
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                                        {editData?._id}
                                    </span>
                                </p>
                            </div>

                            {/* DATE */}
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
                                Created on:{" "}
                                <span className="font-medium text-gray-700 dark:text-gray-200">
                                    {displayDateTimeFormat(editData?.created_at)}
                                </span>
                            </div>
                        </div>

                        {/* DETAILS SECTION */}
                        <div className="space-y-5">
                            {/* Users */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-1">
                                        Raised By
                                    </span>
                                    <span className="text-base font-medium text-gray-800 dark:text-gray-100">
                                        <UserNameDisplay userId={editData?.created_by} />
                                    </span>
                                </div>

                                {editData?.client && (
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-1">
                                            Client
                                        </span>
                                        <span className="text-base font-medium text-gray-800 dark:text-gray-100">
                                            <UserNameDisplay userId={editData?.client} />
                                        </span>
                                    </div>
                                )}

                                {editData?.freelancer && (
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-1">
                                            Freelancer
                                        </span>
                                        <span className="text-base font-medium text-gray-800 dark:text-gray-100">
                                            <UserNameDisplay userId={editData?.freelancer} />
                                        </span>
                                    </div>
                                )}
                                
                                {editData?.client_percent && (
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-1">
                                            Client get
                                        </span>
                                        <span className="text-base font-medium text-gray-800 dark:text-gray-100">
                                            {editData?.client_percent}%
                                        </span>
                                    </div>
                                )}

                                {editData?.freelancer_percent && (
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-1">
                                            Freelancer get
                                        </span>
                                        <span className="text-base font-medium text-gray-800 dark:text-gray-100">
                                            {editData?.freelancer_percent}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* REASON & STATUS */}
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                <span
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold 
                                     bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                                >
                                    {getTicketReason(editData?.reason)}
                                </span>

                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold `}
                                >
                                    {getTicketStatus(editData?.ticketstatus)}
                                </span>
                            </div>

                            {/* REMARKS */}
                            <div className="mt-6">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Remarks
                                </h4>
                                <p className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-zinc-800 
                                         rounded-xl p-4 text-sm leading-relaxed border border-gray-100 dark:border-zinc-700">
                                    {editData?.remarks || "No remarks provided."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>

    )
}

export default Ticket_view