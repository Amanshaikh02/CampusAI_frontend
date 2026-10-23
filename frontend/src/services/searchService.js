import api from './api';

/**
 * Searches students or faculty with dynamic query parameters and filters
 * @param {Object} params - { role, q, name, enrollment, sem, div, dept, subject }
 * @returns {Promise<Object>} Search response containing { success, count, role, filters, data }
 */
export const searchDirectory = async (params = {}) => {
  // Clean empty or whitespace-only params before sending
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    const val = params[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      cleanParams[key] = String(val).trim();
    }
  });

  const response = await api.get('/search', { params: cleanParams });
  return response.data;
};

export const getStudentInsights = async () => {
  const response = await api.get('/search/student-insights');
  return response.data;
};

const searchService = {
  searchDirectory,
  getStudentInsights
};

export default searchService;

