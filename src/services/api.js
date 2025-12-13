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

// Generate detailed summary for a specific document
export const generateSummary = async (filename, modelProvider = 'gemini') => {
    try {
        // Use apiClient which automatically handles X-Session-ID via interceptor
        const response = await apiClient.post('/summarize', { filename, modelProvider });
        return response.data.summary;
    } catch (error) {
        console.error('Summary API Error:', error);
        // Extract error message from axios response if available
        const errMsg = error.response?.data?.error || error.message || 'Summary generation failed';
        throw new Error(errMsg);
    }
};

export const refineText = async (text, instruction, modelProvider = 'gemini') => {
    try {
        const response = await apiClient.post('/refine', { text, instruction, modelProvider });
        return response.data;
    } catch (error) {
        console.error('Refine API Error:', error);
        throw error;
    }
};

export const generateContent = async (payload) => {
    const response = await apiClient.post('/generate', payload);
    return response.data;
};

export const chatWithAgent = async (message, modelProvider = 'gemini') => {
    const response = await apiClient.post('/chat', { message, modelProvider });
    return response.data;
};

export const checkHealth = async () => {
    const response = await apiClient.get('/health');
    return response.data;
}

export const getModelStatus = async () => {
    try {
        const response = await apiClient.get('/models/status');
        return response.data;
    } catch (error) {
        console.error("Failed to fetch model status", error);
        return {};
    }
};
