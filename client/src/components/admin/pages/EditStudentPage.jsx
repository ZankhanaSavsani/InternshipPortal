import React, { useState } from 'react';
import axios from 'axios';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useAuth } from "../../layouts/AuthProvider";

const StudentManagementPage = () => {
  const { isAuthenticated, user } = useAuth();
  // State for search parameters
  const [studentId, setStudentId] = useState('');
  const [semester, setSemester] = useState('');
  
  // State for student data
  const [student, setStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  
  // State for status messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState('');

  // Function to search for a student
  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitStatus(null);
    setSubmitMessage('');
    setStudent(null);
    setIsEditing(false);
    
    if (!studentId || !semester) {
      setError('Please provide both Student ID and Semester');
      return;
    }
    
    if (!isAuthenticated) {
      setError("You must be logged in to search for students.");
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post('/api/students/fetch-student', 
        {}, // Empty body since we're passing data in query params
        {
          params: { studentId, semester },
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${user.token}`,
          }
        }
      );
      
      // Check if the response has the expected structure with success and data properties
      if (response.data && response.data.success === true && response.data.data) {
        setStudent(response.data.data);
        setEditFormData(response.data.data);
      } else if (response.data) {
        // Fallback for direct data response without success/data wrapper
        setStudent(response.data);
        setEditFormData(response.data);
      } else {
        throw new Error('Invalid data format returned from API');
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.status === 404) {
        setError('Student not found with the provided ID and semester');
      } else if (err.response && err.response.status === 403) {
        setError('You do not have permission to access this resource');
      } else if (err.response && err.response.status === 400) {
        setError(err.response.data.message || 'Invalid input data');
      } else {
        setError('An error occurred while fetching student data');
        console.error(err);
      }
    }
  };

  // Function to handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === 'semester' ? parseInt(value, 10) : 
              name === 'isDeleted' ? value === 'true' : value
    });
  };

  // Function to update student data
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitStatus(null);
    setSubmitMessage('');
    
    if (!isAuthenticated) {
      setError("You must be logged in to update student data.");
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = { ...editFormData };
      
      // Only include password field if a new password is provided
      if (editFormData.newPassword) {
        payload.password = editFormData.newPassword;
        delete payload.newPassword;
      } else {
        delete payload.newPassword;
      }
      
      const response = await axios.put(`/api/students/${student._id}`, payload, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${user.token}`,
        }
      });
      
      // Check if the response has the expected structure
      if (response.data && response.data.success === true && response.data.data) {
        setStudent(response.data.data);
        setEditFormData(response.data.data);
        setIsEditing(false);
        setSubmitStatus("success");
        setSubmitMessage('Student data updated successfully!');
      } else if (response.data) {
        // Fallback for direct data response
        setStudent(response.data);
        setEditFormData(response.data);
        setIsEditing(false);
        setSubmitStatus("success");
        setSubmitMessage('Student data updated successfully!');
      } else {
        throw new Error('Invalid data format returned from API');
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.status === 403) {
        setError('You do not have permission to update student data');
      } else {
        setError('Failed to update student data: ' + (err.response?.data?.message || err.message));
        console.error(err);
      }
    }
  };

  // Function to restore a soft-deleted student
  const handleRestore = async () => {
    setError('');
    setSubmitStatus(null);
    setSubmitMessage('');

    if (!isAuthenticated) {
      setError("You must be logged in to restore a student.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.patch(
        `/api/students/restore/${student._id}`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      // Check if the response has the expected structure
      if (response.data && response.data.success === true && response.data.data) {
        setStudent(response.data.data); // Update the student's state
        setEditFormData(response.data.data); // Update the edit form data
        setSubmitStatus("success");
        setSubmitMessage('Student restored successfully!');
      } else {
        throw new Error('Invalid data format returned from API');
      }
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError('You do not have permission to restore this student');
      } else {
        setError('Failed to restore student: ' + (err.response?.data?.message || err.message));
      }
      setSubmitStatus("error");
      setSubmitMessage('Failed to restore student.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to cancel editing and revert to original data
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(student);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="mb-6 text-blue-600">
            <UserPlus className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            You must be logged in to access the student management system.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium transition duration-200 transform hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Student Management</h1>
      
      {/* Search Form */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Find Student</h2>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="w-full md:w-1/3">
            <label className="block mb-1">Student ID</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter student ID"
            />
          </div>
          <div className="w-full md:w-1/3">
            <label className="block mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Semester</option>
              <option value="5">5</option>
              <option value="7">7</option>
            </select>
          </div>
          <div className="w-full md:w-1/3 flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Error Message */}
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}
      
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4">
            <Loader className="h-6 w-6 text-blue-600 animate-spin" />
            <p className="text-lg font-medium text-gray-800">
              Processing...
            </p>
          </div>
        </div>
      )}
      
      <div className="max-w-3xl mx-auto">
        {/* Status Messages */}
        {submitStatus === "success" && (
          <div className="mb-4 transform animate-fade-in-down">
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    Success
                  </h3>
                  <p className="text-sm text-green-700">{submitMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {submitStatus === "error" && (
          <div className="mb-4 transform animate-fade-in-down">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700">{submitMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Student Details and Edit Form */}
        {student && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Student Details</h2>
              <div className="flex gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                )}
                {student.isDeleted && (
                  <button
                    onClick={handleRestore}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <form onSubmit={handleUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block mb-1 font-medium">Student ID</label>
                    <input
                      type="text"
                      name="studentId"
                      value={editFormData.studentId || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Student Name</label>
                    <input
                      type="text"
                      name="studentName"
                      value={editFormData.studentName || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Semester</label>
                    <select
                      name="semester"
                      value={editFormData.semester || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="5">5</option>
                      <option value="7">7</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Academic Year</label>
                    <input
                      type="text"
                      name="year"
                      value={editFormData.year || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Role</label>
                    <input
                      type="text"
                      name="role"
                      value={editFormData.role || 'student'}
                      className="w-full p-2 border rounded bg-gray-100"
                      disabled // Role is fixed to "student"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Deleted Status</label>
                    <input
                      type="text"
                      value={editFormData.isDeleted ? 'Deleted' : 'Active'}
                      className="w-full p-2 border rounded bg-gray-100"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Reset Password</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="password"
                        name="newPassword"
                        placeholder="New password (leave blank to keep current)"
                        value={editFormData.newPassword || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Student ID</p>
                  <p className="font-medium">{student.studentId || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Student Name</p>
                  <p className="font-medium">{student.studentName || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium">{student.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Semester</p>
                  <p className="font-medium">{student.semester || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Academic Year</p>
                  <p className="font-medium">{student.year || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Role</p>
                  <p className="font-medium">{student.role || 'student'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-medium">{student.isDeleted ? 'Deleted' : 'Active'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Created At</p>
                  <p className="font-medium">
                    {student.createdAt ? new Date(student.createdAt).toLocaleString() : 'Not available'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Updated At</p>
                  <p className="font-medium">
                    {student.updatedAt ? new Date(student.updatedAt).toLocaleString() : 'Not available'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagementPage;