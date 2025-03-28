// pages/Dashboard.js
import React from 'react';
import NavLayout from './NavLayout';
import CompanyApprovalForm from './CompanyApprovalPage';

const Dashboard = () => {
  return (
    <div className="h-full w-full p-6">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome to your internship management system.</p>
        {/* Add more dashboard content here */}
      </div>
    </div>
  );
};

export default Dashboard;
