import { useState, useEffect } from "react";
import { apiClient } from "../services/Auth";
import { socket } from "./socket";

export const useNotification = (userId: string | undefined) => {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (!userId) return;

        const handleConnect = () => {
            socket.emit("join", userId);
        };

        const handleReconnect = (attempt: number) => {
            console.log("🔁 Socket reconnected (attempt):", attempt, "id:", socket.id);
            if (userId) {
                socket.emit("join", userId);
                console.log("📤 Re-join emitted for user after reconnect:", userId);
            }
        };

        const handleError = (err: any) => {
            console.error("Socket error:", err);
        };

        if (socket.connected) {
            handleConnect();
        }
        socket.on("connect", handleConnect);
        socket.on("reconnect", handleReconnect as any);
        socket.on("error", handleError);
        socket.on("connect_error", handleError);

        // 🔹 Fetch existing notifications
        const fetchNotifications = async () => {
            try {
                const res = await apiClient.get("/notifications/getdata", {
                    params: { user_id: userId },
                });
                setNotifications(res.data.notifications || []);
            } catch (err) {
                console.error("Error fetching notifications:", err);
            }
        };
        fetchNotifications();

        // 🔹 Listen for real-time updates
        socket.on(`notification_${userId}`, (notif) => {
            setNotifications((prev) => [notif, ...prev]);
        });

        // 🧹 Cleanup
        return () => {
            socket.off("connect", handleConnect);
            socket.off("reconnect", handleReconnect as any);
            socket.off("error", handleError);
            socket.off("connect_error", handleError);
            socket.off(`notification_${userId}`);
        };
    }, [userId]);

    return { notifications, setNotifications };
};
