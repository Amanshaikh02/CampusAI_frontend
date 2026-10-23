import api from './api';

export const facultyService = {
  // Get all faculty with optional filters (department, search)
  async getFaculty(filters = {}) {
    const response = await api.get('/faculty', { params: filters });
    return response.data.data || response.data;
  },

  // Get faculty by ID
  async getFacultyById(id) {
    const response = await api.get(`/faculty/${id}`);
    return response.data.data || response.data;
  },

  // Create new faculty
  async createFaculty(facultyData) {
    const response = await api.post('/faculty', facultyData);
    return response.data.data || response.data;
  },

  // Update faculty by ID
  async updateFaculty(id, facultyData) {
    const response = await api.put(`/faculty/${id}`, facultyData);
    return response.data.data || response.data;
  },

  // Delete faculty by ID
  async deleteFaculty(id) {
    const response = await api.delete(`/faculty/${id}`);
    return response.data;
  }
};

export default facultyService;
