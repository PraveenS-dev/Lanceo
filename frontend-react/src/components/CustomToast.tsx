export type ToastType = "success" | "error" | "info" | "warning";

type CustomToastProps = {
    message: string,
    type: ToastType
};

const CustomToast: React.FC<CustomToastProps> = ({ message, type }) => {
    const styles = {
        success: "from-green-500 to-emerald-600",
        error: "from-red-500 to-rose-600",
        info: "from-blue-500 to-indigo-600",
        warning: "from-yellow-400 to-orange-500",
    };

    const icons: Record<ToastType, string> = {
        success: "✅",
        error: "❌",
        info: "ℹ️",
        warning: "⚠️",
    }

    return (
        <div
            className={`relative w-80 p-4 rounded-xl shadow-lg text-white 
                  bg-gradient-to-r ${styles[type]}`}
        >
            <div className="flex items-center gap-3">
                <span className="text-lg">{icons[type]}</span>
                <span className="font-medium">{message}</span>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-white/70 animate-progress" />
        </div>
    );
}

export default CustomToast;