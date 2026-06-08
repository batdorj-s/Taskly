// src/lib/api.ts
import axios from 'axios';

// FastAPI backend-ийн үндсэн хаяг
const API_URL = 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_URL,
});

// Request явуулах бүрт localStorage-оос token байгаа эсэхийг шалгаж, 
// байвал Header-т нь "Authorization: Bearer {token}" гэж нэмэх логик
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
