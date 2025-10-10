import { Filter } from "lucide-react";
import React from "react";

interface FilterBtnProps {
    showFilter: boolean;
    setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
}

const FilterBtn: React.FC<FilterBtnProps> = ({ showFilter, setShowFilter }) => {
    return (
        <button
            type="button"
            onClick={() => setShowFilter((prev) => !prev)}
            className="flex items-center gap-2 bg-red-400 dark:bg-red-600 text-white px-3 py-2 rounded transition-all duration-200 hover:bg-red-500 dark:hover:bg-red-700 active:scale-95 cursor-pointer"
        >
            <Filter className="w-4 h-4"  />
            <span>{showFilter ? "Hide Filters" : "Show Filters"}</span>
        </button>
    );
};

export default FilterBtn;
