import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import "flatpickr/dist/flatpickr.min.css";
import { ShowToast } from '../../../utils/showToast';
import { getAllParents, MenuNameUnique, Store } from '../../../services/LeftMenu';
import BrudCrumbs from '../../../components/BrudCrumbs';
import DarkModeSelect from '../../../components/DarkModeSelect';
import Submit_btn from '../../../components/Buttons/Submit_btn';
import { useAuth } from '../../../contexts/AuthContext';
import Back_btn from '../../../components/Buttons/Back_btn';
import { useEffect, useState } from 'react';

type FormInputs = {
  name: string,
  link: string,
  role: string,
  icon: string | null,
  isParent: number,
  parentId: string,
  sort_order: number,
  created_by: string,
}

const LeftMenuAdd = () => {
  const { control, register, watch, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInputs>({ mode: "onChange" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const isParent = Number(watch("isParent"));
  const [parent_options, setParent_options] = useState<any>([]);

  const crumbs = [
    { label: "Home", path: "/dashboard" },
    { label: "LeftMenu", path: "/leftmenu/list" },
    { label: "Add" },
  ];

  const role_options = [
    { value: "1", label: "Admin" },
    { value: "2", label: "Freelancer" },
    { value: "3", label: "Client" },
  ];

  useEffect(() => {
    const getParent = async () => {
      const res = await getAllParents();
      setParent_options(res);
    }
    getParent();
  }, []);

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {

      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key === "role" && Array.isArray(value)) {
          formData.append(key, value.join(","));
        } else if (Array.isArray(value)) {
          value.forEach((v) => formData.append(`${key}[]`, String(v)));
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      formData.append("created_by", String(user?.id));

      const res = await Store(formData);

      ShowToast("LeftMenu added successfully!", "success")
      navigate("/leftmenu/list");
      reset();
    } catch (err: any) {
      ShowToast(err.response?.data?.message || "Something went wrong", "error")

    }
  }

  return (
    <div className=''>
      <BrudCrumbs crumbs={crumbs} />

      <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
        <h3 className='text-2xl font-bold'>Create Menu</h3>
        <Back_btn url={"/leftmenu/list"} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='px-3'>
        <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
          <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Menu Details</h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text" className="form-control" id='name'
              {...register("name", {
                required: "name is required",
                validate: async (value) => await MenuNameUnique(value),
              })}
            />

            {errors.name && (<span className="text-red-500 mt-1 text-sm"> {errors.name.message}</span>)}
          </div>

          <div className="mt-3">
            <label htmlFor="link" className="form-label">Link</label>
            <input
              type="text" className="form-control" id='link'
              {...register("link", {
                required: isParent == 2 ? "link is required" : false
              })}
            />

            {errors.link && (<span className="text-red-500 mt-1 text-sm"> {errors.link.message}</span>)}
          </div>

          <div className="mt-3">
            <label htmlFor="role" className="form-label">Role Permission</label>
            <Controller
              name="role"
              control={control}
              rules={{ required: "role is required!" }}
              render={({ field }) => (
                <DarkModeSelect
                  {...field}                // pass field directly
                  options={role_options}
                  isMulti
                  placeholder="Select role..."
                />
              )}
            />
            {errors.role && (<span className="text-red-500 mt-1 text-sm"> {errors.role.message}</span>)}
          </div>

          <div className="mt-3">
            <label htmlFor="icon" className="form-label">Icon Name</label>
            <input
              type="text" className="form-control" id='icon'
              {...register("icon")}
            />

            {errors.icon && (<span className="text-red-500 mt-1 text-sm"> {errors.icon.message}</span>)}
          </div>

          <div className="mt-3">
            <label htmlFor="" className='form-label'>isParent</label>
            <div className="flex mt-3">

              <input type="radio" id='yes' value="1" className='form-check-input me-1'
                {...register("isParent", { required: "This field is required!" })} />
              <label htmlFor="yes" className="form-label">Yes</label>

              <input type="radio" id='no' value="0" className='form-check-input ms-3 me-1'
                {...register("isParent", { required: "This field is required!" })} />
              <label htmlFor="no" className="form-label">No</label>
            </div>
            {errors.isParent && (<span className="text-red-500 mt-1 text-sm"> {errors.isParent.message}</span>)}
          </div>

          <div className="mt-3">
            <label htmlFor="parentId" className="form-label">Parent</label>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <DarkModeSelect
                  {...field}
                  options={parent_options}
                  placeholder="Select parent..."
                />
              )}
            />
            {errors.parentId && (<span className="text-red-500 mt-1 text-sm"> {errors.parentId.message}</span>)}
          </div>

          <div className="mt-3">
            <label htmlFor="sort_order" className="form-label">Sort Order</label>
            <input
              type="text" className="form-control" id='sort_order'
              {...register("sort_order", {
                required: "Sort Order is required",
              })}
            />

            {errors.sort_order && (<span className="text-red-500 mt-1 text-sm"> {errors.sort_order.message}</span>)}
          </div>
        </div>

        <div className='flex justify-end mt-5'>
          <Submit_btn isSubmitting={isSubmitting} />
        </div>
      </form>

    </div>
  )
}

export default LeftMenuAdd