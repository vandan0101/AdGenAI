import axios from 'axios';

const env = (import.meta as any).env || {};
const baseUrl = env.VITE_BASEURL || env.VITE_SERVER_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: baseUrl,
});

export default api;