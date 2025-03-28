import React, { useEffect, useState, useRef } from "react";
import { getAllGuideAllocations, deleteGuideAllocation } from "../../../api/index";
import { Search, Trash2, AlertTriangle } from "lucide-react";

const GuideAllocationList = () => {
  const [allocations, setAllocations] = useState([]);
  const [filteredAllocations, setFilteredAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const printRef = useRef();
  
  // Search state
  const [guideSearch, setGuideSearch] = useState('');
  const [rangeSearch, setRangeSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const fetchAllocations = async () => {
      setLoading(true);
      try {
        const response = await getAllGuideAllocations();
        setAllocations(response.data || []);
        setFilteredAllocations(response.data || []);
        setError(null);
      } catch (error) {
        console.error("Error fetching allocations:", error);
        setError("Failed to load guide allocations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllocations();
  }, []);

  // Filter allocations based on search criteria
  useEffect(() => {
    if (allocations.length === 0) return;
    
    const results = allocations.filter(allocation => {
      const guideName = allocation.guide?.guideName?.toLowerCase() || '';
      const email = allocation.guide?.email?.toLowerCase() || '';
      const range = allocation.range?.toLowerCase() || '';
      const semester = allocation.semester?.toString() || '';
      
      const matchesGuide = guideSearch === '' || 
        guideName.includes(guideSearch.toLowerCase()) || 
        email.includes(guideSearch.toLowerCase());
        
      const matchesRange = rangeSearch === '' || 
        range.includes(rangeSearch.toLowerCase());
        
      const matchesSemester = semesterFilter === '' || 
        semester === semesterFilter;
      
      return matchesGuide && matchesRange && matchesSemester;
    });
    
    setFilteredAllocations(results);
  }, [guideSearch, rangeSearch, semesterFilter, allocations]);

  // Handle allocation deletion
  const handleDelete = async (allocation) => {
    // Open confirmation dialog
    setConfirmDelete(allocation);
  };

  // Confirm deletion
  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    
    setDeleteLoading(true);
    setDeleteError(null);
    setDeleteSuccess(null);
    
    try {
      const response = await deleteGuideAllocation({
        range: confirmDelete.range,
        semester: confirmDelete.semester
      });
      
      // Remove the deleted allocation from state
      const updatedAllocations = allocations.filter(a => 
        a.range !== confirmDelete.range || a.semester !== confirmDelete.semester
      );
      
      setAllocations(updatedAllocations);
      setFilteredAllocations(filteredAllocations.filter(a => 
        a.range !== confirmDelete.range || a.semester !== confirmDelete.semester
      ));
      
      setDeleteSuccess(`Successfully deleted allocation for ${confirmDelete.range} in semester ${confirmDelete.semester}`);
      
      // Clear confirmation after 3 seconds
      setTimeout(() => {
        setDeleteSuccess(null);
      }, 3000);
    } catch (error) {
      console.error("Error deleting allocation:", error);
      setDeleteError(`Failed to delete allocation: ${error.response?.data?.message || error.message}`);
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setDeleteError(null);
      }, 3000);
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(null);
    }
  };

  // Function to export data to CSV
  const exportToCSV = () => {
    if (filteredAllocations.length === 0) return;
    
    // Define CSV headers
    const headers = ["S.No", "Guide Name", "Guide Email", "Student Range", "Semester", "Created Date"];
    
    // Map data to CSV rows
    const data = filteredAllocations.map((allocation, index) => [
      index + 1,
      allocation.guide?.guideName || "Unknown",
      allocation.guide?.email || "No Email",
      allocation.range,
      allocation.semester,
      new Date(allocation.createdAt).toLocaleDateString()
    ]);
    
    // Combine headers and data
    const csvContent = [
      headers.join(","),
      ...data.map(row => row.join(","))
    ].join("\n");
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `guide_allocations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle print view
  const handlePrint = () => {
    const printContent = document.getElementById('printArea');
    const originalContents = document.body.innerHTML;
    
    // Create a styled print version
    const printStyles = `
      <style>
        body { font-family: Arial, sans-serif; }
        h1 { color: #1e40af; text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #e5e7eb; color: #4b5563; font-weight: bold; text-align: left; padding: 10px; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .print-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .print-date { text-align: right; color: #6b7280; }
        .print-footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Guide Allocations - Print View</title>
          ${printStyles}
        </head>
        <body>
          <div class="print-header">
            <h1>Guide Allocations</h1>
            <div class="print-date">Generated: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Guide Name</th>
                <th>Student Range</th>
                <th>Semester</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAllocations.map((allocation, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${allocation.guide?.guideName || "Unknown"}</td>
                  <td>${allocation.range}</td>
                  <td>Semester ${allocation.semester}</td>
                  <td>${new Date(allocation.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="print-footer">
            <p>© ${new Date().getFullYear()} Guide Allocation System. All rights reserved.</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Add slight delay to ensure content is fully loaded
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Function to reset all filters
  const resetFilters = () => {
    setGuideSearch('');
    setRangeSearch('');
    setSemesterFilter('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-12 h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading allocations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded shadow-md" role="alert">
        <div className="flex">
          <div className="py-1">
            <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-red-500 mb-4">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
            </div>
            <p className="mb-4">
              Are you sure you want to delete the guide allocation for:<br/>
              <span className="font-semibold">Range: {confirmDelete.range}</span><br/>
              <span className="font-semibold">Semester: {confirmDelete.semester}</span>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This will delete the guide allocation and all related student internships.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {deleteSuccess && (
        <div className="max-w-4xl mx-auto mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md transition-opacity" role="alert">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Success</p>
              <p className="text-sm">{deleteSuccess}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {deleteError && (
        <div className="max-w-4xl mx-auto mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md transition-opacity" role="alert">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Error</p>
              <p className="text-sm">{deleteError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Guide Allocations</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
              {filteredAllocations.length} of {allocations.length} {allocations.length === 1 ? 'Entry' : 'Entries'}
            </span>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by guide name or email..."
                  value={guideSearch}
                  onChange={(e) => setGuideSearch(e.target.value)}
                  className="pl-8 w-full rounded-md border border-gray-300 py-2 px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by student range..."
                value={rangeSearch}
                onChange={(e) => setRangeSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
              {['', '5', '7'].map((semester) => (
                <button
                  key={semester}
                  onClick={() => setSemesterFilter(semester)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    semesterFilter === semester
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {semester || 'All Semesters'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Reset Filters Button */}
          {(guideSearch || rangeSearch || semesterFilter) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
        
        <div className="p-6" id="printArea" ref={printRef}>
          {filteredAllocations.length > 0 ? (
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guide Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Range</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAllocations.map((allocation, index) => (
                    <tr key={allocation._id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-medium text-sm">
                              {allocation.guide?.guideName ? allocation.guide.guideName.charAt(0).toUpperCase() : "?"}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{allocation.guide?.guideName || "Unknown"}</div>
                            <div className="text-xs text-gray-500">{allocation.guide?.email || "No Email"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{allocation.range}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Semester {allocation.semester}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(allocation.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(allocation.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(allocation)}
                          className="text-red-600 hover:text-red-900 focus:outline-none focus:underline transition duration-150 flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-5 rounded-md flex items-center" role="alert">
              <svg className="h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">No guide allocations found.</p>
                <p className="text-sm mt-1">
                  {allocations.length > 0 
                    ? "Try changing your search filters to find what you're looking for." 
                    : "There are currently no guide allocations in the system."}
                </p>
              </div>
            </div>
          )}

          {filteredAllocations.length > 0 && (
            <div className="mt-4 text-right">
              <button 
                onClick={exportToCSV}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 mr-2 flex items-center inline-flex"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Export to CSV
              </button>
              <button 
                onClick={handlePrint}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-200 flex items-center inline-flex"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                </svg>
                Print View
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuideAllocationList;