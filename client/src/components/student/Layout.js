// components/Layout.js
import React from 'react';
import { Outlet, useLocation } from "react-router-dom";
import NavLayout from './pages/NavLayout';

const Layout = () => {
  const location = useLocation();
  const excludePaths = ["/login"];
  const showLayout = !excludePaths.includes(location.pathname);

  if (!showLayout) {
    return <Outlet />;
  }

  return (
    <NavLayout>
      <div className="h-full w-full">
        <Outlet />
      </div>
    </NavLayout>
  );
};

export default Layout;