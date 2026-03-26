import api from './api';

export const ingredientApi = {
    /**
     * Scan ingredients from image (OCR)
     */
    async scanFromImage(imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const response = await api.post('/api/ingredients/ocr', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * Scan ingredients from text
     */
    async scanFromText(ingredientsText) {
        const response = await api.post('/api/ingredients/scan', { ingredients_text: ingredientsText });
        return response.data;
    }
};
