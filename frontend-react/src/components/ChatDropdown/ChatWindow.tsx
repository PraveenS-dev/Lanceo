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
    const [showDebug, setShowDebug] = useState(false);
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

        let mounted = true;

        // initialize: join room, mark as read, fetch history
        const init = async () => {
            try {
                socket.emit("join_user", userId);
                socket.emit("mark_as_read", { senderId: chat.userId, receiverId: userId });

                const base = import.meta.env.VITE_NODE_BASE_URL || "";
                const res = await fetch(`${base}/messages/${encodeURIComponent(userId)}/${encodeURIComponent(chat.userId)}`);
                if (!mounted) return;
                if (res.ok) {
                    const data = await res.json();
                    // Normalize ids and timestamps so comparisons work (ObjectId -> string)
                    const norm = (Array.isArray(data) ? data : []).map((m: any) => ({
                        ...m,
                        senderId: String(m.senderId),
                        receiverId: String(m.receiverId),
                        createdAt: m.createdAt || m.created_at || new Date().toISOString(),
                        _id: m._id ? String(m._id) : m._id,
                    }));
                    // Sort by createdAt just in case server order differs
                    norm.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    console.debug("[ChatWindow] loaded messages:", norm.map((x: any) => ({ _id: x._id, senderId: x.senderId, createdAt: x.createdAt })));
                    setMessages(norm);
                } else {
                    console.warn("Failed to fetch messages, status:", res.status);
                    setMessages([]);
                }
            } catch (err) {
                console.error("ChatWindow initialization error:", err);
                if (mounted) setMessages([]);
            }
        };

        init();

    const handler = (msg: any) => {
            try {
                // normalize incoming ids to strings
                const senderIdRaw = msg.senderId ?? msg.sender ?? msg.from;
                const receiverIdRaw = msg.receiverId ?? msg.receiver ?? msg.to;
                const senderId = senderIdRaw ? String(senderIdRaw) : undefined;
                const receiverId = receiverIdRaw ? String(receiverIdRaw) : undefined;

                // ensure message belongs to this conversation
                if (
                    (senderId === String(chat.userId) && receiverId === String(userId)) ||
                    (senderId === String(userId) && receiverId === String(chat.userId))
                ) {
                    const normalizedMsg = {
                        ...msg,
                        senderId,
                        receiverId,
                        createdAt: msg.createdAt || msg.created_at || new Date().toISOString(),
                        _id: msg._id ? String(msg._id) : msg._id,
                    };

                    console.debug("[ChatWindow] incoming message:", {
                        _id: msg._id,
                        senderId: normalizedMsg.senderId,
                        receiverId: normalizedMsg.receiverId,
                        message: normalizedMsg.message,
                        createdAt: normalizedMsg.createdAt,
                    });

                    setMessages((prev) => {
                        // If server gave us an _id for this message, try to replace any optimistic local copy.
                        if (normalizedMsg._id) {
                            const idx = prev.findIndex((m) =>
                                typeof m._id === 'string' && m._id.startsWith('local_') &&
                                m.message === normalizedMsg.message && String(m.senderId) === String(normalizedMsg.senderId) && String(m.receiverId) === String(normalizedMsg.receiverId) &&
                                Math.abs(new Date(m.createdAt || m.created_at || Date.now()).getTime() - new Date(normalizedMsg.createdAt).getTime()) < 3000
                            );
                            if (idx !== -1) {
                                const copy = [...prev];
                                copy[idx] = normalizedMsg;
                                console.debug("[ChatWindow] replaced optimistic message with server message", normalizedMsg._id);
                                return copy;
                            }
                        }

                        // simple dedupe: ignore if there's already a message with same id
                        if (normalizedMsg._id && prev.some((m) => m._id === normalizedMsg._id)) return prev;

                        // or ignore if same sender and same text exists very recently
                        const recentDup = prev.some((m) =>
                            m.message === normalizedMsg.message && String(m.senderId) === String(normalizedMsg.senderId) && String(m.receiverId) === String(normalizedMsg.receiverId) && Math.abs(new Date(m.createdAt || m.created_at || Date.now()).getTime() - new Date(normalizedMsg.createdAt).getTime()) < 3000
                        );
                        if (recentDup) return prev;

                        console.debug("[ChatWindow] appending message", normalizedMsg._id);
                        return [...prev, normalizedMsg];
                    });
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

        socket.on("receive_message", handler);
        socket.on("message_sent", handler);
        socket.on("messages_read", onMessagesRead);

        return () => {
            mounted = false;
            socket.off("receive_message", handler);
            socket.off("message_sent", handler);
            socket.off("messages_read", onMessagesRead);
        };
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
        const msg: any = { senderId: String(userId), receiverId: String(chat.userId), message: text };
        if (senderName) msg.userName = senderName;

        // Optimistically append the message so it appears immediately in the UI
        const optimistic = { ...msg, createdAt: new Date().toISOString(), _id: `local_${Date.now()}`, isRead: true };
        setMessages((prev) => [...prev, optimistic]);

        socket.emit("private_message", msg);
    };

    return (
        <div className="w-full max-h-[70vh] md:h-auto bg-white dark:bg-zinc-900 rounded-xl shadow-lg flex flex-col">
            {/* Debug toggle + diagnostics (temporary) */}
            {/* <div className="px-3 pt-3">
                <button onClick={() => setShowDebug((s) => !s)} className="text-xs text-zinc-500 hover:text-zinc-700">{showDebug ? 'Hide' : 'Show'} chat debug</button>
                {showDebug && (
                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-md text-xs text-zinc-700 dark:text-zinc-200">
                        <div><strong>Loaded messages:</strong> {messages.length}</div>
                        <div className="mt-1">
                            {messages.slice(-10).map((m:any) => (
                                <div key={m._id || `${m.senderId}_${m.createdAt}`} className="truncate">
                                    <div className="font-mono text-[10px]">{m._id} • {String(m.senderId)} • {new Date(m.createdAt).toLocaleString()}</div>
                                    <div className="mt-0.5 text-[12px] text-zinc-800 dark:text-zinc-200">{String(m.message)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div> */}
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
                                const isMe = String(m.senderId) === String(userId);
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
