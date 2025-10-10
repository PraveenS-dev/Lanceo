import React from "react";
import { LucideRotateCcw } from "lucide-react";

interface ResetBtnProps {
    onClick: () => void;
}
const Reset_btn: React.FC<ResetBtnProps> = ({ onClick }) => {

    return (
        <button
            onClick={onClick}
            className=" flex items-center gap-2  bg-red-600 dark:bg-red-800 font-medium transition-all duration-200  hover:bg-red-700 dark:hover:bg-red-300 active:scale-95 rounded-md  text-white dark:text-gray-200 py-2 px-4 me-2 cursor-pointer"
        >
            <LucideRotateCcw className="w-4 h-4" />
            <span>Reset</span>
        </button>
    );
};

export default Reset_btn;
