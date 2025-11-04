import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import '../../assets/custom-scrollbar.css';
import { useAuth } from "../../contexts/AuthContext";
import { getLeftMenuAllData } from "../../services/LeftMenu";
import * as FaIcons from "react-icons/fa";
import { String_to_Array } from "../../services/Helpers";

type LeftmenuProps = {
  activePath: string;
  show?: boolean;
  hideMenu?: () => void;
};

// Helper to dynamically get icon component
const getIcon = (iconName?: string) => {
  if (!iconName) return null;
  const IconComponent = (FaIcons as any)[iconName];
  return IconComponent ? <IconComponent /> : null;
};


// Build tree from flat menu
const buildMenuTree = (items: any[]) => {
  const map: Record<string, any> = {};
  const roots: any[] = [];
  items.forEach(item => {
    item.children = [];
    map[item.id] = item;
  });
  items.forEach(item => {
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children.push(item);
    } else {
      roots.push(item);
    }
  });
  return roots;
};

const Leftmenu: React.FC<LeftmenuProps> = ({ activePath, show = true, hideMenu }) => {
  const [openParents, setOpenParents] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [menuTree, setMenuTree] = useState<any[]>([]);
  const { user } = useAuth();

  useAuth();

  // Fetch menu
  useEffect(() => {
    const fetchLeftmenuData = async () => {
      try {
        const res = await getLeftMenuAllData(user?.role);
        if (res?.data?.data) {
          const formattedMenus = res.data.data.map((item: any) => ({
            id: item._id,
            name: item.name,
            link: item.link || "",
            role: String_to_Array(item.role),
            icon: getIcon(item.icon),
            isParent: Number(item.isParent),
            parentId: item.parentId || null,
            sort_order: Number(item.sort_order) || 0,
          }));
          setMenuItems(formattedMenus);
        }
      } catch (err) {
        console.error("Error fetching left menu:", err);
      }
    };
    fetchLeftmenuData();
  }, []);

  // Build tree
  useEffect(() => {
    if (menuItems.length) {
      const tree = buildMenuTree(menuItems);
      setMenuTree(tree);

      // On load, open all parents of active path
      const activeItem = menuItems.find(item => item.link === activePath);
      if (activeItem) {
        const parents: string[] = [];
        let current = activeItem;
        while (current?.parentId) {
          parents.push(current.parentId);
          current = menuItems.find(m => m.id === current.parentId);
        }
        setOpenParents(parents);
      }
    }
  }, [menuItems, activePath]);

  const submenuVariants = {
    open: { opacity: 1, height: "auto", transition: { staggerChildren: 0.05 } },
    closed: { opacity: 0, height: 0, transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  };

  const toggleParent = (id: string) => {
    setOpenParents(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  // Check if item is active or ancestor of active
  const isHighlighted = (item: any) => {
    if (item.link === activePath) return true;
    // Check if item is ancestor of active
    let current = menuItems.find(m => m.link === activePath);
    while (current?.parentId) {
      if (current.parentId === item.id) return true;
      current = menuItems.find(m => m.id === current.parentId);
    }
    return false;
  };

  const renderMenuItem = (item: any, level = 0) => {
    const isOpen = openParents.includes(item.id);
    const hasChildren = item.children?.length > 0;
    const isActive = activePath === item.link;
    const highlight = isHighlighted(item);

    // 🔴 COLOR LOGIC:
    // - Closed parent & single menu: light red
    // - Open parent: medium red background for grouping
    // - Active link: dark red highlight
    // (Dark mode colors are also matched appropriately)
    const groupBg = hasChildren && isOpen
      ? "bg-red-300 dark:bg-gray-700" // 🔴 OPEN parent group background (covers full section)
      : hasChildren
        ? "bg-red-200 dark:bg-gray-700" // 🔴 Closed parent same as single menu
        : "bg-red-200 dark:bg-gray-700"; // 🔴 Single menu item background

    const paddingLeft = `${12 + level * 18}px`;

    return (
      <div
        key={item.id}
        className={`mt-1 rounded transition-colors ${groupBg}`}
        onClick={() => {
          if (hasChildren) toggleParent(item.id);
        }}
      >
        {/* 🔴 Header bar for each item */}
        <div
          className={`flex items-center justify-between w-full py-2 px-2
        ${isActive ? "bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 hover:bg-red-800 text-white hover:text-white font-semibold rounded" : ""}
        ${highlight && !isActive ? "text-red-100 dark:text-red-50 font-medium bg-red-500 dark:bg-red-800 rounded hover:bg-red-700 hover:text-white dark:hover:bg-red-900" : ""}
        text-gray-800 dark:text-gray-300 cursor-pointer hover:rounded-lg hover:bg-red-300 dark:hover:bg-gray-600 hover:text-red-700 dark:hover:text-red-100
      `}
          style={{ paddingLeft }}
        >
          {item.link ? (
            <NavLink
              to={item.link}
              className="flex items-center flex-1 w-full"
              onClick={(e) => {
                e.stopPropagation(); // prevent parent toggle
                const parents: string[] = [];
                let current = item;
                while (current?.parentId) {
                  parents.push(current.parentId);
                  current = menuItems.find(m => m.id === current.parentId);
                }
                setOpenParents(prev => Array.from(new Set([...prev, ...parents])));
                hideMenu?.();
              }}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ) : (
            <div className="flex items-center flex-1 w-full">
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </div>
          )}

          {hasChildren && (
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="ml-2"
            >
              ▼
            </motion.span>
          )}
        </div>

        {/* 🔴 Submenu area inside parent */}
        <AnimatePresence initial={false}>
          {isOpen && hasChildren && (
            <motion.div
              variants={submenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex flex-col bg-red-50 dark:bg-red-950 pl-2 rounded-b pb-1" // 🔴 Child area background
            >
              {item.children.map((child: any) => renderMenuItem(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };




  return (
    <>
      {/* Desktop */}
      <div className="custom-scrollbar pt-5 bg-red-100 dark:bg-gray-900 px-3 fixed top-16 left-0 h-[calc(100vh-4rem)] overflow-y-auto w-72 sm:block hidden">
        {menuTree.map(item => renderMenuItem(item))}
      </div>

      {/* Mobile */}
      <AnimatePresence>
        {show && (
          <motion.div key="mobile-menu">
            <motion.div
              className="fixed top-16 left-0 right-0 bottom-0 bg-black/40 z-40 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={hideMenu}
            />
            <motion.div
              className="custom-scrollbar pt-5 bg-white dark:bg-gray-900 h-screen overflow-y-auto fixed top-0 left-0 z-50 w-72 sm:hidden"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {menuTree.map(item => renderMenuItem(item))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


export default Leftmenu;
