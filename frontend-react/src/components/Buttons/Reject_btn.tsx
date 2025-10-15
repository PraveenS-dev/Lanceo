interface RejectBtnProps {
    isSubmitting: boolean;
    setActionStatus: any;
}

const Reject_btn: React.FC<RejectBtnProps> = ({ isSubmitting, setActionStatus }) => {
    return (
        <button
            className="flex items-center gap-2 bg-red-600 dark:bg-red-800 font-medium transition-all duration-200 hover:bg-red-700 dark:hover:bg-red-300 active:scale-95 rounded-md text-white dark:text-gray-200 py-2 px-4 cursor-pointer me-3"
            disabled={isSubmitting}
            onClick={() => setActionStatus(3)}
        >
            <span>{"Reject"}</span>
        </button>
    );
};


export default Reject_btn;
