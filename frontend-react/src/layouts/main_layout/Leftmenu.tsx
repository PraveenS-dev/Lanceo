import React, { useState, useEffect } from "react";
import { FaBriefcase, FaHome } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import '../../assets/custom-scrollbar.css';

const navItems = [
  { id: 1, name: "Dashboard", link: "/dashboard", role: ["1", "2", "3"], icon: <FaHome />, isParent: 0, parentId: null, sort_order: 1 },
  { id: 2, name: "Projects", link: "", role: ["1", "2", "3"], icon: <FaBriefcase />, isParent: 1, parentId: null, sort_order: 2 },
  { id: 3, name: "List", link: "/projects/list", role: ["1", "2", "3"], icon: <FaBriefcase />, isParent: 0, parentId: 2, sort_order: 2 },
  { id: 4, name: "Add", link: "/projects/add", role: ["1", "2", "3"], icon: <FaBriefcase />, isParent: 0, parentId: 2, sort_order: 1 },
];

const Animation = {
  scale: [1, 1.2, 1],
  transition: { duration: 0.3, ease: "easeInOut" },
};

type LeftmenuProps = {
  activePath: string;
  show?: boolean; // mobile visibility
  hideMenu?: () => void; // called when menu clicked on mobile
};

const Leftmenu: React.FC<LeftmenuProps> = ({ activePath, show = true, hideMenu }) => {
  const [openParents, setOpenParents] = useState<number[]>([]);
  const [clickIndex, setClickIndex] = useState<number | null>(null);

  // Auto-open parent if any child is active
  useEffect(() => {
    const activeParent = navItems.find(
      (parent) =>
        parent.isParent &&
        navItems.some((child) => child.parentId === parent.id && activePath.startsWith(child.link))
    );
    if (activeParent && !openParents.includes(activeParent.id)) {
      setOpenParents((prev) => [...prev, activeParent.id]);
    }
  }, [activePath]);

  const sortedItems = [...navItems]
    .filter((item) => !item.parentId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const submenuVariants = {
    open: { opacity: 1, height: "auto", transition: { staggerChildren: 0.05, when: "beforeChildren" } },
    closed: { opacity: 0, height: 0, transition: { staggerChildren: 0.05, staggerDirection: -1, when: "afterChildren" } },
  };

  const submenuItemVariants = { open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: -10 } };

  const toggleParent = (id: number) => {
    setOpenParents((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleMenuClick = (parentId: number | null) => {
    // Close all other parents except the clicked one
    setOpenParents(parentId ? [parentId] : []);
    hideMenu?.(); // close mobile menu
  };

  const renderMenuItem = (item: typeof navItems[0], index: number) => {
    if (item.isParent) {
      const children = navItems.filter((child) => child.parentId === item.id).sort((a, b) => a.sort_order - b.sort_order);
      const isOpen = openParents.includes(item.id);

      return (
        <div key={item.id} className="mb-3 rounded overflow-hidden">
          <div className={`rounded transition-colors ${isOpen ? "bg-red-600/20" : ""}`}>
            <button
              onClick={() => toggleParent(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-t transition-colors ${
                isOpen
                  ? "text-red-900 dark:text-white font-semibold"
                  : "text-gray-800 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-800 hover:text-red-600 dark:hover:text-red-400"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
              <motion.span
                className="ml-auto"
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  variants={submenuVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="flex flex-col ml-6"
                >
                  {children.map((child) => {
                    const isActive = activePath === child.link;
                    return (
                      <motion.div key={child.id} variants={submenuItemVariants}>
                        <NavLink
                          to={child.link}
                          onClick={() => handleMenuClick(item.id)}
                          className={`block px-3 py-2 rounded mb-1 me-1 transition-colors ${
                            isActive
                              ? "bg-red-600 text-white font-semibold"
                              : "text-gray-900 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-800 hover:text-red-600 dark:hover:text-red-100"
                          }`}
                        >
                          {child.name}
                        </NavLink>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      );
    } else {
      const isActive = activePath === item.link;
      return (
        <NavLink
          key={item.id}
          to={item.link}
          onClick={() => handleMenuClick(null)}
          title={item.name}
          className={`group flex items-center mb-3 px-3 py-2 rounded transition-colors ${
            isActive
              ? "bg-red-600 text-white font-semibold"
              : "text-gray-800 dark:text-gray-300 hover:bg-red-200 dark:hover:bg-red-800 hover:text-red-600 dark:hover:text-red-100"
          }`}
        >
          <motion.span
            animate={clickIndex === index ? Animation : {}}
            className={`mr-3 ${isActive ? "text-white" : "text-gray-800 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-100"}`}
          >
            {item.icon}
          </motion.span>
          <span>{item.name}</span>
        </NavLink>
      );
    }
  };

  return (
    <>
      {/* Desktop Menu */}
      <div className="custom-scrollbar pt-5 bg-red-100 dark:bg-gray-900 px-3 fixed top-16 left-0 h-[calc(100vh-4rem)] overflow-y-auto w-72 sm:block hidden">
        {sortedItems.map((item, index) => renderMenuItem(item, index))}
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {show && (
          <motion.div key="mobile-menu">
            {/* Backdrop */}
            <motion.div
              className="fixed top-16 left-0 right-0 bottom-0 bg-black/40 z-40 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={hideMenu}
            />
            {/* Slide-in Menu */}
            <motion.div
              className="custom-scrollbar pt-5 bg-white dark:bg-gray-900 h-screen overflow-y-auto fixed top-0 left-0 z-50 w-72 sm:hidden"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {sortedItems.map((item, index) => renderMenuItem(item, index))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Leftmenu;
