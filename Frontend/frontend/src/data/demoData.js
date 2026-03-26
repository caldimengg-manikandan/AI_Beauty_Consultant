/**
 * Demo Mode Configuration
 * Pre-loaded sample analysis results for instant demo experience
 */

export const demoAnalysisResults = [
    {
        id: 'demo-1',
        name: 'Oval Face - Female',
        description: 'Professional woman with clear skin',
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        result: {
            faceShape: 'Oval',
            faceShapeConfidence: 0.94,
            gender: 'Female',
            skinScores: {
                acne: 0.15,
                pigmentation: 0.22,
                dryness: 0.18,
                overall_health: 0.85
            },
            colorAnalysis: {
                dominant_color: [220, 180, 165],
                undertone: 'warm',
                season: 'Spring'
            },
            recommendations: [
                '**Hairstyle:** Long layers will enhance your natural balance and complement your oval face shape perfectly.',
                '**Skincare:** Focus on hydration with hyaluronic acid serums to maintain your healthy glow.',
                '**Makeup:** Warm-toned bronzers and peachy blushes will complement your spring complexion beautifully.'
            ],
            annotatedImageUrl: null
        }
    },
    {
        id: 'demo-2',
        name: 'Round Face - Female',
        description: 'Young woman with vibrant skin',
        imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
        result: {
            faceShape: 'Round',
            faceShapeConfidence: 0.91,
            gender: 'Female',
            skinScores: {
                acne: 0.25,
                pigmentation: 0.12,
                dryness: 0.20,
                overall_health: 0.82
            },
            colorAnalysis: {
                dominant_color: [235, 195, 180],
                undertone: 'cool',
                season: 'Summer'
            },
            recommendations: [
                '**Hairstyle:** Side-swept bangs and angular cuts will add definition to your round face beautifully.',
                '**Skincare:** Incorporate salicylic acid to target minor breakouts and maintain clear, healthy skin.',
                '**Makeup:** Cool-toned contour along cheekbones will create beautiful definition and structure.'
            ],
            annotatedImageUrl: null
        }
    },
    {
        id: 'demo-3',
        name: 'Square Face - Male',
        description: 'Professional man with strong features',
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        result: {
            faceShape: 'Square',
            faceShapeConfidence: 0.93,
            gender: 'Male',
            skinScores: {
                acne: 0.10,
                pigmentation: 0.15,
                dryness: 0.30,
                overall_health: 0.80
            },
            colorAnalysis: {
                dominant_color: [210, 170, 155],
                undertone: 'neutral',
                season: 'Autumn'
            },
            recommendations: [
                '**Hairstyle:** A textured crop or side part will complement your strong jawline perfectly.',
                '**Grooming:** Combat dryness with a rich moisturizer and weekly exfoliation for smooth skin.',
                '**Style:** Autumn colors like olive, burgundy, and camel will enhance your natural tones.'
            ],
            annotatedImageUrl: null
        }
    },
    {
        id: 'demo-4',
        name: 'Heart Face - Female',
        description: 'Elegant woman with delicate features',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
        result: {
            faceShape: 'Heart',
            faceShapeConfidence: 0.89,
            gender: 'Female',
            skinScores: {
                acne: 0.08,
                pigmentation: 0.18,
                dryness: 0.15,
                overall_health: 0.88
            },
            colorAnalysis: {
                dominant_color: [240, 205, 195],
                undertone: 'cool',
                season: 'Winter'
            },
            recommendations: [
                '**Hairstyle:** A chin-length bob will balance your wider forehead and narrow chin beautifully.',
                '**Skincare:** Vitamin C serums will help even out minor pigmentation for radiant, glowing skin.',
                '**Makeup:** Winter complexions shine with bold berry and wine-colored lips - stunning!'
            ],
            annotatedImageUrl: null
        }
    }
];

/**
 * Get a random demo result
 */
export const getRandomDemoResult = () => {
    const randomIndex = Math.floor(Math.random() * demoAnalysisResults.length);
    return demoAnalysisResults[randomIndex];
};

/**
 * Get demo result by ID
 */
export const getDemoResultById = (id) => {
    return demoAnalysisResults.find(demo => demo.id === id);
};

/**
 * Get all demo options for selection
 */
export const getDemoOptions = () => {
    return demoAnalysisResults.map(demo => ({
        id: demo.id,
        name: demo.name,
        description: demo.description,
        imageUrl: demo.imageUrl
    }));
};
