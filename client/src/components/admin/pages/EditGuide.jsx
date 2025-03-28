import React, { useState } from 'react';
import axios from 'axios';
import {
  UserPlus,
  CheckCircle,
  AlertCircle,
  Loader,
  Search,
  Edit,
  Trash2,
  RotateCcw,
  Save,
  X,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../../layouts/AuthProvider";
import { useNavigate } from 'react-router-dom';

const GuideManagementPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [guide, setGuide] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    username: '',
    guideName: '',
    email: '',
    newPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showRestoreConfirmation, setShowRestoreConfirmation] = useState(false);

  // Reusable API config with timeout
  const getApiConfig = () => ({
    withCredentials: true,
    timeout: 10000, // 10 seconds timeout
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user?.token}`
    }
  });

  // Search guide by email
  const handleSearch = async (e) => {
    e.preventDefault();
    resetState();
    setGuide(null);
    setShowDeleteConfirmation(false);
    setShowRestoreConfirmation(false);

    if (!isAuthenticated) {
      setError("You must be logged in to search for guides.");
      return;
    }

    if (user.role !== 'admin') {
      setError("You don't have permission to search guides.");
      return;
    }

    if (!searchTerm) {
      setError('Please enter Guide Email');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_BASEURL}/api/guide/fetch/by-email`,
        {
          params: { email: searchTerm },
          ...getApiConfig()
        }
      );

      if (response.data.success) {
        setGuide(response.data.data);
        setEditFormData({
          ...response.data.data,
          newPassword: ''
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch guide');
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // Update guide information
  const handleUpdate = async (e) => {
    e.preventDefault();
    resetState();

    if (!isAuthenticated) {
      setError("You must be logged in to update guide information.");
      return;
    }

    if (user.role !== 'admin') {
      setError("You don't have permission to update guides.");
      return;
    }

    try {
      setIsSubmitting(true);
      const updateData = {
        username: editFormData.username,
        guideName: editFormData.guideName,
        email: editFormData.email
      };

      if (editFormData.newPassword) {
        if (editFormData.newPassword.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        updateData.password = editFormData.newPassword;
      }

      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_BASEURL}/api/guide/${guide._id}`,
        updateData,
        getApiConfig()
      );

      if (response.data.success) {
        setGuide(response.data.data);
        setIsEditing(false);
        setSuccessMessage('Guide updated successfully');
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soft delete guide
  const handleDelete = async () => {
    resetState();

    try {
      setIsSubmitting(true);
      const response = await axios.delete(
        `${process.env.REACT_APP_BACKEND_BASEURL}/api/guide/${guide._id}`,
        getApiConfig()
      );

      if (response.data.success) {
        setSuccessMessage('Guide deleted successfully');
        setGuide({
          ...guide,
          isDeleted: true,
          deletedAt: new Date()
        });
        setShowDeleteConfirmation(false);
      } else {
        throw new Error(response.data.message || 'Deletion failed');
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restore soft-deleted guide
  const handleRestore = async () => {
    resetState();
    setShowRestoreConfirmation(false);
  
    if (!isAuthenticated) {
      setError("You must be logged in to restore guides.");
      return;
    }
  
    if (user.role !== 'admin') {
      setError("You don't have permission to restore guides.");
      return;
    }
  
    try {
      setIsSubmitting(true);
      
      const response = await axios.patch(
        `${process.env.REACT_APP_BACKEND_BASEURL}/api/guide/restore/${guide._id}`,
        {},
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setGuide({
          ...response.data.data,
          isDeleted: false,
          deletedAt: null
        });
        setSuccessMessage(response.data.message || 'Guide restored successfully');
      } else {
        throw new Error(response.data.message || 'Restoration failed');
      }
    } catch (err) {
      console.error('Restore error details:', {
        error: err,
        response: err.response,
        request: err.request
      });
  
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (err.response) {
        // Server responded with error status
        switch (err.response.status) {
          case 401:
            setError('Session expired. Please login again.');
            navigate('/login');
            break;
          case 403:
            setError('You do not have permission to perform this action.');
            break;
          case 404:
            setError('Guide not found');
            break;
          case 400:
            setError(err.response.data.message || 'Invalid request');
            break;
          default:
            setError(err.response.data.message || 'Request failed');
        }
      } else if (err.request) {
        // Request was made but no response received
        setError('Server not responding. Please check:');
        setError(prev => `${prev}\n- Is the backend server running?`);
        setError(prev => `${prev}\n- Is the URL correct? (${process.env.REACT_APP_BACKEND_BASEURL})`);
        setError(prev => `${prev}\n- Are there CORS issues?`);
      } else {
        // Other errors
        setError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const resetState = () => {
    setError('');
    setSuccessMessage('');
  };

  const handleApiError = (err) => {
    console.error('API Error:', err);
    
    if (err.response) {
      switch (err.response.status) {
        case 401:
          setError('Session expired. Please login again.');
          navigate('/login');
          break;
        case 403:
          setError('You do not have permission to perform this action.');
          break;
        case 404:
          setError(err.response.data.message || 'Guide not found');
          break;
        case 400:
          setError(err.response.data.message || 'Invalid request');
          break;
        default:
          setError(err.response.data.message || 'Request failed');
      }
    } else if (err.request) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else {
        setError('No response received from server. Please check your connection.');
      }
    } else {
      setError(err.message || 'An error occurred');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      ...guide,
      newPassword: ''
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-6 text-blue-600">
            <UserPlus className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Authentication Required
          </h2>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Guide Management</h1>

      {/* Search Form */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter Guide Email"
            className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader className="animate-spin" size={18} /> : <Search size={18} />}
            Search
          </button>
        </form>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-4">
            <Loader className="h-6 w-6 text-blue-600 animate-spin" />
            <p className="text-lg font-medium">Processing...</p>
          </div>
        </div>
      )}

      {/* Guide Details */}
      {guide && (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden ${
          guide.isDeleted ? 'border-l-4 border-red-500' : ''
        }`}>
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Guide Details
              {guide.isDeleted && (
                <span className="ml-2 text-sm font-normal text-red-600">
                  (Deleted)
                </span>
              )}
            </h2>
            <div className="flex gap-2">
              {!isEditing && !guide.isDeleted && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
              )}
              {!guide.isDeleted ? (
                <button
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              ) : (
                <button
                  onClick={() => setShowRestoreConfirmation(true)}
                  className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                  title="Restore"
                >
                  <RotateCcw size={18} />
                </button>
              )}
            </div>
          </div>

          {isEditing && !guide.isDeleted ? (
            <form onSubmit={handleUpdate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={editFormData.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guide Name</label>
                  <input
                    type="text"
                    name="guideName"
                    value={editFormData.guideName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={editFormData.newPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Leave blank to keep current"
                  />
                  {editFormData.newPassword && editFormData.newPassword.length < 8 && (
                    <p className="text-red-500 text-sm mt-1">
                      Password must be at least 8 characters
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X size={18} className="inline mr-1" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting || (editFormData.newPassword && editFormData.newPassword.length < 8)}
                >
                  <Save size={18} className="inline mr-1" />
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Username</p>
                  <p className="mt-1 text-sm text-gray-900">{guide.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Guide Name</p>
                  <p className="mt-1 text-sm text-gray-900">{guide.guideName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-sm text-gray-900">{guide.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      guide.isDeleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {guide.isDeleted ? 'Deleted' : 'Active'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created At</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(guide.createdAt).toLocaleString()}
                  </p>
                </div>
                {guide.isDeleted && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Deleted At</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(guide.deletedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              {guide.isDeleted && (
                <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        This guide has been deleted. You can restore them to make them active again.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-semibold">Confirm Deletion</h2>
            </div>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete the guide <span className="font-semibold">{guide?.guideName}</span> (Username: {guide?.username})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <RotateCcw className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-semibold">Confirm Restoration</h2>
            </div>
            <p className="mb-6 text-gray-700">
              Are you sure you want to restore guide <span className="font-semibold">{guide?.guideName}</span> (Username: {guide?.username})?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRestoreConfirmation(false)}
                className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Restoring...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideManagementPage;