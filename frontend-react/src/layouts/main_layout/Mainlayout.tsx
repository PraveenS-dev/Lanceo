import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Leftmenu from './Leftmenu';
import Topbar from './Topbar';

type MainProps = {
  children: ReactNode;
  pageUrl: string;
  pageName: string;
}

const Mainlayout: React.FC<MainProps> = ({ children, pageUrl, pageName }) => {
  const [showLeftMenu, setShowLeftMenu] = useState(false);

  useEffect(() => {
    document.title = `${import.meta.env.VITE_APP_NAME} | ${pageName}`;
  }, [pageName]);

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50 dark:bg-gray-800">

      <Topbar toggleLeftMenu={() => setShowLeftMenu(!showLeftMenu)} />

      <div className="flex flex-1 flex-row">
        {/* Leftmenu */}
        <Leftmenu activePath={pageUrl} show={showLeftMenu} hideMenu={() => setShowLeftMenu(false)} />

        {/* Main content */}
        <div className="flex-1 p-4 text-gray-800 dark:text-white">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Mainlayout;
