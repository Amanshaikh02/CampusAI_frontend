import api from './api';

export const assignmentService = {
  // Get assignments with optional filters (department, class, subject, status, facultyId, teacherUsername)
  async getAssignments(filters = {}) {
    const response = await api.get('/assignments', { params: filters });
    return response.data.data;
  },

  // Student: Get teachers list with active assignment counts (Teacher-first view)
  async getTeachers() {
    const response = await api.get('/assignments/teachers');
    return response.data.data;
  },

  // Get single assignment by ID
  async getAssignmentById(id) {
    const response = await api.get(`/assignments/${id}`);
    return response.data.data;
  },

  // Create new assignment (Faculty / Admin)
  async createAssignment(assignmentData) {
    const response = await api.post('/assignments', assignmentData);
    return response.data.data;
  },

  // Update assignment (Faculty / Admin)
  async updateAssignment(id, assignmentData) {
    const response = await api.put(`/assignments/${id}`, assignmentData);
    return response.data.data;
  },

  // Delete assignment (Faculty / Admin)
  async deleteAssignment(id, force = false) {
    const response = await api.delete(`/assignments/${id}`, { params: { force } });
    return response.data;
  },

  // Submit student answers for an assignment
  async submitAssignment(id, submissionData) {
    const response = await api.post(`/assignments/${id}/submit`, submissionData);
    return response.data;
  },

  // Get current logged-in student's submission
  async getMySubmission(id) {
    const response = await api.get(`/assignments/${id}/my-submission`);
    return response.data.data;
  },

  // Get all submissions & student roster for an assignment (Faculty / Admin)
  async getAssignmentSubmissions(id) {
    const response = await api.get(`/assignments/${id}/submissions`);
    return response.data;
  },

  // Faculty / Admin: Review submission and award marks / feedback
  async reviewSubmission(submissionId, reviewData) {
    const response = await api.put(`/assignments/submissions/${submissionId}/review`, reviewData);
    return response.data;
  },

  // Backward compatibility alias for toggle
  async toggleSubmission(id, enrollment) {
    const response = await api.post(`/assignments/${id}/submit`, { enrollment, answers: 'Marked as completed.' });
    return response.data;
  }
};

export default assignmentService;
