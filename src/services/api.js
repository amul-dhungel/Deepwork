import axios from 'axios';

const API_BASE_URL = '/api';

// Create an axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Session ID to every request
apiClient.interceptors.request.use(
    (config) => {
        const sessionId = localStorage.getItem('word_ai_session_id');
        if (sessionId) {
            config.headers['X-Session-ID'] = sessionId;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const uploadFiles = async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    // Let axios handle the Content-Type header for FormData, 
    // but we still need the session ID interceptor to work.
    // Note: axios automatically removes 'Content-Type': 'application/json' 
    // when data is FormData.
    const response = await apiClient.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const generateContent = async (payload) => {
    const response = await apiClient.post('/generate', payload);
    return response.data;
};

export const chatWithAgent = async (message) => {
    const response = await apiClient.post('/chat', { message });
    return response.data;
};

export const checkHealth = async () => {
    const response = await apiClient.get('/health');
    return response.data;
}
