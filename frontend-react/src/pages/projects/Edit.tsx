import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { getProjectData, ProjNameExistUnique, Update } from '../../services/Project';
import { ShowToast } from '../../utils/showToast';
import { useNavigate, useParams } from 'react-router-dom';
import Back_btn from '../../components/Buttons/Back_btn';
import BrudCrumbs from '../../components/BrudCrumbs';
import categories from "../../data/categories.json";
import experience from "../../data/experience.json";
import skills from "../../data/skills.json";
import DarkModeSelect from '../../components/DarkModeSelect';
import { motion } from "framer-motion";
import { useEffect, useState } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { String_to_Array } from '../../services/Helpers';
import PageReset_btn from '../../components/Buttons/PageReset_btn';
import Update_btn from '../../components/Buttons/Update_btn';

type FormInputs = {
  id: string,
  title: string,
  description: string,
  category: number,
  skills: string[],
  attachment: File,
  experience: number,
  budget_type: string,
  estimated_budget: string | null,
  estimated_hour: string | null,
  deadline: Date,
  no_of_freelancer: string,
  milestone: string,
  spl_instruction: string,
  created_by: string,
}

type UploadFile = {
  file: File;
  preview: string | null; // image preview or null
  isNew: boolean,
};

const Edit = () => {
  const { id } = useParams<({ id: string })>();
  const { control, watch, register, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInputs>({ mode: "onChange" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const budgetType = Number(watch("budget_type"));
  const [files, setFiles] = useState<
    {
      id?: string;
      file?: File;
      preview: string;
      isNew?: boolean;
      isRemoved?: boolean;
      file_name: string;
      extention: string;
      file_path: string;
    }[]
  >([]);

  const [editData, setEditData] = useState<any>(null);

  const crumbs = [
    { label: "Home", path: "/dashboard" },
    { label: "Projects", path: "/projects/list" },
    { label: "Edit" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const res = await getProjectData(id);
      setEditData(res);

      // populate form with fetched data
      reset({
        id: res?.id ?? "",
        title: res?.title ?? "",
        description: res?.description ?? "",
        category: res?.category ?? "",
        skills: res?.skills ? String_to_Array(res.skills) : [],
        experience: res?.experience ?? "",
        budget_type: String(res?.budget_type ?? ""),
        estimated_budget: res?.estimated_budget ?? "",
        estimated_hour: res?.estimated_hour ?? "",
        deadline: res?.deadline ? new Date(res.deadline) : undefined,
        no_of_freelancer: res?.no_of_freelancer ?? "",
        milestone: res?.milestone ?? "",
        spl_instruction: res?.spl_instruction ?? "",
        created_by: res?.created_by ?? "",
      });
    };

    fetchData();

  }, [id]);

  useEffect(() => {
    if (editData?.attachmentDetails) {
      const existing = editData.attachmentDetails.map((a: any) => ({
        id: a._id,
        preview: `${import.meta.env.VITE_NODE_BASE_URL}${a.file_path}`,
        isNew: false,
        isRemoved: false,
        extention: a.extention,
        file_name: a.file_name,
        file_path: a.file_path,
      }));
      setFiles(existing);

    }
  }, [editData]);

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

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles: UploadFile[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      if (files.filter(f => !f.isRemoved).length + newFiles.length >= 3) break; // max 3 files

      const ext = file.name.split(".").pop()?.toLowerCase();
      const allowed = ["pdf", "xls", "xlsx", "jpg", "jpeg", "heif", "heic", "png"];
      if (!ext || !allowed.includes(ext)) continue;

      const isImage = ["jpg", "jpeg", "heif", "heic", "png"].includes(ext);

      newFiles.push({
        file,
        preview: isImage ? URL.createObjectURL(file) : null,
        isNew: true,
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = ""; // reset input
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const updated = [...prev];
      updated[index].isRemoved = true;
      return updated;
    });
  };


  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {

      const formData = new FormData();


      Object.entries(data).forEach(([key, value]) => {
        if (key === "skills" && Array.isArray(value)) {
          formData.append(key, value.join(","));
        } else if (Array.isArray(value)) {
          value.forEach((v) => formData.append(`${key}[]`, String(v)));
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      files.forEach((f) => {
        if (f.isNew && !f.isRemoved && f.file) {
          formData.append("attachments", f.file);
        }
      });

      files.forEach(f => {
        if (!f.isNew && !f.isRemoved && f.id) {
          formData.append("existing_attachments[]", f.id);
        }
      });


      formData.append("project_id", String(editData?._id));
      formData.append("updated_by", String(user?.id));


      const res = await Update(formData);

      ShowToast("Project Updated successfully!", "success")
      navigate("/projects/list");
      reset();
    } catch (err: any) {
      ShowToast(err.response?.data?.message || "Something went wrong", "error")

    }
  }

  return (
    <div className=''>
      <BrudCrumbs crumbs={crumbs} />

      <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
        <h3 className='text-2xl font-bold'>Edit Project</h3>
        <Back_btn url={"/projects/list"} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='px-3'>
        <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
          <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Project Details</h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="title" className="form-label">Title</label>
            <input
              type="text" className="form-control" id='title'
              {...register("title", {
                required: "Title is required",
                validate: async (value) => await ProjNameExistUnique(value, user?.id, id),
              })}
            />

            {errors.title && (<span className="text-red-500 mt-1 text-sm"> {errors.title.message}</span>)}
          </div>

        </div>
        <div className='grid grid-cols-1 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="description" className='form-label'>Description</label>
            <textarea id="description" className='form-control' rows={8}
              {...register("description",
                {
                  required: "Description is required!",
                  minLength: {
                    value: 2,
                    message: "Description must be minimum 2 characters length!"
                  }
                })}></textarea>

            {errors.description && (<span className="text-red-500 mt-1 text-sm"> {errors.description.message}</span>)}

          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="category" className="form-label">Category</label>
            <Controller
              name="category"
              control={control}
              rules={{ required: "Category is required!" }}
              defaultValue={editData?.category || ""} // <-- use defaultValue
              render={({ field }) => (
                <DarkModeSelect
                  {...field}
                  options={Category_options}
                  placeholder="Select category..."
                />
              )}
            />
            {errors.category && (
              <span className="text-red-500 mt-1 text-sm">{errors.category.message}</span>
            )}
          </div>

          <div className="mt-3">
            <label htmlFor="skills" className="form-label">Skills</label>
            <Controller
              name="skills"
              control={control}
              rules={{ required: "Skills is required!" }}
              defaultValue={editData?.skills ? String_to_Array(editData.skills) : []}
              render={({ field }) => (
                <DarkModeSelect
                  {...field}
                  options={skills_options}
                  isMulti
                  placeholder="Select skills..."
                />
              )}
            />
            {errors.skills && (
              <span className="text-red-500 mt-1 text-sm">{errors.skills.message}</span>
            )}
          </div>

          <div className="mt-3">
            <label htmlFor="experience" className="form-label">Experience</label>
            <Controller
              name="experience"
              control={control}
              rules={{ required: "Experience is required!" }}
              defaultValue={editData?.experience || ""}
              render={({ field }) => (
                <DarkModeSelect
                  {...field}
                  options={experience_options}
                  placeholder="Select experience..."
                />
              )}
            />
            {errors.experience && (
              <span className="text-red-500 mt-1 text-sm">{errors.experience.message}</span>
            )}
          </div>

        </div>

        <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
          <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Budget & Time</h3>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="" className='form-label'>Budget Type</label>
            <div className="flex mt-3">

              <input type="radio" id='hourly_pay' value="1" className='form-check-input me-1'
                {...register("budget_type", { required: "Budget Type is required!" })} />
              <label htmlFor="hourly_pay" className="form-label">Hourly Pay</label>

              <input type="radio" id='fixed_pay' value="2" className='form-check-input ms-3 me-1'
                {...register("budget_type", { required: "Budget Type is required!" })} />
              <label htmlFor="fixed_pay" className="form-label">Fixed Pay</label>
            </div>
            {errors.budget_type && (<span className="text-red-500 mt-1 text-sm"> {errors.budget_type.message}</span>)}
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
                {...register("estimated_hour", {
                  required: budgetType === 1 ? "Estimated hour is required" : false,
                })} />

              {errors.estimated_hour && (<span className="text-red-500 mt-1 text-sm"> {errors.estimated_hour.message}</span>)}
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
                {...register("estimated_budget", {
                  required: budgetType === 2 ? "Estimated budget is required" : false,
                })} />

              {errors.estimated_budget && (<span className="text-red-500 mt-1 text-sm"> {errors.estimated_budget.message}</span>)}
            </motion.div>
          )}

          <div className="mt-3">
            <label htmlFor="deadline" className="form-label">Deadline</label>

            <Controller
              control={control}
              name="deadline"
              rules={{ required: "Deadline is required" }}
              render={({ field }) => (
                <Flatpickr
                  {...field}
                  id="deadline"
                  className="form-control"
                  options={{
                    dateFormat: "d-m-Y",
                    allowInput: true,
                    minDate: Date.now()
                  }}
                />
              )}
            />

            {errors.deadline && (
              <span className="text-red-500 mt-1 text-sm">
                {errors.deadline.message}
              </span>
            )}
          </div>
        </div>

        <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
          <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Team Requirements</h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="no_of_freelancer" className="form-label">How many freelancers required</label>
            <input
              type="text" className="form-control" id='no_of_freelancer'
              {...register("no_of_freelancer", {
                required: "no_of_freelancer is required",
              })}
            />

            {errors.no_of_freelancer && (<span className="text-red-500 mt-1 text-sm"> {errors.no_of_freelancer.message}</span>)}
          </div>
        </div>

        <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
          <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Attachments</h3>
        </div>

        <div className="mt-3">
          <label className="form-label">
            Attachments <small className="text-red-400">(optional)</small>
          </label>

          <div className="flex flex-wrap gap-4 mt-5">
            {files
              .filter(f => !f.isRemoved)
              .map((f, i) => {
                const ext =
                  f.extention?.toLowerCase() ||
                  f.file?.name.split(".").pop()?.toLowerCase() ||
                  "";

                const isImage = ["jpg", "jpeg", "png", "heif", "heic"].includes(ext);
                const fileName = f.file_name || f.file?.name;
                const fileUrl = f.file_path
                  ? `${import.meta.env.VITE_NODE_BASE_URL}${f.file_path}`
                  : f.preview || "";

                return (
                  <div
                    key={i}
                    className="relative border rounded p-2 flex flex-col items-center justify-center w-32 h-32 bg-white dark:bg-gray-800 shadow-sm"
                  >
                    {/* ❌ Remove Button */}
                    <button
                      type="button"
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-sm hover:bg-red-600"
                      onClick={() => removeFile(i)}
                    >
                      ×
                    </button>

                    {/* 📸 Image Preview */}
                    {isImage ? (
                      <img
                        src={fileUrl}
                        alt={fileName}
                        className="w-28 h-28 object-cover rounded cursor-pointer"
                        onClick={() => window.open(fileUrl, "_blank")}
                        title="Click to view full image"
                      />
                    ) : (
                      // 📄 Non-image file
                      <a
                        href={fileUrl}
                        download={fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 dark:text-blue-300 text-center underline hover:text-blue-600 break-all px-2"
                      >
                        {fileName}
                      </a>
                    )}

                    {/* Hidden field to send attachment ID to backend */}
                    {!f.isNew && f.id && (
                      <input type="hidden" name="existing_attachments[]" value={f.id} />
                    )}
                  </div>
                );
              })}

            {/* ➕ Add New Upload Box */}
            {files.filter(f => !f.isRemoved).length < 3 && (
              <label className="border border-dashed rounded w-32 h-32 flex items-center justify-center cursor-pointer hover:border-gray-400 relative bg-gray-50 dark:bg-gray-700">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.xls,.xlsx,.jpg,.jpeg,.heif,.heic,.png"
                  onChange={handleFilesChange}
                  multiple
                />
                <div className="flex flex-col items-center justify-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300">
                    <AiOutlinePlus size={18} />
                  </div>
                  <span className="text-gray-400 text-sm mt-1 text-center">Upload</span>
                </div>
              </label>
            )}
          </div>


        </div>

        <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
          <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Optional Details</h3>
        </div>

        <div className='grid grid-cols-1 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="milestone" className='form-label'>Milestone <small className="text-red-400">(optional)</small></label>
            <textarea id="milestone" className='form-control' rows={8}
              {...register("milestone",
                {
                  minLength: {
                    value: 2,
                    message: "Milestone must be minimum 2 characters length!"
                  }
                })}></textarea>

            {errors.milestone && (<span className="text-red-500 mt-1 text-sm"> {errors.milestone.message}</span>)}

          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="spl_instruction" className='form-label'>Special Instruction <small className="text-red-400">(optional)</small></label>
            <textarea id="spl_instruction" className='form-control' rows={8}
              {...register("spl_instruction",
                {
                  minLength: {
                    value: 2,
                    message: "Special Instruction must be minimum 2 characters length!"
                  }
                })}></textarea>

            {errors.spl_instruction && (<span className="text-red-500 mt-1 text-sm"> {errors.spl_instruction.message}</span>)}

          </div>
        </div>

        <div className='flex justify-end mt-5'>
          <PageReset_btn />
          <Update_btn isSubmitting={isSubmitting} />
        </div>
      </form>

    </div>
  )
}

export default Edit