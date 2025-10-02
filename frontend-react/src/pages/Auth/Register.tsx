import axios from "axios";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { ShowToast } from "../../utils/showToast";

type RegisterFormInputs = {
  name: string;
  username: string;
  email: string;
  role: "2" | "3"; // "2" = freelancer, "3" = client
  password: string;
  confirmPassword: string;
};

const ROLE = {
  FREELANCER: "2",
  CLIENT: "3",
};

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RegisterFormInputs>({
    mode: "onChange",
    defaultValues: { role: ROLE.FREELANCER },
  });

  const selectedRole = watch("role");

  const password = watch("password");

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    try {
      console.log(data);
      
      const res = await axios.post(`${import.meta.env.VITE_NODE_BASE_URL}/register`, {
        name: data.name,
        username: data.username,
        email: data.email,
        role: Number(ROLE[data.role as keyof typeof ROLE]),
        password: data.password,
      });

      ShowToast("Registered successfully!", "success")

      navigate("/dashboard");
      reset();
    } catch (err: any) {
      ShowToast(err.response?.data?.message || "Something went wrong", "error")

    }
  };


  return (
    <div className="">
      <h1 className="text-3xl font-extrabold text-center mb-6 text-gray-800 dark:text-white">
        Create your account
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Full name + Username in same row */}
        <div className="flex gap-5">
          {/* Name */}
          <div className="flex flex-col flex-1">
            <label className="mb-2 font-medium text-gray-700 dark:text-gray-300">Full name</label>
            <input
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "Too short" },
              })}
              placeholder="Name"
              className={`p-3 rounded-2xl border focus:ring-2 focus:outline-none transition 
          ${errors.name
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-400 dark:focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                }`}
            />
            {errors.name && <span className="text-red-500 mt-1 text-sm">{errors.name.message}</span>}
          </div>

          {/* Username */}
          <div className="flex flex-col flex-1">
            <label className="mb-2 font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input
              {...register("username", {
                required: "Username is required",
                minLength: { value: 3, message: "Minimum 3 characters" },
                pattern: { value: /^[a-zA-Z0-9._-]{3,30}$/, message: "Invalid username" },
                validate: async (value) => {
                  try {
                    const res = await axios.post(`${import.meta.env.VITE_NODE_BASE_URL}/uniqueUserName`, { username: value });
                    return !res.data.data || "Username already in use";
                  } catch {
                    return "Unable to validate username";
                  }
                },
              })}
              placeholder="Username"
              className={`p-3 rounded-2xl border focus:ring-2 focus:outline-none transition
          ${errors.username
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-400 dark:focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                }`}
            />
            {errors.username && <span className="text-red-500 mt-1 text-sm">{errors.username.message}</span>}
            {/* <small className="text-gray-500 dark:text-gray-400 mt-1">Only letters, numbers, dot, underscore & hyphen allowed.</small> */}
          </div>
        </div>

        {/* Email (full row) */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
              validate: async (value) => {
                try {
                  const res = await axios.post(`${import.meta.env.VITE_NODE_BASE_URL}/uniqueEmail`, { email: value });
                  return !res.data.data || "Email already in use";
                } catch {
                  return "Unable to validate email";
                }
              },
            })}
            placeholder="you@example.com"
            className={`p-3 rounded-2xl border focus:ring-2 focus:outline-none transition
        ${errors.email
                ? "border-red-500 focus:ring-red-400"
                : "border-gray-300 dark:border-gray-600 focus:ring-blue-400 dark:focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
              }`}
          />
          {errors.email && <span className="text-red-500 mt-1 text-sm">{errors.email.message}</span>}
        </div>

        {/* Role selector */}
        <label className="font-medium text-gray-700 dark:text-gray-300 ">I am a</label>

        <div className="flex gap-3 mb-3 mt-3">

          {["FREELANCER", "CLIENT"].map((role) => (
            <label
              key={role}
              className={`flex-1 cursor-pointer p-3 rounded-2xl border text-center select-none transition 
          ${selectedRole === role
                  ? "border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/30"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                }`}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <input type="radio" value={role} {...register("role", { required: true })} className="sr-only" />
              <div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{role === "FREELANCER" ? "Freelancer" : "Client"}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {role === "FREELANCER" ? "Find projects & apply" : "Post jobs & hire talent"}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Password + Confirm Password */}
        <div className="flex gap-5">
          {["password", "confirmPassword"].map((field, idx) => (
            <div className="flex flex-col relative flex-1" key={field}>
              <label className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                {field === "password" ? "Password" : "Confirm password"}
              </label>
              <div className="relative">
                <input
                  type={field === "password" ? (showPassword ? "text" : "password") : (showConfirm ? "text" : "password")}
                  {...register(field, {
                    required: field === "password" ? "Password is required" : "Please confirm password",
                    minLength: field === "password" ? { value: 6, message: "Password must be at least 6 characters" } : undefined,
                    validate: field === "confirmPassword" ? (val) => val === password || "Passwords do not match" : undefined,
                  })}
                  placeholder={field === "password" ? "Create a password" : "Repeat password"}
                  className={`w-full p-3 pr-10 rounded-2xl border focus:ring-2 focus:outline-none transition
              ${errors[field]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-400 dark:focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    }`}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-red-500 dark:text-red-400"
                  onClick={() => field === "password" ? setShowPassword((s) => !s) : setShowConfirm((s) => !s)}
                >
                  {field === "password" ? (showPassword ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />)
                    : (showConfirm ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />)}
                </span>
              </div>
              {errors[field] && <span className="text-red-500 mt-1 text-sm">{errors[field]?.message}</span>}
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white p-3 rounded-xl font-bold shadow-lg hover:scale-105 transform transition disabled:opacity-50"
        >
          Sign Up
        </button>
      </form>

      <p className="mt-6 text-center text-gray-500 dark:text-gray-400 md:hidden sm:block">
        Already have an account? <span className="text-blue-500 hover:underline cursor-pointer" onClick={() => navigate("/login")}>Sign In</span> and access your account instantly.
      </p>
    </div>
  );

};

export default Register;
