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
import { deleteItem, getBittingListData } from '../../services/Bittings';
import { getAllProjectName } from '../../services/Project';
import { displayDateTimeFormat, getThreeStatus } from '../../services/Helpers';

type FormInputs = {
  project_id: string | null,
  user_id: string | null,
}

const Bitting_list = () => {
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
  const [lastData, setLastData] = useState<any>(null);

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
    { label: "Bittings" },
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
      if (data.user_id !== undefined) params.user_id = data.user_id;


      const res = await getBittingListData(params);
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
        <h3 className='text-2xl font-bold'>Bitting List</h3>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 px-3">
        {listData?.data?.map((bitting: any) => (
          <div
            key={bitting._id}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            onClick={() => { navigate(`/bittings/view/${bitting?.project?.project_id?._id}`)}}
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {bitting?.project?.project_id?.title || "No Project Name"}
            </h3>

            <div className="grid grid-cols-1 gap-2">
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                <span className="font-medium">Start Date: </span>
                {displayDateTimeFormat(bitting?.project?.created_at)}
              </div>

              <div className="text-sm">
                <span className="font-medium">Last Status: </span>
                {getThreeStatus(bitting?.latest?.bitting_status)}
              </div>
            </div>
          </div>
        ))}
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


export default Bitting_list