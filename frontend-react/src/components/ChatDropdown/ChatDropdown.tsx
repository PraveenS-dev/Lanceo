import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { socket } from "../../utils/socket";
import ChatWindow from "./ChatWindow";

type ChatItem = {
    contactId: string;
    contactName: string;
    lastMessage?: string;
    unreadCount?: number;
    lastMessageTime?: string | Date;
};

export default function ChatDropdown({ userId }: { userId?: string }) {
    const [recentChats, setRecentChats] = useState<ChatItem[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // join socket rooms and listen for incoming messages; update list
    useEffect(() => {
        if (!userId) return;
        socket.emit("join", userId);

        const base = import.meta.env.VITE_NODE_BASE_URL || "";

        const onReceive = (msg: any) => {
            setRecentChats((prev) => {
                const existing = prev.find((c) => c.contactId === msg.senderId);
                if (existing) {
                    const updated = prev.map((c) =>
                        c.contactId === msg.senderId
                            ? {
                                ...c,
                                lastMessage: msg.message,
                                unreadCount: selectedChat?.contactId === msg.senderId ? 0 : (c.unreadCount || 0) + 1,
                                lastMessageTime: new Date(msg.createdAt),
                            }
                            : c
                    );
                    return updated.sort((a, b) => +new Date(b.lastMessageTime as any) - +new Date(a.lastMessageTime as any));
                }

                // If sender is not in the current list, fetch authoritative chatlist
                fetch(`${base}/chatlist/${userId}`)
                    .then((r) => r.json())
                    .then((data) => {
                        if (data?.success) setRecentChats(data.chats || []);
                    })
                    .catch(() => { });

                return prev;
            });
        };

        socket.on("receive_message", onReceive);
        socket.on("message_sent", (msg: any) => {
            // reflect messages sent by current user
            const contactId = msg.receiverId;
            setRecentChats((prev) => {
                const existing = prev.find((c) => c.contactId === contactId);
                if (existing) {
                    const updated = prev.map((c) =>
                        c.contactId === contactId ? { ...c, lastMessage: msg.message, lastMessageTime: new Date(msg.createdAt) } : c
                    );
                    return updated.sort((a, b) => +new Date(b.lastMessageTime as any) - +new Date(a.lastMessageTime as any));
                }

                // If no existing chat in local list, refresh the authoritative chatlist from server
                fetch(`${base}/chatlist/${userId}`)
                    .then((r) => r.json())
                    .then((data) => {
                        if (data?.success) setRecentChats(data.chats || []);
                    })
                    .catch(() => { });

                // don't insert a temporary entry with possibly wrong name
                return prev;
            });
        });
        // When someone notifies that their messages were read by the receiver,
        // the server emits messages_read with the contactId (the reader)
        const onMessagesRead = (contactId: string) => {
            setRecentChats((prev) => prev.map((c) => (c.contactId === contactId ? { ...c, unreadCount: 0 } : c)));
        };
        socket.on("messages_read", onMessagesRead);

        return () => {
            socket.off("receive_message", onReceive);
            socket.off("message_sent");
            socket.off("messages_read", onMessagesRead);
        };
    }, [userId, selectedChat]);

    // fetch initial chatlist from server
    useEffect(() => {
        if (!userId) return;
        const base = import.meta.env.VITE_NODE_BASE_URL || "";
        fetch(`${base}/chatlist/${userId}`)
            .then((r) => r.json())
            .then((data) => {
                if (data?.success) setRecentChats(data.chats || []);
            })
            .catch((e) => console.error("Failed to load chatlist", e));
    }, [userId]);

    // close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!isOpen) return;
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    const totalUnread = recentChats.reduce((a, c) => a + (c.unreadCount || 0), 0);

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Icon */}
            <button
                aria-label="Open messages"
                onClick={() => setIsOpen((s) => !s)}
                className="relative p-2 bg-red-500 text-white rounded-full hover:scale-105 transition-transform"
            >
                💬
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs rounded-full px-2 text-black font-semibold">
                        {totalUnread}
                    </span>
                )}
            </button>

            {/* Dropdown List */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="
                        absolute mt-2 w-80 max-w-[90vw] 
                        bg-white dark:bg-gray-800
                        border border-red-200 dark:border-red-800
                        rounded-2xl shadow-lg  z-50 animate-fadeIn custom-scrollbar
                        left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0
                        sm:w-80 sm:max-w-none
                    "
                >
                    {/* When a chat is selected, show only the ChatWindow. Otherwise show the list */}
                    {!selectedChat ? (
                        <>
                            <div className="flex items-center justify-between px-3 py-2 border-b dark:border-zinc-800">
                                <h4 className="font-semibold dark:text-white">Messages</h4>
                                <button onClick={() => setIsOpen(false)} className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-white">Close</button>
                            </div>

                            <div className="max-h-80 overflow-y-auto">
                                {recentChats.length === 0 && (
                                    <div className="p-4 text-center text-sm text-zinc-500">No conversations yet</div>
                                )}

                                {recentChats.map((chat) => (
                                    <div
                                        key={chat.contactId}
                                        onClick={() => {
                                            if (!chat?.contactId) return;
                                            setSelectedChat(chat);
                                        }}
                                        className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-start gap-3"
                                    >
                                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white font-semibold">
                                            {chat.contactName?.split(" ").map((s) => s[0]).slice(0, 2).join("") || "U"}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-sm dark:text-white">{chat.contactName}</p>
                                                <span className="text-xs text-zinc-400">
                                                    {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 truncate mt-1">{chat.lastMessage}</p>
                                        </div>

                                        {chat.unreadCount && chat.unreadCount > 0 && (
                                            <span className="ml-2 bg-red-500 text-white text-xs px-2 rounded-full h-fit">{chat.unreadCount}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="p-3">
                            <ChatWindow
                                chat={{ userId: selectedChat.contactId, name: selectedChat.contactName }}
                                userId={userId || ""}
                                onClose={() => {
                                    // mark read locally and server-side
                                    setRecentChats((prev) => prev.map((c) => (c.contactId === selectedChat.contactId ? { ...c, unreadCount: 0 } : c)));
                                    const base = import.meta.env.VITE_NODE_BASE_URL || "";
                                    fetch(`${base}/chatlist/mark-read`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ userId, contactId: selectedChat.contactId }),
                                    }).catch(() => { });
                                    setSelectedChat(null);
                                }}
                            />
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
