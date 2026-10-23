import api from './api';

export const attendanceService = {
  // Faculty & Admin: Get assigned subjects
  async getMySubjects() {
    const response = await api.get('/attendance/my-subjects');
    return response.data.data;
  },

  // Faculty & Admin: Get enrolled student roster for an assigned subject on a specific date
  async getSubjectRoster(assignmentId, date) {
    const response = await api.get('/attendance/roster', {
      params: { assignmentId, date }
    });
    return response.data;
  },

  // Faculty & Admin: Save or update daily attendance session
  async saveAttendanceSession(sessionData) {
    const response = await api.post('/attendance/session', sessionData);
    return response.data;
  },

  // Student: Get personal subject-wise attendance summary & daily history
  async getMyAttendance() {
    const response = await api.get('/attendance/my');
    return response.data;
  },

  // Admin: Get all academic faculty-subject mappings
  async getAllAssignments(filters = {}) {
    const response = await api.get('/attendance/assignments', { params: filters });
    return response.data.data;
  },

  // Admin: Create a new faculty-subject mapping
  async createFacultyAssignment(assignmentData) {
    const response = await api.post('/attendance/assignments', assignmentData);
    return response.data.data;
  },

  // General: Get attendance records with optional filters
  async getAttendance(filters = {}) {
    const response = await api.get('/attendance', { params: filters });
    return response.data.data;
  },

  // Create single attendance record (legacy)
  async createAttendance(recordData) {
    const response = await api.post('/attendance', recordData);
    return response.data.data;
  },

  // Delete attendance record
  async deleteAttendance(id) {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  }
};

export default attendanceService;
