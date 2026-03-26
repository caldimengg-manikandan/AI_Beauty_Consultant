import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ResultCard from '../features/analysis/ResultCard';
import { FaArrowLeft, FaUserPlus } from 'react-icons/fa';

/**
 * Public Demo Results Page
 * Shows sample analysis results without requiring authentication
 */

const DemoResultsPage = () => {
    const navigate = useNavigate();
    const [demoData, setDemoData] = useState(null);

    useEffect(() => {
        // Retrieve demo data from sessionStorage
        const storedDemo = sessionStorage.getItem('demoResult');

        if (storedDemo) {
            const parsed = JSON.parse(storedDemo);
            setDemoData(parsed);
        } else {
            // No demo data found, redirect to landing
            navigate('/');
        }
    }, [navigate]);

    if (!demoData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading demo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="flex items-center justify-between mb-6">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                    >
                        <FaArrowLeft />
                        Back to Home
                    </Link>

                    <Link
                        to="/signup"
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-teal-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                        <FaUserPlus />
                        Sign Up to Analyze Your Photo
                    </Link>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-teal-600 mb-2">
                        Sample AI Beauty Analysis
                    </h1>
                    <p className="text-gray-500 text-lg">
                        This is a demonstration of our AI-powered analysis capabilities
                    </p>
                </div>

                {/* Demo Notice Banner */}
                <div className="bg-gradient-to-r from-purple-100 to-teal-100 border-l-4 border-purple-600 p-6 rounded-lg mb-8 shadow-md">
                    <div className="flex items-start gap-4">
                        <svg className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <h3 className="font-bold text-purple-900 text-lg mb-2">🎭 Demo Mode Active</h3>
                            <p className="text-purple-800 mb-3">
                                You're viewing a <strong>sample analysis</strong> to showcase our AI capabilities.
                                This is not your personal analysis.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
                                >
                                    <FaUserPlus />
                                    Get Your Personal Analysis
                                </Link>
                                <Link
                                    to="/"
                                    className="inline-flex items-center justify-center gap-2 bg-white text-purple-600 border-2 border-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-purple-50 transition-colors"
                                >
                                    Try Another Sample
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-5xl mx-auto">
                <ResultCard
                    data={{
                        ...demoData.result,
                        faceShape: demoData.result.faceShape,
                        skinScores: demoData.result.skinScores
                    }}
                    image={demoData.imageUrl}
                    annotatedImage={demoData.result.annotatedImageUrl}
                    gender={demoData.result.gender}
                />
            </div>

            {/* Bottom CTA */}
            <div className="max-w-5xl mx-auto mt-12 text-center">
                <div className="bg-white rounded-3xl shadow-xl p-12">
                    <h2 className="text-3xl font-bold mb-4">Love What You See?</h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Get your own personalized AI beauty analysis in seconds!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/signup"
                            className="bg-gradient-to-r from-purple-600 to-teal-600 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                            Create Free Account 🚀
                        </Link>
                        <Link
                            to="/"
                            className="bg-white border-2 border-gray-300 text-gray-700 px-10 py-4 rounded-full font-bold text-lg hover:border-purple-600 hover:text-purple-600 transition-all duration-300"
                        >
                            View More Samples
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoResultsPage;
