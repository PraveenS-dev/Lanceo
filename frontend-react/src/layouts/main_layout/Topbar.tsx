import React from "react";
import ThemeToggle from "../ThemeToggle";
import { FaUser, FaBars } from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "../../services/Helpers";

type TopbarProps = {
    toggleLeftMenu: () => void;
};

const Topbar: React.FC<TopbarProps> = ({ toggleLeftMenu }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    }

    return (
        <div className="bg-red-600 dark:bg-red-800 h-16 flex items-center justify-between px-4 shadow-md">
            <div className="flex items-center gap-2">

                <FaUser size={32} className="text-black dark:text-white" />
                <h1 className="text-black dark:text-white font-bold text-lg hidden sm:block">
                    Logo
                </h1>
                <button onClick={toggleLeftMenu} className="sm:hidden text-black dark:text-white text-2xl mr-2">
                    <FaBars />
                </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {user && (
                    <div className="hidden md:flex items-center gap-2 text-black dark:text-white">
                        <span className="text-sm">Welcome, {user.name}</span>
                        <span className="text-xs opacity-75">({getUserRole(user.role)})</span>
                    </div>
                )}
                <ThemeToggle />
                <button
                    onClick={handleLogout}
                    className="text-black dark:text-white hover:underline cursor-pointer text-2xl font-bold"
                >
                    <IoIosLogOut />
                </button>
            </div>
        </div>
    );
};

export default Topbar;
