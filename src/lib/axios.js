import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create an axios instance with default config
export const apiClient = axios.create({
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
