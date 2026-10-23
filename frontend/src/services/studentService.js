import api from './api';

export const studentService = {
  // Get all students with optional filters (department, semester, division, search)
  async getStudents(filters = {}) {
    const response = await api.get('/students', { params: filters });
    return response.data.data || response.data.students || response.data;
  },

  // Get student by ID
  async getStudentById(id) {
    const response = await api.get(`/students/${id}`);
    return response.data.data || response.data;
  },

  // Create new student
  async createStudent(studentData) {
    const response = await api.post('/students', studentData);
    return response.data.data || response.data;
  },

  // Update student by ID
  async updateStudent(id, studentData) {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data.data || response.data;
  },

  // Delete student by ID
  async deleteStudent(id) {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  }
};

export default studentService;
