import React from 'react';
import { Edit, Trash, FilePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GuideManagementPages = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-xl text-gray-700">
            Guide Management 
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create Guide Button */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button 
              className="w-full bg-white hover:bg-gray-50 p-6 text-left flex items-center space-x-4 transition-colors"
              onClick={() => navigate('/admin/AddGuidePage')}
            >
              <div className="bg-green-100 p-3 rounded-lg">
                <FilePlus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Create New Guide</h3>
                <p className="text-sm text-gray-500">Create a new guide document for users</p>
              </div>
            </button>
          </div>

          {/* Edit Guide Button */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button 
              className="w-full bg-white hover:bg-gray-50 p-6 text-left flex items-center space-x-4 transition-colors"
              onClick={() => navigate('/admin/EditGuide')}
            >
              <div className="bg-amber-100 p-3 rounded-lg">
                <Edit className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Edit Guide</h3>
                <p className="text-sm text-gray-500">Modify and update existing guides</p>
              </div>
            </button>
          </div>

          {/* Delete Guide Button */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button 
              className="w-full bg-white hover:bg-gray-50 p-6 text-left flex items-center space-x-4 transition-colors"
              onClick={() => navigate('/admin/DeleteGuide')}
            >
              <div className="bg-red-100 p-3 rounded-lg">
                <Trash className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Delete Guide</h3>
                <p className="text-sm text-gray-500">Remove guide documents from the system</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuideManagementPages;