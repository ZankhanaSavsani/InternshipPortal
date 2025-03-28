import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const DownloadPage = () => {
  const [selectedModel, setSelectedModel] = useState('student');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const models = [
    { value: 'student', label: 'Students' },
    { value: 'admin', label: 'Admins' },
    { value: 'guide', label: 'Guides' },
    { value: 'tokenBlacklist', label: 'Token Blacklist' },
    { value: 'companyApprovalDetails', label: 'Company Approval Details' },
    { value: 'summerInternshipStatus', label: 'Summer Internship Status' },
    { value: 'summerInternshipCompletionStatus', label: 'Summer Internship Completion' },
    { value: 'weeklyReport', label: 'Weekly Reports' },
  ];

  const handleDownload = async (e) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios({
        url: `/api/download/${selectedModel}?startDate=${startDate}&endDate=${endDate}`,
        method: 'GET',
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedModel}_data_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Download started successfully!');
    } catch (error) {
      console.error('Download error:', error);
      
      if (error.response && error.response.data) {
        // For blob response, we need to read it as text
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            setError(errorData.error || 'Failed to download data');
          } catch (e) {
            setError('Failed to download data');
          }
        };
        reader.readAsText(error.response.data);
      } else {
        setError('Network error. Please try again.');
      }
      
      toast.error('Download failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Download Data</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}
        
        <form onSubmit={handleDownload} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                Select Data Type
              </label>
              <select
                id="model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {models.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  min={startDate}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Download Excel'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Instructions</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>Select the type of data you wish to download</li>
            <li>Choose a date range (data will be filtered by creation date)</li>
            <li>Click "Download Excel" to generate and download the file</li>
            <li>Large date ranges may take longer to process</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;