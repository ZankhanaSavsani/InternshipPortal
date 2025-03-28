import React from 'react';
import { UserPlus, UserCog, UserX, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { useNavigate } from 'react-router-dom';

const StudentManagementPages = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-xl text-gray-700">
            Student Management 
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Student Page Button */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button 
              className="w-full bg-white hover:bg-gray-50 p-6 text-left flex items-center space-x-4 transition-colors"
              onClick={() => navigate('/admin/AddStudent')}
            >
              <div className="bg-blue-100 p-3 rounded-lg">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Add New Student</h3>
                <p className="text-sm text-gray-500">Create a new student record in the system</p>
              </div>
            </button>
          </div>
          
          {/* Edit Student Page Button */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button 
              className="w-full bg-white hover:bg-gray-50 p-6 text-left flex items-center space-x-4 transition-colors"
              onClick={() => navigate('/admin/EditStudent')}
            >
              <div className="bg-amber-100 p-3 rounded-lg">
                <UserCog className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Edit Student</h3>
                <p className="text-sm text-gray-500">Modify existing student information</p>
              </div>
            </button>
          </div>
          
          {/* Delete Student Page Button */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button 
              className="w-full bg-white hover:bg-gray-50 p-6 text-left flex items-center space-x-4 transition-colors"
              onClick={() => navigate('/admin/DeleteStudent')}
            >
              <div className="bg-red-100 p-3 rounded-lg">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Delete Student</h3>
                <p className="text-sm text-gray-500">Remove student records from the system</p>
              </div>
            </button>
          </div>
          
          {/* Student Internship Details Button */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <button 
              className="w-full bg-white hover:bg-gray-50 p-6 text-left flex items-center space-x-4 transition-colors"
              onClick={() => navigate('/admin/StudentInternshipDetails')}
            >
              <div className="bg-green-100 p-3 rounded-lg">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Student Internship Details</h3>
                <p className="text-sm text-gray-500">View and manage student internship information</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentManagementPages;