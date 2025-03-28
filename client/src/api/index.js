// src/api/index.js
import axios from "axios";

// API function to allocate guide to a range of students
export const allocateGuide = async (range, guideId, semester) => {
  try {
    const response = await axios.post("/api/guide-allocation/allocate", {
      range,
      guideId,
      semester
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// API function to fetch all guide allocations
export const getAllGuideAllocations = async () => {
  try {
    const response = await axios.get("/api/guide-allocation/allocations");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// API function to get all guides (for dropdowns)
export const getAllGuides = async () => {
  try {
    const response = await axios.get("/api/guides");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete guide allocation
export const deleteGuideAllocation = async (data) => {
  try {
    const response = await axios.delete(
      `${process.env.REACT_APP_BACKEND_BASEURL}/api/guide-allocation/delete-guide-allocation`, 
      {
        data,  // This sends the data in the request body for DELETE requests
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('userToken')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("API Error deleting guide allocation:", error);
    throw error;
  }
};