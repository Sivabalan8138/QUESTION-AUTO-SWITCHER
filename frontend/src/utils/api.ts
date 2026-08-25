export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

export const fetchApi = async (endpoint: string, options?: RequestInit) => {
  return fetch(`${API_URL}${endpoint}`, options);
};
