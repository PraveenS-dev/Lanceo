import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { ShowToast } from "../../utils/showToast";
import { UserLogin, type LoginData } from "../../services/Auth";
import { useAuth } from "../../contexts/AuthContext";

type LoginFormInputs = {
  email: string;
  password: string;
};

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
    mode: "onChange",
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data: LoginData) => {
    try {
      const res = await UserLogin(data);


      // Use the login function from AuthContext
      login(res.user, res.token);

      ShowToast("Logged in successfully!", "success");
      navigate("/dashboard");
      reset();
    } catch (err: any) {
      // Axios error response
      ShowToast(err.response?.data?.message || "Something went wrong", "error");
    }
  };


  return (
    <div>
      {/* <div className="flex justify-center mb-3">
        <div className="overflow-hidden rounded-full w-12 text-center ">
          <img
            src="../../../public/logo.png"
            alt=""
            className="w-15 rounded-full overflow-hidden scale-150 transition-transform duration-300"
          />
        </div>
      </div> */}
      <h1 className="text-3xl font-extrabold text-center mb-8 text-gray-800 dark:text-white">
        Login to Your Account
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="text"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email",
              },
            })}
            placeholder="you@example.com"
            className={`p-3 rounded-2xl border focus:ring-2 focus:outline-none transition
        ${errors.email
                ? "border-red-500 focus:ring-red-400"
                : "border-gray-300 dark:border-gray-600 focus:ring-blue-400 dark:focus:ring-blue-500"
              } text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700`}
          />
          {errors.email && (
            <span className="text-red-500 mt-1 text-sm">{errors.email.message}</span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col flex-1">
          <label className="mb-2 font-medium text-gray-700 dark:text-gray-300">Password</label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
              placeholder="Enter your password"
              className={`w-full p-3 pr-10 rounded-2xl border focus:ring-2 focus:outline-none transition
          ${errors.password
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-400 dark:focus:ring-blue-500"
                } text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700`}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-red-500 dark:text-red-400"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
            </span>
          </div>

          {errors.password && (
            <span className="text-red-500 mt-1 text-sm">{errors.password.message}</span>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white p-3 rounded-xl font-bold shadow-lg hover:scale-105 transform transition disabled:opacity-50 cursor-pointer"
        >
          Login
        </button>
      </form>

      <p className="mt-6 text-center text-gray-500 dark:text-gray-400 md:hidden sm:block">
        New Here? <span className="text-blue-500 hover:underline cursor-pointer" onClick={() => navigate("/register")}>Sign up</span> and discover amazing opportunities waiting for you.
      </p>

    </div>
  );
};

export default Login;
