import api from './api';

export const materialService = {
  // Get all materials with optional department filter
  async getMaterials(department) {
    const response = await api.get('/materials', {
      params: department ? { department } : {}
    });
    return response.data.data;
  },

  // Create new material
  async createMaterial(materialData) {
    const response = await api.post('/materials', materialData);
    return response.data.data;
  },

  // Delete material
  async deleteMaterial(id) {
    const response = await api.delete(`/materials/${id}`);
    return response.data;
  }
};

export default materialService;
