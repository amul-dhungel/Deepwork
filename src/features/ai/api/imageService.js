/**
 * Frontend service for image generation API
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function generateCardImage(prompt, style = 'digital-art') {
    try {
        const response = await fetch(`${API_BASE}/api/generate_card_image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                style
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Image generation failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Image generation error:', error);
        throw error;
    }
}
