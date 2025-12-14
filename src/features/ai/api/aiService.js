import { apiClient } from '@/lib/axios';

export const refineText = async (text, instruction, modelProvider = 'gemini') => {
    try {
        const response = await apiClient.post('/refine', { text, instruction, modelProvider });
        return response.data;
    } catch (error) {
        console.error('Refine API Error:', error);
        throw error;
    }
};

export const chatWithAgent = async (message, modelProvider = 'gemini') => {
    const response = await apiClient.post('/chat', { message, modelProvider });
    return response.data;
};

export const getModelStatus = async () => {
    try {
        const response = await apiClient.get('/models/status');
        return response.data;
    } catch (error) {
        console.error("Failed to fetch model status", error);
        return {};
    }
};

export const generateContent = async (payload) => {
    const response = await apiClient.post('/generate', payload);
    return response.data;
};
