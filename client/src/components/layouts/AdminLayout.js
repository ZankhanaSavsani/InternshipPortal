import React from 'react';
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from '../admin/pages/NavLayout';
import { useAuth } from '../layouts/AuthProvider';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const excludePaths = ["/admin/login"];
  const showLayout = !excludePaths.includes(location.pathname);

  if (!showLayout) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 mt-[72px] lg:mt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
