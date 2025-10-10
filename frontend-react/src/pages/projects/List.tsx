import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { deleteItem, getProjectListData, ProjNameUnique, Store } from '../../services/Project';
import { ShowToast } from '../../utils/showToast';
import { useNavigate } from 'react-router-dom';
import BrudCrumbs from '../../components/BrudCrumbs';
import categories from "../../data/categories.json";
import experience from "../../data/experience.json";
import skills from "../../data/skills.json";
import DarkModeSelect from '../../components/DarkModeSelect';
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from 'react';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import Search_btn from '../../components/Buttons/Search_btn';
import { getProjectCategory, getProjectExperience, getProjectSkill } from '../../services/Helpers';
import Reset_btn from '../../components/Buttons/Reset_btn';
import FilterBtn from '../../components/Buttons/Filter_btn';
import { Edit, Trash2 } from 'lucide-react';
import Add_btn from '../../components/Buttons/Add_btn';
import Swal from 'sweetalert2';

type FormInputs = {
  title: string | null,
  description: string | null,
  category: number | null,
  skills: string | null,
  attachment: File | null,
  experience: number | null,
  budget_type: number | null,
  estimated_budget: string | null,
  estimated_hour: string | null,
  deadline: Date | null,
  no_of_freelancer: number | null,
  milestone: string | null,
  spl_instruction: string | null,
  created_by: string | null,
  user_role: string | null,
  user_id: string | null,
}

const List = () => {
  const { register, control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<FormInputs>({
    defaultValues: {
      title: "",
      category: null,
      skills: null,
      experience: null,
      budget_type: null,
      estimated_budget: "",
      estimated_hour: "",
      deadline: null,
      no_of_freelancer: null,
    },
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const budgetType = Number(watch("budget_type"));
  const [page, setPage] = useState<Number>(1);
  const [listData, setListData] = useState<any>(null);
  const [showFilter, setShowFilter] = useState(false);

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
    { label: "Projects" },
  ];

  const Category_options = categories.map((c, index) => ({
    value: index,
    label: c,
  }));

  const skills_options = skills.map((c, index) => ({
    value: index,
    label: c,
  }));

  const experience_options = experience.map((c, index) => ({
    value: index,
    label: c,
  }));

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
      const params: any = {
        user_id: user?.id,
        user_role: user?.role,
        page: page,
      };

      if (data.title) params.title = data.title;
      if (data.category !== undefined) params.category = data.category;
      if (data.experience !== undefined) params.experience = data.experience;
      if (data.skills && data.skills.length > 0) {
        params.skills = data.skills.map((s: any) => s).join(",");
      }
      if (data.budget_type) params.budget_type = data.budget_type;
      if (data.estimated_budget) params.estimated_budget = data.estimated_budget;
      if (data.estimated_hour) params.estimated_hour = data.estimated_hour;
      if (data.deadline) {
        params.deadline = Array.isArray(data.deadline) ? data.deadline[0].toISOString() : data.deadline.toISOString();
      }

      if (data.no_of_freelancer) params.no_of_freelancer = data.no_of_freelancer;

      const res = await getProjectListData(params);
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
        <h3 className='text-2xl font-bold'>Project List</h3>
        <div className='px-3 flex'>
          <Add_btn url={"/projects/add"} />
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
                  <label htmlFor="title" className="form-label">Title</label>
                  <input
                    type="text" className="form-control" id='title' {...register("title")}
                  />
                </div>

                <div className="mt-3">
                  <label htmlFor="category" className="form-label">Category</label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <DarkModeSelect
                        {...field}                // pass field directly
                        options={Category_options}
                        placeholder="Select category..."
                      />
                    )}
                  />
                </div>

                <div className="mt-3">
                  <label htmlFor="skills" className="form-label">Skills</label>
                  <Controller
                    name="skills"
                    control={control}
                    render={({ field }) => (
                      <DarkModeSelect
                        {...field}                  // pass field directly
                        options={skills_options}
                        isMulti
                        placeholder="Select skills..."
                      />
                    )}
                  />
                </div>

                <div className="mt-3">
                  <label htmlFor="experience" className="form-label">Experience</label>
                  <Controller
                    name="experience"
                    control={control}
                    render={({ field }) => (
                      <DarkModeSelect
                        {...field}
                        options={experience_options}
                        placeholder="Select experience..."
                      />
                    )}
                  />
                </div>

                <div className="mt-3">
                  <label htmlFor="" className='form-label'>Budget Type</label>
                  <div className="flex mt-3">

                    <input type="radio" id='hourly_pay' value="1" className='form-check-input me-1'
                      {...register("budget_type")} />
                    <label htmlFor="hourly_pay" className="form-label">Hourly Pay</label>

                    <input type="radio" id='fixed_pay' value="2" className='form-check-input ms-3 me-1'
                      {...register("budget_type")} />
                    <label htmlFor="fixed_pay" className="form-label">Fixed Pay</label>
                  </div>
                </div>

                {budgetType === 1 && (
                  <motion.div
                    key="hourly_budget"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    <label htmlFor="estimated_hour" className='form-label'>Estimated Houre</label>
                    <input type="text" className='form-control' id='estimated_hour'
                      {...register("estimated_hour")} />

                  </motion.div>
                )}

                {budgetType === 2 && (
                  <motion.div
                    key="fixed_budget"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    <label htmlFor="estimated_budget" className='form-label'>Estimated Budget</label>
                    <input type="text" className='form-control' id='estimated_budget'
                      {...register("estimated_budget")} />

                  </motion.div>
                )}

                <div className="mt-3">
                  <label htmlFor="deadline" className="form-label">Deadline</label>
                  <Controller
                    control={control}
                    name="deadline"
                    render={({ field }) => (
                      <Flatpickr
                        {...field}
                        id="deadline"
                        className="form-control"
                        options={{
                          dateFormat: "d-m-Y",
                          allowInput: true,
                        }}
                      />
                    )}
                  />

                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>

                <div className="mt-3">
                  <label htmlFor="no_of_freelancer" className="form-label">How many freelancers required</label>
                  <input
                    type="text" className="form-control" id='no_of_freelancer'
                    {...register("no_of_freelancer")}
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
        {listData?.data?.map((project: any) => {
          const budget =
            project.budget_type === 1
              ? `${project.estimated_hour || "N/A"} hours`
              : project.estimated_budget
                ? `$${project.estimated_budget}`
                : "N/A";

          return (
            <div
              key={project._id}
              onClick={() => navigate(`/projects/view/${project._id}`)}
              className="
                group relative border border-red-500/30 
                rounded-2xl p-5 
                bg-white dark:bg-gray-800/80 
                backdrop-blur-sm
                shadow-sm hover:shadow-xl 
                hover:border-red-500 
                transition-all duration-300 ease-out 
                hover:-translate-y-1
                hover:border-t-4
                cursor-pointer
              "
            >

              {/* Title */}
              <div className="flex justify-between">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-red-500 transition-colors">
                  {project.title}
                </h3>
                {(user?.role == 1 || project.created_by == user?.id) &&
                  <div className="flex">
                    {/* ✨ Stop event bubbling here */}
                    <a
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/edit/${project._id}`);
                      }}
                      className="me-2 cursor-pointer text-blue-400 hover:text-blue-500"
                    >
                      <Edit className="w-4 h-4" />
                    </a>

                    <a
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteListItem(project._id);
                      }}
                      className="cursor-pointer text-red-400 hover:text-red-500"
                      id="deleteitem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </a>
                  </div>
                }
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
                {project.description || "No description provided."}
              </p>

              <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                <span className="px-2 py-1 rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300">
                  {getProjectCategory(project.category)}
                </span>
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700/50">
                  Exp: {getProjectExperience(project.experience)}
                </span>
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700/50">
                  Freelancers: {project.no_of_freelancer}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span>
                  <strong className="text-gray-700 dark:text-gray-300">Skills:</strong>{" "}
                  {getProjectSkill(project.skills)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
                <span>
                  <strong className="text-gray-700 dark:text-gray-300">Budget:</strong>{" "}
                  {budget}
                </span>
                <span>
                  <strong className="text-gray-700 dark:text-gray-300">Deadline:</strong>{" "}
                  {new Date(project.deadline).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
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