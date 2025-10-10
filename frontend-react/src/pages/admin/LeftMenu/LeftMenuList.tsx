import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from 'react';
import "flatpickr/dist/flatpickr.min.css";
import { useAuth } from '../../../contexts/AuthContext';
import { ShowToast } from '../../../utils/showToast';
import BrudCrumbs from '../../../components/BrudCrumbs';
import { deleteItem, getLeftMenuListData } from '../../../services/LeftMenu';
import Add_btn from '../../../components/Buttons/Add_btn';
import FilterBtn from '../../../components/Buttons/Filter_btn';
import Reset_btn from '../../../components/Buttons/Reset_btn';
import Search_btn from '../../../components/Buttons/Search_btn';
import DarkModeSelect from '../../../components/DarkModeSelect';
import { displayDateTimeFormat, getLeftmenuRole } from '../../../services/Helpers';
import * as FaIcons from "react-icons/fa";
import { LucideEdit, LucideEye, LucideTrash2 } from 'lucide-react';
import Swal from "sweetalert2";


type FormInputs = {
  name: string | null,
  link: string | null,
  role: string | null,
  icon: string | null,
  isParent: number | null,
  parentId: string | null,
  sort_order: number | null,
  created_by: string | null,
}

const List = () => {
  const { register, control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<FormInputs>({
    defaultValues: {
      name: "",
      link: "",
      role: null,
      icon: "",
      isParent: null,
      parentId: null,
      sort_order: null,
      created_by: null,
    },
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const isParent = Number(watch("isParent"));
  const [page, setPage] = useState<Number>(1);
  const [listData, setListData] = useState<any>(null);
  const [showFilter, setShowFilter] = useState(false);


  useEffect(() => {
    handleSubmit(onSubmit)();
  }, [page]);

  const crumbs = [
    { label: "Home", path: "/dashboard" },
    { label: "LeftMenu" },
  ];

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
      const params: any = {
        user_id: user?.id,
        user_role: user?.role,
        page: page,
      };

      if (data.name) params.name = data.name;
      if (data.role && data.role.length > 0) {
        params.role = data.role.map((s: any) => s).join(",");
      }
      if (data.link) params.link = data.link;
      if (data.icon) params.icon = data.icon;
      if (data.isParent) params.isParent = data.isParent;
      if (data.parentId) params.parentId = data.parentId;

      const res = await getLeftMenuListData(params);
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


  return (
    <div className=''>
      <BrudCrumbs crumbs={crumbs} />

      <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
        <h3 className='text-2xl font-bold'>Leftmenu List</h3>
        <div className='px-3 flex'>
          <Add_btn url={"/leftmenu/add"} />
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
            className="overflow-hidden mt-3"
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
                  <label htmlFor="link" className="form-label">Link</label>
                  <input
                    type="text" className="form-control" id='link'
                    {...register("link")}
                  />
                </div>

                <div className="mt-3">
                  <label htmlFor="role" className="form-label">Role Permission</label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <DarkModeSelect
                        {...field}
                        options={role_options}
                        isMulti
                        placeholder="Select role..."
                      />
                    )}
                  />
                </div>

                <div className="mt-3">
                  <label htmlFor="icon" className="form-label">Icon Name</label>
                  <input
                    type="text" className="form-control" id='icon'
                    {...register("icon")}
                  />
                </div>

                <div className="mt-3">
                  <label htmlFor="" className='form-label'>isParent</label>
                  <div className="flex mt-3">

                    <input type="radio" id='yes' value="1" className='form-check-input me-1'
                      {...register("isParent")} />
                    <label htmlFor="yes" className="form-label">Yes</label>

                    <input type="radio" id='no' value="0" className='form-check-input ms-3 me-1'
                      {...register("isParent")} />
                    <label htmlFor="no" className="form-label">No</label>
                  </div>
                </div>

                <div className=" mt-3">
                  <label htmlFor="parentId" className='form-label'>Parent Id</label>
                  <input type="text" className='form-control' id='parentId'
                    {...register("parentId")} />
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
                <th className="px-4 py-3 text-left font-semibold">Icon</th>
                <th className="px-4 py-3 text-left font-semibold">Parent</th>
                <th className="px-4 py-3 text-left font-semibold">Roles</th>
                <th className="px-4 py-3 text-left font-semibold">Sort</th>
                <th className="px-4 py-3 text-left font-semibold">Created At</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
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
                    <td className="px-4 py-3 text-red-600 dark:text-red-400 text-lg">
                      {FaIcons[item.icon]
                        ? React.createElement(FaIcons[item.icon])
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{item.isParent ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{getLeftmenuRole(item.role)}</td>
                    <td className="px-4 py-3">{item.sort_order}</td>
                    <td className="px-4 py-3">{displayDateTimeFormat(item.created_at)}</td>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <a
                          onClick={() => navigate(`/leftmenu/view/${item._id}`)}
                          className="cursor-pointer text-green-600 hover:text-green-700"
                        >
                          <LucideEye />
                        </a>
                        <a
                          onClick={() => navigate(`/leftmenu/edit/${item._id}`)}
                          className="cursor-pointer text-blue-600 hover:text-blue-700 dark:text-blue-800 dark:hover:text-blue-700"
                        >
                          <LucideEdit />
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
                    <div className="text-red-600 dark:text-red-400 text-lg">
                      {FaIcons[item.icon]
                        ? React.createElement(FaIcons[item.icon])
                        : "—"}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Parent:
                      </span>{" "}
                      {item.isParent ? "Yes" : "No"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Roles:
                      </span>{" "}
                      {getLeftmenuRole(item.role)}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Sort Order:
                      </span>{" "}
                      {item.sort_order}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Created:
                      </span>{" "}
                      {displayDateTimeFormat(item.created_at)}
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
                        onClick={() => navigate(`/leftmenu/view/${item._id}`)}
                        className="cursor-pointer text-green-600 hover:text-green-700"
                      >
                        <LucideEye />
                      </a>
                      <a
                        onClick={() => navigate(`/leftmenu/edit/${item._id}`)}
                        className="cursor-pointer text-blue-600 hover:text-blue-700"
                      >
                        <LucideEdit />
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


export default List