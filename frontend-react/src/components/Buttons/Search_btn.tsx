import { Search } from "lucide-react";

interface SearchBtnProps {
  isSubmitting: boolean;
}

const Search_btn: React.FC<SearchBtnProps> = ({ isSubmitting }) => {
  return (
    <button
      className="flex items-center gap-2 bg-blue-600 dark:bg-blue-800 font-medium transition-all duration-200 hover:bg-blue-700 dark:hover:bg-blue-300 active:scale-95 rounded-md text-white dark:text-gray-200 py-2 px-4 cursor-pointer"
      disabled={isSubmitting}
    >
      <Search className="w-4 h-4" />
      {/* <span>{isSubmitting ? "Searching..." : "Search"}</span> */}
      Search
    </button>
  );
};

export default Search_btn;
