import api from "./api";

const BASE_URL = "/admin/gift-articles";

const giftArticleService = {
  getGiftArticles: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getGiftArticleById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  createGiftArticle: async (data) => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  updateGiftArticle: async (id, data) => {
    const response = await api.patch(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  changeStatus: async (id, status) => {
    const response = await api.patch(`${BASE_URL}/${id}/status`, { status });
    return response.data;
  },
};

export default giftArticleService;
