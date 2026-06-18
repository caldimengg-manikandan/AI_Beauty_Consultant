import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCrown, FaCheck, FaTimes, FaStar, FaInfinity, FaChartLine, FaRocket } from 'react-icons/fa';
import { getUserRole, getPricing, upgradeToPremium } from '../services/premiumApi';

const PremiumPage = () => {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null);
    const [pricing, setPricing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [role, pricingData] = await Promise.all([
                    getUserRole(),
                    getPricing()
                ]);
                setUserRole(role);
                setPricing(pricingData);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUpgrade = async (durationDays) => {
        setUpgrading(true);
        setMessage('');
        try {
            const result = await upgradeToPremium(durationDays);
            setMessage(result.message || 'Successfully upgraded to Premium!');

            // Refresh user role
            const newRole = await getUserRole();
            setUserRole(newRole);

            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
            setMessage(err.response?.data?.detail || 'Upgrade failed. Please try again.');
        } finally {
            setUpgrading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (userRole?.is_premium) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-12 text-center border-2 border-purple-200">
                    <FaCrown className="text-6xl text-yellow-500 mx-auto mb-6 animate-bounce" />
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">You're Already Premium!</h1>
                    <p className="text-gray-600 text-lg mb-6">
                        Enjoy unlimited access to all features until{' '}
                        {userRole.subscription_end && new Date(userRole.subscription_end).toLocaleDateString()}
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-lg"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
            {/* Header */}
            <div className="max-w-6xl mx-auto text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full mb-6">
                    <FaStar className="animate-pulse" />
                    <span className="font-bold">Upgrade to Premium</span>
                </div>
                <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                    Unlock Your Full Beauty Potential
                </h1>
                <p className="text-gray-600 text-xl max-w-2xl mx-auto">
                    Get unlimited AI-powered beauty analysis, personalized tips, and exclusive features
                </p>
            </div>

            {/* Success/Error Message */}
            {message && (
                <div className={`max-w-4xl mx-auto mb-8 p-4 rounded-xl ${message.includes('Success') || message.includes('upgraded')
                    ? 'bg-green-50 border-2 border-green-500 text-green-800'
                    : 'bg-red-50 border-2 border-red-500 text-red-800'
                    }`}>
                    <p className="font-semibold text-center">{message}</p>
                </div>
            )}

            {/* Pricing Cards */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {pricing?.plans.map((plan, index) => (
                    <div
                        key={index}
                        className={`relative bg-white rounded-3xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 ${plan.popular ? 'border-4 border-purple-500 md:-mt-4 md:mb-4' : 'border border-gray-200'
                            }`}
                    >
                        {/* Popular Badge */}
                        {plan.popular && (
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-bl-2xl font-bold flex items-center gap-2">
                                <FaCrown /> MOST POPULAR
                            </div>
                        )}

                        {/* Plan Header */}
                        <div className={`p-8 ${plan.popular
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100'
                            }`}>
                            <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-800'}`}>
                                {plan.name}
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-5xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                                    {plan.currency === 'INR' ? '₹' : '$'}{plan.price}
                                </span>
                                <span className={`text-lg ${plan.popular ? 'text-purple-100' : 'text-gray-500'}`}>
                                    /{plan.period}
                                </span>
                            </div>
                            {plan.savings && (
                                <div className="mt-2 inline-block bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                                    {plan.savings}
                                </div>
                            )}
                        </div>

                        {/* Features List */}
                        <div className="p-8">
                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Limits */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Monthly Analysis:</span>
                                    <span className="font-bold text-gray-900 flex items-center gap-1">
                                        {plan.limits.analyses_per_month === 'Unlimited' ? (
                                            <><FaInfinity className="text-purple-600" /> Unlimited</>
                                        ) : (
                                            plan.limits.analyses_per_month
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">History:</span>
                                    <span className="font-bold text-gray-900">
                                        {plan.limits.history_days === 'Unlimited' ? 'Forever' : `${plan.limits.history_days} days`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">AI Tips:</span>
                                    <span className="font-bold text-gray-900">{plan.limits.tips_count} per analysis</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            {plan.price > 0 ? (
                                <button
                                    onClick={() => handleUpgrade(plan.duration_days)}
                                    disabled={upgrading}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${plan.popular
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105'
                                        : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:scale-105'
                                        } ${upgrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {upgrading ? 'Processing...' : `Upgrade Now (Demo)`}
                                </button>
                            ) : (
                                <div className="w-full py-4 rounded-xl font-bold text-lg bg-gray-200 text-gray-500 text-center">
                                    Current Plan
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Feature Comparison */}
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    What You Get with Premium
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { icon: FaInfinity, title: 'Unlimited Analysis', desc: 'Analyze as many photos as you want, anytime' },
                        { icon: FaRocket, title: 'Advanced AI Tips', desc: '7 personalized tips per analysis vs 3 for free' },
                        { icon: FaChartLine, title: 'Progress Tracking', desc: 'Track your beauty journey over time' },
                        { icon: FaCrown, title: 'Priority Support', desc: 'Get help faster with dedicated support' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl">
                                <item.icon className="text-2xl text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                                <p className="text-sm text-gray-600">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Demo Notice */}
            <div className="max-w-4xl mx-auto mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-800 font-semibold">
                    🎉 <strong>Demo Mode:</strong> Click "Upgrade Now" to instantly activate Premium features for testing!
                </p>
                <p className="text-blue-600 text-sm mt-2">
                    In production, this would integrate with a payment gateway (Stripe, PayPal, etc.)
                </p>
            </div>
        </div>
    );
};

export default PremiumPage;
