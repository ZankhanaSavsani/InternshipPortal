import React from 'react';
import { UserPlus, UserCog, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
// import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminManagementPages = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-xl text-gray-700">
            Admin Management 
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Admin Button */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button 
              className="w-full bg-white hover:bg-gray-50 p-6 text-left flex items-center space-x-4 transition-colors"
              onClick={() => navigate('/admin/AddAdmin')}
            >
              <div className="bg-purple-100 p-3 rounded-lg">
                <UserPlus className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Add New Admin</h3>
                <p className="text-sm text-gray-500">Create a new administrator account</p>
              </div>
            </button>
          </div>

          {/* Edit Admin Button */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button 
              className="w-full bg-white hover:bg-gray-50 p-6 text-left flex items-center space-x-4 transition-colors"
              onClick={() => navigate('/admin/EditAdmin')}
            >
              <div className="bg-blue-100 p-3 rounded-lg">
                <UserCog className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Edit Admin</h3>
                <p className="text-sm text-gray-500">Modify existing administrator accounts</p>
              </div>
            </button>
          </div>

          {/* Delete Admin Button */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button 
              className="w-full bg-white hover:bg-gray-50 p-6 text-left flex items-center space-x-4 transition-colors"
              onClick={() => navigate('/admin/DeleteAdmin')}
            >
              <div className="bg-red-100 p-3 rounded-lg">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Delete Admin</h3>
                <p className="text-sm text-gray-500">Remove administrator accounts from the system</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManagementPages;