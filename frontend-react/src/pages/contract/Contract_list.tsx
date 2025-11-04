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
import { displayDateTimeFormat, getContractStatus, getThreeStatus } from '../../services/Helpers';
import { deleteItem, getContractListData } from '../../services/Contract';

type FormInputs = {
  project_id: string | null,
  user_id: string | null,
}

const Contract_list = () => {
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormInputs>({
    defaultValues: {
      project_id: null,
      user_id: null,
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
    { label: "Contracts" },
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

      const res = await getContractListData(params);
      setListData(res.data);
    } catch (err: any) {
      ShowToast(err.response?.data?.message || "Something went wrong", "error");
    }
  };

  const handleReset = () => {
    reset();            // reset all fields
    handleSubmit(onSubmit)(); // fetch data with defaults
  };


  return (
    <div className=''>
      <BrudCrumbs crumbs={crumbs} />

      <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
        <h3 className='text-2xl font-bold'>Contract List</h3>
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
              </div>

              <div className='flex justify-end mt-5'>

                <Reset_btn onClick={handleReset} />
                <Search_btn isSubmitting={isSubmitting} />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6 mt-6 px-3">
        {listData?.data?.map((contract: any) => (
          <div
            key={contract._id}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-md transition-shadow duration-300 cursor-pointer dark:shadow-red-800/30"
            onClick={() => { navigate(`/contracts/view/${contract?._id}`) }}
          >
            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-5 flex items-center justify-between">
              <span>{contract?.project_id?.title || "No Project Name"}</span>
            </h3>

            {/* Info Section */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col space-y-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Start Date</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {displayDateTimeFormat(contract?.created_at)}
                </span>
              </div>

              <div className="flex flex-col space-y-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Target Date</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {displayDateTimeFormat(contract?.project_id?.deadline)}
                </span>
              </div>

              <div className="flex flex-col space-y-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Payment Completion</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {contract?.payed_percentage}
                </span>
              </div>

              <div className="flex flex-col space-y-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Project Completion</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {contract?.completion_percentage}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
              <div>{getContractStatus(contract?.contract_status)}</div>
            </div>
          </div>
        ))}
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


export default Contract_list