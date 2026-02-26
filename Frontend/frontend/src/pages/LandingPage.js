import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DemoModal from '../components/DemoModal';
import { getDemoResultById } from '../data/demoData';
import LanguageSwitcher from '../components/LanguageSwitcher';

const LandingPage = () => {
    const navigate = useNavigate();
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

    // Handle demo selection - navigate to results page
    const handleDemoSelect = (demoId) => {
        const demoData = getDemoResultById(demoId);
        if (demoData) {
            // Store demo data in sessionStorage to access on next page
            sessionStorage.setItem('demoResult', JSON.stringify(demoData));
            // Navigate to a public demo results page
            navigate('/demo-results');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-blue-50 relative">
            {/* Top Right Actions */}
            <div className="absolute top-6 right-6 z-50">
                <LanguageSwitcher />
            </div>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 px-4">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                    <div className="absolute top-40 right-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative max-w-7xl mx-auto text-center">
                    {/* Logo/Brand */}
                    <div className="mb-8 float-animation">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-teal-600 rounded-full shadow-2xl">
                            <span className="text-4xl">✨</span>
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="text-6xl md:text-7xl font-bold mb-6 gradient-text">
                        AI Beauty Consultant
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
                        Your personal AI-powered beauty advisor. Get instant skin analysis,
                        personalized recommendations, and expert styling tips.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/signup"
                            className="btn-premium text-lg px-8 py-4 animate-pulse-glow">
                            Get Started Free 🚀
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 bg-white/80 backdrop-blur-sm text-purple-600 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                            Sign In
                        </Link>
                    </div>

                    {/* Try Demo Section */}
                    <div className="mt-8">
                        <div className="flex items-center gap-4 justify-center mb-4">
                            <div className="h-px w-20 bg-gradient-to-r from-transparent to-purple-300"></div>
                            <span className="text-gray-500 font-medium">OR</span>
                            <div className="h-px w-20 bg-gradient-to-l from-transparent to-purple-300"></div>
                        </div>

                        <button
                            onClick={() => setIsDemoModalOpen(true)}
                            className="group px-8 py-4 bg-white/90 backdrop-blur-sm border-2 border-purple-400 text-purple-600 rounded-full font-bold shadow-lg hover:shadow-2xl hover:border-purple-600 hover:bg-purple-50 transform hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto"
                        >
                            <svg className="w-6 h-6 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Try Sample Analysis</span>
                            <span className="text-xs bg-teal-500 text-white px-2 py-1 rounded-full">No signup needed!</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 gradient-text">
                        Powered by Advanced AI
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="glass-card p-8 rounded-3xl card-hover">
                            <div className="text-5xl mb-4">🔬</div>
                            <h3 className="text-2xl font-bold mb-3">Skin Analysis</h3>
                            <p className="text-gray-600">
                                DenseNet-201 powered analysis with 97% accuracy. Detects acne,
                                oiliness, texture, and provides personalized skincare routines.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="glass-card p-8 rounded-3xl card-hover">
                            <div className="text-5xl mb-4">💇‍♀️</div>
                            <h3 className="text-2xl font-bold mb-3">Hairstyle Matching</h3>
                            <p className="text-gray-600">
                                AI-powered recommendations based on your face shape. Get personalized
                                styling tips and trending looks.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="glass-card p-8 rounded-3xl card-hover">
                            <div className="text-5xl mb-4">💄</div>
                            <h3 className="text-2xl font-bold mb-3">Vision Studio AR</h3>
                            <p className="text-gray-600">
                                Real-time Virtual Try-On. Experiment with makeup shades and hair colors
                                instantly using our high-precision AR mirror.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto glass-card p-12 rounded-3xl text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Ready to Transform Your Beauty Routine?
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Join thousands of users getting personalized beauty advice powered by AI
                    </p>
                    <Link to="/signup" className="btn-premium text-lg px-10 py-4">
                        Start Your Free Analysis
                    </Link>
                </div>
            </section>

            {/* Demo Modal */}
            <DemoModal
                isOpen={isDemoModalOpen}
                onClose={() => setIsDemoModalOpen(false)}
                onSelectDemo={handleDemoSelect}
            />
        </div>
    );
};

export default LandingPage;
