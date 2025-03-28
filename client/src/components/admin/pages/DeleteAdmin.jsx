import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Trash2, RefreshCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteAdmin = () => {
  const [adminId, setAdminId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('delete');
  const navigate = useNavigate();

  const handleAdminAction = async (e, action) => {
    e.preventDefault();
    
    // Basic validation
    if (!adminId) {
      toast.error('Please enter an admin ID');
      return;
    }

    // Confirm action
    const confirmMessage = action === 'delete'
      ? 'Are you sure you want to soft delete this admin? This action can be reversed later.'
      : 'Are you sure you want to restore this admin account?';
    
    const confirmAction = window.confirm(confirmMessage);
    if (!confirmAction) return;

    try {
      setIsLoading(true);
      
      // Get the auth token from local storage
      const token = localStorage.getItem('token');
      
      // Determine API endpoint and method based on action
      const apiConfig = action === 'delete'
        ? {
            url: `/api/admin/${adminId}`,
            method: 'delete',
            successMessage: 'Admin soft deleted successfully'
          }
        : {
            url: `/api/admin/restore/${adminId}`,
            method: 'patch',
            successMessage: 'Admin restored successfully'
          };

      // Make API call
      const response = await axios({
        method: apiConfig.method,
        url: apiConfig.url,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Success handling
      if (response.data.success) {
        toast.success(apiConfig.successMessage);
        navigate('/admin-list'); // Redirect to admin list page
      }
    } catch (error) {
      // Error handling
      const errorMessage = error.response?.data?.message || `Failed to ${action} admin`;
      toast.error(errorMessage);
      console.error(`${action} admin error:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4 py-12"
    >
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl border border-gray-200"
      >
        {/* Tab Navigation with Motion */}
        <motion.div 
          className="flex mb-4 bg-gray-100 rounded-full p-1"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {['delete', 'restore'].map((tab) => (
            <button
              key={tab}
              className={`w-1/2 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-in-out ${
                activeTab === tab 
                  ? (tab === 'delete' 
                      ? 'bg-red-500 text-white shadow-lg' 
                      : 'bg-green-500 text-white shadow-lg')
                  : 'bg-transparent text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'delete' ? 'Delete Admin' : 'Restore Admin'}
            </button>
          ))}
        </motion.div>

        {/* Page Title and Description with Animation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-center text-3xl font-extrabold text-gray-900 flex justify-center items-center">
            {activeTab === 'delete' 
              ? <><Trash2 className="mr-2 text-red-500" /> Delete Admin</> 
              : <><RefreshCcw className="mr-2 text-green-500" /> Restore Admin</>}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {activeTab === 'delete' 
              ? 'Soft delete an admin account' 
              : 'Restore a previously soft-deleted admin account'}
          </p>
        </motion.div>

        {/* Action Form with Animated Input */}
        <motion.form 
          className="mt-8 space-y-6" 
          onSubmit={(e) => handleAdminAction(e, activeTab)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div 
            className="rounded-md shadow-sm"
            whileFocus={{ scale: 1.02 }}
          >
            <input
              id="adminId"
              name="adminId"
              type="text"
              required
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ease-in-out"
              placeholder="Enter Admin ID"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
            />
          </motion.div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-300 ease-in-out ${
              isLoading 
                ? 'bg-gray-500 cursor-not-allowed' 
                : activeTab === 'delete'
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500'
                  : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              <>
                {activeTab === 'delete' 
                  ? <><Trash2 className="mr-2" /> Delete Admin</> 
                  : <><RefreshCcw className="mr-2" /> Restore Admin</>}
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Additional Information with Animated Note */}
        <AnimatePresence>
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <p className="mt-2 text-sm text-gray-600 flex items-center justify-center">
              {activeTab === 'delete' ? (
                <>
                  <AlertTriangle className="mr-2 text-yellow-500" />
                  <span>
                    <span className="font-medium text-red-600">Note:</span> Soft 
                    deletion means the admin account will be marked as deleted but 
                    can be restored later.
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 text-green-500" />
                  <span>
                    <span className="font-medium text-green-600">Note:</span> This 
                    will reactivate a previously soft-deleted admin account.
                  </span>
                </>
              )}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default DeleteAdmin;