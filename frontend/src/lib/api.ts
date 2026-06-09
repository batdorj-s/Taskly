// frontend/src/lib/api.ts
import axios from 'axios';

// FastAPI backend-ийн үндсэн хаяг
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://todoapi-nu-six.vercel.app';

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
