import { io } from "socket.io-client";

// Resolve a socket URL from env. Backend API base often contains a `/api` suffix
// (e.g. http://localhost:5000/api). Socket server is mounted on the root HTTP server,
// so we need to strip the `/api` part if present. Allow overriding with VITE_SOCKET_URL.
const rawApiUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_NODE_BASE_URL || "";
const SOCKET_URL = rawApiUrl.replace(/\/api\/?$/, "");

export const socket = io(SOCKET_URL || undefined, {
  transports: ["websocket"],
  path: "/socket.io",
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
});