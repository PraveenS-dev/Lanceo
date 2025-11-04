interface ApproveBtnProps {
    isSubmitting: boolean;
    setActionStatus: any;
}

const Approve_btn: React.FC<ApproveBtnProps> = ({ isSubmitting, setActionStatus }) => {
    return (
        <button
            className="flex items-center gap-2 bg-green-600 dark:bg-green-800 font-medium transition-all duration-200 hover:bg-green-700 dark:hover:bg-green-300 active:scale-95 rounded-md text-white dark:text-gray-200 py-2 px-4 cursor-pointer"
            disabled={isSubmitting}
            onClick={() => setActionStatus(1)}
        >
            <span>{"Approve"}</span>
        </button>
    );
};

export default Approve_btn;
