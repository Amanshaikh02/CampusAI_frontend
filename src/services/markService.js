import api from './api';

export const markService = {
  // Get marks with optional filters (enrollment, student, subject, exam, department)
  async getMarks(filters = {}) {
    const response = await api.get('/marks', { params: filters });
    return response.data.data;
  },

  // Create new mark record
  async createMark(markData) {
    const response = await api.post('/marks', markData);
    return response.data.data;
  },

  // Delete mark record
  async deleteMark(id) {
    const response = await api.delete(`/marks/${id}`);
    return response.data;
  },

  // Bulk save marks for student roster
  async bulkSaveMarks(bulkData) {
    const response = await api.post('/marks/bulk', bulkData);
    return response.data;
  },

  // Send marksheet report email to Department / HOD via Nodemailer
  async sendMarksheetEmail(emailData) {
    const response = await api.post('/marks/send-email', emailData);
    return response.data;
  }
};

export default markService;
