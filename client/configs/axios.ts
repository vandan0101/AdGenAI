import axios from 'axios';

const baseUrl = ((import.meta as any).env && (import.meta as any).env.VITE_BASEURL) || 'http://localhost:5000';

const api = axios.create({
  baseURL: baseUrl,
});

export default api;