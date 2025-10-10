import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PlusCircle } from "lucide-react";

interface AddBtnProps {
    url: string;
}

const Add_btn: React.FC<AddBtnProps> = ({ url }) => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(url)}
            className=" flex items-center gap-2  bg-gray-600 dark:bg-gray-800 font-medium transition-all duration-200  hover:bg-gray-700 dark:hover:bg-gray-900 active:scale-95 rounded-md  text-white dark:text-gray-200 py-2 px-4 cursor-pointer me-3"
        >
            <PlusCircle className="w-4 h-4" />
            <span>Add</span>
        </button>
    );
};

export default Add_btn;
