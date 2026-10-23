import api from './api';

export const analyticsService = {
  /**
   * Fetch aggregated student performance metrics, charts data, and detailed marks
   * @param {Object} params - { enrollment?: string, subject?: string }
   */
  async getStudentPerformance(params = {}) {
    const response = await api.get('/marks/analytics/student-performance', { params });
    return response.data;
  },

  /**
   * Fetch list of subjects taught by faculty with student counts and class averages
   */
  async getFacultySubjects() {
    const response = await api.get('/marks/analytics/faculty-subjects');
    return response.data.data;
  },

  /**
   * Fetch list of students enrolled in a specific faculty subject
   * @param {string} subject - Subject name
   */
  async getFacultySubjectStudents(subject) {
    const response = await api.get('/marks/analytics/faculty-students', {
      params: { subject }
    });
    return response.data.data;
  },

  /**
   * Autocomplete search for students by name or enrollment number
   * @param {string} query - Search query
   */
  async searchStudents(query) {
    const response = await api.get('/marks/analytics/search-students', {
      params: { q: query }
    });
    return response.data.data;
  }
};

export default analyticsService;
