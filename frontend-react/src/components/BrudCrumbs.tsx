import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface CrumbsProps {
    crumbs: any;
}

const BrudCrumbs: React.FC<CrumbsProps> = ({ crumbs }) => {
    const navigate = useNavigate();

    return (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            {crumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                    {crumb.path ? (
                        <button
                            onClick={() => navigate(crumb.path)}
                            className="hover:text-red-300 dark:hover:text-red-800 transition-colors cursor-pointer"
                        >
                            {crumb.label}
                        </button>
                    ) : (
                        <span className="font-bold text-red-600 dark:text-red-700">{crumb.label}</span>
                    )}
                    {index < crumbs.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            ))}
        </div>
    );
};

export default BrudCrumbs;
