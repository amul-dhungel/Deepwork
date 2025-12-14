import { apiClient } from '@/lib/axios';

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
