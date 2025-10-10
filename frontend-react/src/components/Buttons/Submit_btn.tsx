interface SubmitBtnProps {
  isSubmitting: boolean;
}

const Submit_btn: React.FC<SubmitBtnProps> = ({ isSubmitting }) => {
  return (
    <button
      className="flex items-center gap-2 bg-green-600 dark:bg-green-800 font-medium transition-all duration-200 hover:bg-green-700 dark:hover:bg-green-300 active:scale-95 rounded-md text-white dark:text-gray-200 py-2 px-4 cursor-pointer"
      disabled={isSubmitting}
    >
      <span>{isSubmitting ? "Submitting..." : "Submit"}</span>
    </button>
  );
};

export default Submit_btn;
