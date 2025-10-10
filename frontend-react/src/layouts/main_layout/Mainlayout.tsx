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
    <div className="flex w-full min-h-screen bg-gray-100 dark:bg-gray-800 flex-col">

      {/* Fixed Topbar */}
      <div className="fixed top-0 left-0 w-full z-30">
        <Topbar toggleLeftMenu={() => setShowLeftMenu(!showLeftMenu)} />
      </div>

      {/* Content area */}
      <div className="flex flex-1 pt-16">
        {/* Desktop Leftmenu */}
        <div className="hidden sm:block">
          <Leftmenu activePath={pageUrl} show={false} hideMenu={() => { }} />
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 text-gray-800 dark:text-white sm:ml-71">
          {children}
        </div>

        {/* Mobile Leftmenu */}
        <Leftmenu activePath={pageUrl} show={showLeftMenu} hideMenu={() => setShowLeftMenu(false)} />
      </div>
    </div>
  );
};


export default Mainlayout;
