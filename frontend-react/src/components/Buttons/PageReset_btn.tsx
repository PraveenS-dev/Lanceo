const PageReset_btn = () => {
    const handleReset = () => {
        window.location.reload();
    };

    return (
        <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 bg-red-600 dark:bg-red-800 font-medium transition-all duration-200 hover:bg-red-700 dark:hover:bg-red-300 active:scale-95 rounded-md text-white dark:text-gray-200 py-2 px-4 cursor-pointer me-3"
        >
            <span>Reset</span>
        </button>
    );
};

export default PageReset_btn;
