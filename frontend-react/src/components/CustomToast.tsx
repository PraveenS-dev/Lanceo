import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
} from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

type CustomToastProps = {
  message: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
};

const CustomToast: React.FC<CustomToastProps> = ({
  message,
  type,
  duration = 3000,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => handleClose(), duration);
    return () => clearTimeout(timer);
  }, [duration, paused]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  const colors: Record<ToastType, string> = {
    success: "from-green-400 to-emerald-600",
    error: "from-red-500 to-rose-600",
    info: "from-blue-500 to-indigo-600",
    warning: "from-yellow-400 to-orange-500",
  };

  const particleColors: Record<ToastType, string> = {
    success: "#6ee7b7",
    error: "#f87171",
    info: "#60a5fa",
    warning: "#fbbf24",
  };

  const iconClasses: Record<ToastType, string> = {
    success: "animate-icon-pop",
    error: "animate-icon-shake",
    info: "animate-icon-pulse",
    warning: "animate-icon-wiggle",
  };

  const icons: Record<ToastType, JSX.Element> = {
    success: <CheckCircle2 className={`w-6 h-6 drop-shadow-lg ${iconClasses.success}`} />,
    error: <XCircle className={`w-6 h-6 drop-shadow-lg ${iconClasses.error}`} />,
    info: <Info className={`w-6 h-6 drop-shadow-lg ${iconClasses.info}`} />,
    warning: <AlertTriangle className={`w-6 h-6 drop-shadow-lg ${iconClasses.warning}`} />,
  };

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`
        relative w-80 p-4 rounded-2xl overflow-hidden
        flex items-center gap-3 backdrop-blur-xl
        text-white dark:text-gray-100
        border border-white/20 dark:border-gray-700
        bg-gradient-to-br ${colors[type]}
        shadow-[0_0_25px_4px_rgba(255,255,255,0.15)]
        animate-fadeIn
      `}
    >
      {/* Icon */}
      <div className="relative z-10">{icons[type]}</div>

      {/* Message */}
      <span className="relative z-10 font-semibold text-sm sm:text-base break-words">
        {message}
      </span>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-white/70 hover:text-white font-bold z-20 text-lg leading-none"
      >
        ×
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-white/20 rounded-full overflow-hidden">
        <div
          ref={progressRef}
          className={`h-1 bg-white/80 rounded-full ${paused ? "" : "animate-progress"}`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>

      {/* Glossy Particles */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full opacity-70 blur-[1px]"
            style={{
              background: particleColors[type],
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `floatParticle ${2 + Math.random() * 3}s linear infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CustomToast;
