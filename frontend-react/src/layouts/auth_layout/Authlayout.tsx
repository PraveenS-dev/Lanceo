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
        <div className="flex min-h-screen min-w-full bg-gray-100 dark:bg-gray-800">
            {/* Left: Form */}
            <div className={`flex ${pageUrl === "register" ? "flex-1/6" : "flex-1"} justify-center items-center p-8`}>
                <div
                    className={`w-full ${pageUrl === "register" ? "max-w-xl" : "max-w-md"} bg-white dark:bg-gray-700 p-10 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700`}
                >
                    <div className="absolute top-4 right-4">
                        <ThemeToggle />
                    </div>
                    {children}
                </div>

            </div>

            {/* Right: Info Panel */}
            <div className="hidden sm:flex flex-1 flex-col justify-center items-center bg-gradient-to-tr from-red-600 to-red-200 dark:from-red-700 dark:to-gray-500 p-12 rounded-l-3xl text-white shadow-lg">
                {pageUrl === "login" && (
                    <div className="text-center max-w-sm">
                        <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">New Here?</h2>
                        <p className="mb-8 text-white/90">
                            Sign up and discover amazing opportunities waiting for you!
                        </p>
                        <button
                            onClick={() => navigate("/register")}
                            className="bg-white text-red-600 font-bold py-3 px-8 rounded-full shadow hover:scale-105 hover:bg-gray-100 transition transform"
                        >
                            Sign Up
                        </button>
                    </div>
                )}
                {pageUrl === "register" && (
                    <div className="text-center max-w-sm">
                        <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">Already have an account?</h2>
                        <p className="mb-8 text-white/90">
                            Sign In and access your account instantly!
                        </p>
                        <button
                            onClick={() => navigate("/login")}
                            className="bg-white text-red-600 font-bold py-3 px-8 rounded-full shadow hover:scale-105 hover:bg-gray-100 transition transform"
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
