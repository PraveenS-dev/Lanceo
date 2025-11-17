import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from 'react';
import "flatpickr/dist/flatpickr.min.css";
import { useAuth } from '../../../contexts/AuthContext';
import { ShowToast } from '../../../utils/showToast';
import BrudCrumbs from '../../../components/BrudCrumbs';
import Add_btn from '../../../components/Buttons/Add_btn';
import FilterBtn from '../../../components/Buttons/Filter_btn';
import Reset_btn from '../../../components/Buttons/Reset_btn';
import Search_btn from '../../../components/Buttons/Search_btn';
import DarkModeSelect from '../../../components/DarkModeSelect';
import { displayDateFormat, displayDateTimeFormat, getUserRole } from '../../../services/Helpers';
import { LucideEye, LucideTrash2, UserLock, UserRoundCheckIcon } from 'lucide-react';
import Swal from "sweetalert2";
import { changeStatus, deleteItem, ListData } from '../../../services/Auth';


type FormInputs = {
    name: string | null,
    email: string | null,
    role: string | null,
}

const User_List = () => {
    const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormInputs>({
        defaultValues: {
            name: "",
            email: "",
            role: null,
        },
    });

    const { user } = useAuth();
    const navigate = useNavigate();
    const [page, setPage] = useState<Number>(1);
    const [listData, setListData] = useState<any>(null);
    const [showFilter, setShowFilter] = useState(false);


    useEffect(() => {
        handleSubmit(onSubmit)();
    }, [page]);

    const crumbs = [
        { label: "Home", path: "/dashboard" },
        { label: "Users" },
    ];

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            const params: any = {
                user_id: user?.id,
                user_role: user?.role,
                page: page,
            };

            if (data.name) params.name = data.name;
            if (data.email) params.email = data.email;
            if (data.role) params.role = data.role;

            const res = await ListData(params);
            setListData(res.data);
        } catch (err: any) {
            ShowToast(err.response?.data?.message || "Something went wrong", "error");
        }
    };

    const handleReset = () => {
        reset();
        handleSubmit(onSubmit)();
    };

    const role_options = [
        { value: "1", label: "Admin" },
        { value: "2", label: "Freelancer" },
        { value: "3", label: "Client" },
    ];

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

    const ChangeListItemStatus = async (id: string, old_status: number) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `Do you wanat ${old_status == 1 ? "Block" : "UnBlock"} user!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes!",
            cancelButtonText: "Cancel",
        });

        if (result.isConfirmed) {
            try {
                await changeStatus(id, old_status);
                await handleSubmit(onSubmit)(); // refresh or re-fetch list

                Swal.fire({
                    title: `${old_status == 1 ? "Blocked" : "UnBlocked"}`,
                    text: `Selected user has been ${old_status == 1 ? "Blocked" : "UnBlocked"}.`,
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


    return (
        <div className=''>
            <BrudCrumbs crumbs={crumbs} />

            <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
                <h3 className='text-2xl font-bold'>Users List</h3>
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

                                <div className="mt-3">
                                    <label htmlFor="name" className="form-label">Name</label>
                                    <input
                                        type="text" className="form-control" id='name'
                                        {...register("name")}
                                    />
                                </div>

                                <div className="mt-3">
                                    <label htmlFor="role" className="form-label">Role</label>
                                    <Controller
                                        name="role"
                                        control={control}
                                        render={({ field }) => (
                                            <DarkModeSelect
                                                {...field}
                                                options={role_options}
                                                placeholder="Select role..."
                                            />
                                        )}
                                    />
                                </div>

                                <div className="mt-3">
                                    <label htmlFor="email" className="form-label">Email</label>
                                    <input
                                        type="text" className="form-control" id='email'
                                        {...register("email")}
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

            <div className="p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="overflow-x-auto rounded-2xl shadow-lg border border-red-600/30 bg-white dark:bg-zinc-900 dark:border-red-500/40"
                >
                    {/* Desktop Table */}
                    <table className="hidden md:table min-w-full border-collapse text-sm text-gray-800 dark:text-gray-200">
                        <thead className="bg-red-600 dark:bg-red-700 text-white">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">#</th>
                                <th className="px-4 py-3 text-left font-semibold">Name</th>
                                <th className="px-4 py-3 text-left font-semibold">User Name</th>
                                <th className="px-4 py-3 text-left font-semibold">Email</th>
                                <th className="px-4 py-3 text-left font-semibold">Role</th>
                                <th className="px-4 py-3 text-left font-semibold">Status</th>
                                <th className="px-4 py-3 text-left font-semibold">Joined At</th>
                                <th className="px-4 py-3 text-left font-semibold">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {!listData?.data || listData.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                                    >
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                listData.data.map((item: any, index: number) => (
                                    <motion.tr
                                        key={item._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="border-b border-gray-200 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                                    >
                                        <td className="px-4 py-3">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium">{item.name}</td>
                                        <td className="px-4 py-3 font-medium">{item.username}</td>
                                        <td className="px-4 py-3 font-medium">{item.email}</td>
                                        <td className="px-4 py-3">{getUserRole(item.role)}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-3 py-1 text-xs font-semibold rounded-full ${item.status
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    }`}
                                            >
                                                {item.status ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{displayDateTimeFormat(item.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-3">
                                                <a
                                                    onClick={() => navigate(`/users/view/${item._id}`)}
                                                    className="cursor-pointer text-green-600 hover:text-green-700"
                                                >
                                                    <LucideEye />
                                                </a>
                                                <a
                                                    onClick={() => ChangeListItemStatus(item._id, item.status)}
                                                    className="cursor-pointer"
                                                >
                                                    {item.status == 1 ? <UserLock className='text-red-700' /> : <UserRoundCheckIcon className='text-green-700' />}
                                                </a>
                                                <a
                                                    onClick={() => deleteListItem(item._id)}
                                                    className="cursor-pointer text-red-600 hover:text-red-700"
                                                >
                                                    <LucideTrash2 />
                                                </a>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Mobile Cards */}
                    <div className="md:hidden">
                        {!listData?.data || listData.data.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                                No data available
                            </p>
                        ) : (
                            listData.data.map((item: any, index: number) => (
                                <motion.div
                                    key={item._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border border-gray-200 dark:border-zinc-700 rounded-xl p-4 mb-4 shadow-sm bg-white dark:bg-zinc-800"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold text-red-600 dark:text-red-400">
                                            {item.name}
                                        </h3>

                                    </div>

                                    <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                        <p>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                User Name:
                                            </span>{" "}
                                            {item.username}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                Email:
                                            </span>{" "}
                                            {item.email}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                Role:
                                            </span>{" "}
                                            {getUserRole(item.role)}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                Joined:
                                            </span>{" "}
                                            {displayDateFormat(item.created_at)}
                                        </p>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <span
                                            className={`px-3 py-1 text-xs font-semibold rounded-full ${item.status
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                }`}
                                        >
                                            {item.status ? "Active" : "Inactive"}
                                        </span>

                                        <div className="flex items-center space-x-3">
                                            <a
                                                onClick={() => navigate(`/users/view/${item._id}`)}
                                                className="cursor-pointer text-green-600 hover:text-green-700"
                                            >
                                                <LucideEye />
                                            </a>
                                            <a
                                                onClick={() => ChangeListItemStatus(item._id, item.status)}
                                                className="cursor-pointer"
                                            >
                                                {item.status == 1 ? <UserLock className='text-red-700' /> : <UserRoundCheckIcon className='text-green-700' />}
                                            </a>
                                            <a
                                                onClick={() => deleteListItem(item._id)}
                                                className="cursor-pointer text-red-600 hover:text-red-700"
                                            >
                                                <LucideTrash2 />
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>


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


export default User_List