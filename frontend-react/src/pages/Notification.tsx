import { useState, useEffect, useRef } from "react";
import { useNotification } from "../utils/useNotification";
import { FaBell } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { apiClient } from "../services/Auth";
import { useNavigate } from "react-router-dom";
import '../assets/custom-scrollbar.css';

const Notification = () => {
    const { user } = useAuth();
    const userId = user?.id;
    const { notifications, setNotifications } = useNotification(userId);
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notifId: string, url: string | undefined) => {
        if (!userId) return;

        await apiClient.post("/notifications/notificationLog/store", {
            notification_id: notifId,
            userId
        });

        setNotifications(prev =>
            prev.map(n => n._id === notifId ? { ...n, isRead: true } : n)
        );

        if (url) {
            navigate(url);
            setOpen(false);
        }
    };

    const MarkAllAsRead = async () => {
        if (!userId) return;

        await apiClient.post("/notifications/markAllRead", { userId });

        // Instantly update UI
        setNotifications(prev =>
            prev.map(n => ({
                ...n,
                isRead: true
            }))
        );
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                className="relative p-2 rounded-full hover:bg-red-700/60 dark:hover:bg-red-900/60 transition cursor-pointer"
                onClick={() => setOpen(!open)}
            >
                <FaBell size={24} className="text-white dark:text-red-50" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-red-600 dark:bg-red-50 dark:text-red-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-sm border border-red-500 dark:border-red-700">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {open && (
                <div
                    className="
                        absolute mt-2 w-80 max-w-[90vw] 
                        bg-white dark:bg-gray-800
                        border border-red-200 dark:border-red-800
                        rounded-2xl shadow-lg overflow-hidden z-50 animate-fadeIn custom-scrollbar
                        left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0
                        sm:w-80 sm:max-w-none
                    "
                >
                    <div className="flex justify-between bg-red-600 dark:bg-red-700 text-white">
                        <h4 className="p-3 font-semibold">Notifications</h4>

                        <button
                            className="px-3 py-1.5 m-2 text-xs font-medium rounded-full
                            bg-white/20 hover:bg-white/30 
                            backdrop-blur-md transition-all duration-300
                            hover:shadow-[0_0_10px_rgba(255,255,255,0.4)]
                            active:scale-95 cursor-pointer"
                        onClick={() => MarkAllAsRead()} >
                            Mark all as read
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="p-4 text-center text-gray-500 dark:text-gray-400">
                                No notifications yet
                            </p>
                        ) : (
                            notifications.map((notif, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleNotificationClick(notif._id, notif.url)}
                                    className={`
                                        p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition
                                        ${notif.isRead
                                            ? "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            : "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50"
                                        }
                                    `}
                                >
                                    <p className="font-semibold text-red-700 dark:text-red-400 text-sm">
                                        {notif.title}
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300 text-xs mt-1 line-clamp-2">
                                        {notif.subject}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notification;
