import { useState, useEffect, useRef } from "react";
import MessageInput from "./MessageInput";
import { socket } from "../../utils/socket";
import { useAuth } from "../../contexts/AuthContext";

type ChatWindowProps = {
    chat: { userId: string; name?: string };
    userId: string;
    userName?: string;
    onClose: () => void;
};

export default function ChatWindow({ chat, userId, onClose, userName }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const messageEndRef = useRef<HTMLDivElement | null>(null);
    const { user } = useAuth();
    const senderName = userName ?? user?.name ?? (() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) return JSON.parse(stored).name;
        } catch (e) {
            // ignore
        }
        return undefined;
    })();

    const formatTime = (m: any) => {
        const date = new Date(m.createdAt || m.created_at || Date.now());
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    useEffect(() => {
        if (!chat?.userId || !userId) return;

        (async () => {
            try {
                // Safely join room
                socket.emit("join_user", userId);

                // mark messages as read for this conversation on the server
                socket.emit("mark_as_read", { senderId: chat.userId, receiverId: userId });

                // Fetch old messages via API (use VITE_NODE_BASE_URL to ensure correct origin)
                const base = import.meta.env.VITE_NODE_BASE_URL || "";
                const res = await fetch(`${base}/messages/${encodeURIComponent(userId)}/${encodeURIComponent(chat.userId)}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(Array.isArray(data) ? data : []);
                } else {
                    console.warn("Failed to fetch messages, status:", res.status);
                    setMessages([]);
                }

                const handler = (msg: any) => {
                    try {
                        if (
                            (msg.senderId === chat.userId && msg.receiverId === userId) ||
                            (msg.senderId === userId && msg.receiverId === chat.userId)
                        ) {
                            setMessages((prev) => [...prev, msg]);
                        }
                    } catch (e) {
                        console.error("Error handling incoming message:", e);
                    }
                };

                const onMessagesRead = (readerId: string) => {
                    try {
                        if (readerId === chat.userId) {
                            setMessages((prev) => prev.map((m) => (m.senderId === userId && m.receiverId === chat.userId ? { ...m, isRead: true } : m)));
                        }
                    } catch (e) {
                        console.error("Error handling messages_read:", e);
                    }
                };

                // Listen for new messages (incoming and confirmation for sent messages)
                socket.on("receive_message", handler);
                socket.on("message_sent", handler);
                socket.on("messages_read", onMessagesRead);

                // cleanup
                return () => {
                    socket.off("receive_message", handler);
                    socket.off("message_sent", handler);
                    socket.off("messages_read", onMessagesRead);
                };
            } catch (err) {
                console.error("ChatWindow initialization error:", err);
            }
        })();
    }, [chat?.userId, userId]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const groupMessagesByDate = (msgs: any[]) => {
        const groups: { date: string; items: any[] }[] = [];
        msgs.forEach((m) => {
            const date = new Date(m.createdAt || m.created_at || Date.now());
            const key = date.toDateString();
            let g = groups.find((x) => x.date === key);
            if (!g) {
                g = { date: key, items: [] };
                groups.push(g);
            }
            g.items.push(m);
        });
        return groups;
    };

    const handleSend = (text: string) => {
        const msg: any = { senderId: userId, receiverId: chat.userId, message: text };
        if (senderName) msg.userName = senderName;
        socket.emit("private_message", msg);
    };

    return (
        <div className="w-full max-h-[70vh] md:h-auto bg-white dark:bg-zinc-900 rounded-xl shadow-lg flex flex-col">
            <div className="flex items-center gap-3 p-2 border-b dark:border-zinc-700">
                <button onClick={onClose} className="text-xl px-2 dark:text-white">←</button>
                <p className="font-semibold dark:text-white">{chat.name}</p>
            </div>
            <div className="flex justify-center mt-2 mb-1">
                <p
                    className="
                        px-4 py-1 text-xs font-medium tracking-wide
                        text-gray-600 dark:text-gray-300
                        bg-white/70 dark:bg-zinc-800/60
                        border border-gray-200 dark:border-zinc-700
                        rounded-full shadow-sm backdrop-blur-md
                        flex items-center gap-2
                    "
                >
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-3.5 h-3.5 text-yellow-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16a2 2 0 001.73 3z' />
                    </svg>
                    Admin can monitor this chat
                </p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
                {groupMessagesByDate(messages).map((group) => (
                    <div key={group.date} className="mb-4">
                        <div className="flex justify-center mb-2">
                            <span className="text-xs px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{new Date(group.date).toLocaleDateString()}</span>
                        </div>

                        <div className="space-y-3">
                            {group.items.map((m: any) => {
                                const isMe = m.senderId === userId;
                                return (
                                    <div key={m._id || `${m.senderId}_${m.receiverId}_${m.createdAt}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-2 rounded-lg max-w-[70%] ${isMe ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-black dark:text-white'}`}>
                                            <div className="whitespace-pre-wrap">{m.message}</div>
                                            <div className="mt-1 text-[11px] opacity-80 flex items-center gap-2 justify-end">
                                                <span>{formatTime(m)}</span>
                                                {isMe && (
                                                    <span>
                                                        {m.isRead ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-300 inline-block" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-200 inline-block" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                <div ref={messageEndRef}></div>
            </div>

            <div className="p-2 border-t dark:border-zinc-700">
                <MessageInput onSend={handleSend} />
            </div>
        </div>
    );
}
