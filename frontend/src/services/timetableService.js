import api from './api';

export const timetableService = {
  // Get timetable slots with optional filters (department, semester, division, day)
  async getEntries(filters = {}) {
    const cleanParams = {};
    Object.keys(filters).forEach((key) => {
      const val = filters[key];
      if (val !== undefined && val !== null && String(val).trim() !== '' && String(val) !== 'All') {
        cleanParams[key] = String(val).trim();
      }
    });

    const response = await api.get('/timetable/entries', { params: cleanParams });
    return response.data.data;
  },

  // Create new timetable slot
  async createEntry(entryData) {
    const response = await api.post('/timetable/entries', entryData);
    return response.data.data;
  },

  // Update an existing timetable slot
  async updateEntry(id, entryData) {
    const response = await api.put(`/timetable/entries/${id}`, entryData);
    return response.data.data;
  },

  // Delete timetable slot
  async deleteEntry(id) {
    const response = await api.delete(`/timetable/entries/${id}`);
    return response.data;
  },

  // Send / Publish complete timetable
  async sendTimetable(sendData) {
    const response = await api.post('/timetable/send', sendData);
    return response.data.data;
  },

  // Get current student/faculty timetable (supports department, semester, division, role)
  async getMyTimetable(department, role, extraParams = {}) {
    const params = { department, role };
    if (extraParams.semester && extraParams.semester !== 'All') {
      params.semester = extraParams.semester;
    }
    if (extraParams.division && extraParams.division !== 'All') {
      params.division = extraParams.division;
    }
    if (extraParams.facultyName) {
      params.facultyName = extraParams.facultyName;
    }
    if (extraParams.username) {
      params.username = extraParams.username;
    }

    const response = await api.get('/timetable/my-timetable', { params });
    return response.data.data;
  },

  // Get all sent timetable history
  async getSentHistory() {
    const response = await api.get('/timetable/sent-history');
    return response.data.data;
  }
};

export default timetableService;
