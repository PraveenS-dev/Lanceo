import React, { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

type AuthLayoutProps = {
    children: ReactNode;
    pageUrl: string;
    pageName: string;
};

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, pageUrl, pageName }) => {
    const navigate = useNavigate();
    useEffect(() => {
        document.title = `${import.meta.env.VITE_APP_NAME} | ${pageName || "Page"}`
    }, [pageName])

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-800">

            {/* Left: Form */}
            <div className="flex flex-1 justify-center items-center px-4 sm:px-6 lg:px-8 py-6">

                <div className={`w-full ${pageUrl === "register" ? "max-w-xl" : "max-w-md"} 
                    bg-white dark:bg-gray-700 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 relative`}>

                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-6">

                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="overflow-hidden rounded-full w-9 h-9">
                                <img
                                    src="/logo.png"
                                    alt="logo"
                                    className="w-full h-full object-cover scale-125"
                                />
                            </div>

                            <h1 className="font-extrabold text-xl sm:text-2xl tracking-wide 
                                    bg-gradient-to-r from-red-500 via-red-700 to-red-800 text-transparent bg-clip-text">
                                {import.meta.env.VITE_APP_NAME}
                            </h1>
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggle />
                    </div>

                    {/* Form Content */}
                    {children}
                </div>
            </div>

            {/* Right: Info Panel */}
            <div className="hidden lg:flex flex-1 flex-col justify-center items-center rounded-l-3xl bg-gradient-to-tr from-red-600 to-red-300 dark:from-red-700 dark:to-gray-600 
                p-12 text-white">

                {pageUrl === "login" && (
                    <div className="text-center max-w-sm">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4 drop-shadow-lg">
                            New Here?
                        </h2>
                        <p className="mb-8 text-white/90">
                            Sign up and discover amazing opportunities waiting for you!
                        </p>
                        <button
                            onClick={() => navigate("/register")}
                            className="bg-white text-red-600 font-bold py-3 px-8 rounded-full shadow 
                            hover:scale-105 hover:bg-gray-100 transition transform"
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                {pageUrl === "register" && (
                    <div className="text-center max-w-sm">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4 drop-shadow-lg">
                            Already have an account?
                        </h2>
                        <p className="mb-8 text-white/90">
                            Sign in and access your account instantly!
                        </p>
                        <button
                            onClick={() => navigate("/login")}
                            className="bg-white text-red-600 font-bold py-3 px-8 rounded-full shadow 
          hover:scale-105 hover:bg-gray-100 transition transform"
                        >
                            Sign In
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthLayout;
