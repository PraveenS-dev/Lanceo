import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface BackBtnProps {
    url: string;
}

const Back_btn: React.FC<BackBtnProps> = ({ url }) => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(url)}
            className=" flex items-center gap-2  bg-red-600 dark:bg-red-800 font-medium transition-all duration-200  hover:bg-red-700 dark:hover:bg-red-300 active:scale-95 rounded-md  text-white dark:text-gray-200 py-2 px-4 cursor-pointer"
        >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
        </button>
    );
};

export default Back_btn;
