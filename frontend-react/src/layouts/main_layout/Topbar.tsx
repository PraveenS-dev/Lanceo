import React, { useEffect, useRef, useState } from "react";
import ThemeToggle from "../ThemeToggle";
import { FaUser, FaBars } from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "../../services/Helpers";
import Notification from "../../pages/Notification";
import ChatDropdown from "../../components/ChatDropdown/ChatDropdown";
import { fetchUserById } from "../../services/Auth";

const defaultProfile =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

type TopbarProps = {
    toggleLeftMenu: () => void;
};

const Topbar: React.FC<TopbarProps> = ({ toggleLeftMenu }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [topbardata, setTopbardata] = useState<any>(null);
    const [avatarMenu, setAvatarMenu] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const user_id = user?.id;

    const fetchData = async () => {
        if (!user_id) return;
        const res = await fetchUserById(user_id);
        setTopbardata(res.userDetails);
    };

    useEffect(() => {
        fetchData();
    }, [user_id]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!avatarMenu) return;
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setAvatarMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [avatarMenu]);

    return (
        <div className="bg-red-600 dark:bg-red-800 h-16 flex items-center justify-between px-4 shadow-md">

            <div className="flex items-center gap-2">
                <button onClick={toggleLeftMenu} className="sm:hidden text-black dark:text-white text-2xl mr-2">
                    <FaBars />
                </button>
                <div className="overflow-hidden rounded-full w-10">
                    <img
                        src="../../../public/logo.png"
                        alt=""
                        className="w-15 rounded-full overflow-hidden scale-150 transition-transform duration-300"
                    />
                </div>

                <h1 className="text-black dark:text-white font-bold text-2xl hidden sm:block">
                    {import.meta.env.VITE_APP_NAME}
                </h1>
                
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">

                {user && (
                    <div className="hidden md:flex items-center gap-2 text-black dark:text-white">
                        <span className="text-sm">Welcome, {user.name}</span>
                        <span className="text-xs opacity-75">({getUserRole(user.role)})</span>
                    </div>
                )}

                <ChatDropdown userId={user?.id} />
                <Notification />
                <ThemeToggle />

                <div className="relative">
                    <button
                        onClick={() => setAvatarMenu((prev) => !prev)}
                        className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/60 
                                   hover:scale-105 transition-all shadow-md"
                    >
                        <img
                            src={
                                topbardata?.profile_url
                                    ? `${import.meta.env.VITE_NODE_BASE_URL}${topbardata.profile_url}`
                                    : defaultProfile
                            }
                            className="w-full h-full object-cover"
                        />
                    </button>

                    {avatarMenu && (
                        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 shadow-xl 
                                        rounded-xl py-2 border border-gray-200 dark:border-gray-700 
                                        animate-fadeIn z-50" ref={containerRef}>

                            <button
                                onClick={() => { navigate("/profile"); setAvatarMenu(false) }}
                                className="w-full text-left px-4 py-2 flex items-center gap-2 
                                           hover:bg-gray-100 dark:hover:bg-gray-800 
                                           text-black dark:text-white transition"
                            >
                                <FaUser /> Profile
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 flex items-center gap-2 
                                           hover:bg-gray-100 dark:hover:bg-gray-800 
                                           text-red-600 dark:text-red-400 font-semibold transition"
                            >
                                <IoIosLogOut /> Logout
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Topbar;
