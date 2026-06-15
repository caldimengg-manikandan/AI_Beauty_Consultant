import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserAlt, FaStar, FaSmile, FaCheckCircle, FaAllergies, FaUtensils, FaBriefcaseMedical, FaArrowRight, FaArrowLeft, FaTimes } from 'react-icons/fa';
import { saveOnboarding } from '../services/api';

const OnboardingWizard = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        display_name: '',
        age: 25,
        gender: 'Female',
        current_skin_type: 'Combination',
        skin_concerns: [],
        beauty_goals: [],
        budget_range: 'Mid-range',
        allergies: [],
        sun_exposure: '1-2 hrs',
        diet: 'Vegetarian',
        water_intake: '1-2L',
        stress_level: 'Medium'
    });

    const [loading, setLoading] = useState(false);

    const totalSteps = 4;

    const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleToggleOption = (field, option) => {
        setFormData(prev => {
            const current = prev[field] || [];
            if (current.includes(option)) {
                return { ...prev, [field]: current.filter(item => item !== option) };
            } else {
                return { ...prev, [field]: [...current, option] };
            }
        });
    };

    const handleFinish = async () => {
        try {
            setLoading(true);
            await saveOnboarding(formData);
            onComplete();
        } catch (err) {
            console.error("Failed to save onboarding", err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const stepGradients = [
        "from-purple-600 to-indigo-700",
        "from-indigo-600 to-blue-700",
        "from-blue-600 to-teal-700",
        "from-teal-600 to-emerald-700"
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden relative"
            >
                {/* Header Ribbon */}
                <div className={`h-2 bg-gradient-to-r ${stepGradients[step - 1]} transition-all duration-700`} style={{ width: `${(step / totalSteps) * 100}%` }}></div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors z-10"
                >
                    <FaTimes />
                </button>

                <div className="p-8 md:p-12">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center text-purple-600 text-2xl mb-2">
                                    <FaUserAlt />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Let's build your profile</h2>
                                <p className="text-slate-500 mb-8 font-medium">This helps us personalize your AI skin analysis and recommendations.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">What should we call you?</label>
                                        <input
                                            type="text"
                                            value={formData.display_name}
                                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                            placeholder="Enter your name"
                                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-purple-500 focus:ring-0 transition-all font-bold text-slate-800"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Age</label>
                                            <input
                                                type="number"
                                                value={formData.age}
                                                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                                                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-purple-500 focus:ring-0 transition-all font-bold text-slate-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Gender Identification</label>
                                            <select
                                                value={formData.gender}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-purple-500 focus:ring-0 transition-all font-bold text-slate-800"
                                            >
                                                <option>Female</option>
                                                <option>Male</option>
                                                <option>Non-binary</option>
                                                <option>Prefer not to say</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl mb-2">
                                    <FaSmile />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Your Skin Identity</h2>
                                <p className="text-slate-500 font-medium">Tell us about your current skin state.</p>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Skin Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setFormData({ ...formData, current_skin_type: type })}
                                                className={`p-3 rounded-xl text-xs font-bold border transition-all ${formData.current_skin_type === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Primary Concerns</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Acne', 'Dark Spots', 'Fine Lines', 'Pigmentation', 'Redness', 'Dark Circles', 'Large Pores'].map(concern => (
                                            <button
                                                key={concern}
                                                onClick={() => handleToggleOption('skin_concerns', concern)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${formData.skin_concerns.includes(concern) ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                                            >
                                                {concern}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 text-2xl mb-2">
                                    <FaStar />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Goals & Preferences</h2>
                                <p className="text-slate-500 font-medium">What result are you looking for?</p>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Beauty Goals</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Clearer Skin', 'Anti-Aging', 'Deep Hydration', 'Radiant Glow', 'Skin Repair', 'Even Tone'].map(goal => (
                                            <button
                                                key={goal}
                                                onClick={() => handleToggleOption('beauty_goals', goal)}
                                                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all ${formData.beauty_goals.includes(goal) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'}`}
                                            >
                                                <FaCheckCircle className={formData.beauty_goals.includes(goal) ? 'text-blue-600' : 'text-slate-200'} />
                                                {goal}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Budget Range</label>
                                        <select
                                            value={formData.budget_range}
                                            onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm"
                                        >
                                            <option>Budget ($)</option>
                                            <option>Mid-range ($$)</option>
                                            <option>Premium ($$$)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Daily Sun Exposure</label>
                                        <select
                                            value={formData.sun_exposure}
                                            onChange={(e) => setFormData({ ...formData, sun_exposure: e.target.value })}
                                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm"
                                        >
                                            <option>Rarely</option>
                                            <option>1-2 hrs</option>
                                            <option>3+ hrs daily</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center text-emerald-600 text-2xl mb-2">
                                    <FaCheckCircle />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ready to begin!</h2>
                                <p className="text-slate-500 font-medium tracking-tight">We've customized your experience. Complete your first scan to unlock personalized routines.</p>

                                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
                                    <div className="relative z-10 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-10 bg-emerald-500 rounded-full"></div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Next Action</div>
                                                <div className="text-lg font-bold">Face analysis is required for deep metrics</div>
                                            </div>
                                        </div>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            By clicking finish, your beauty profile will be synced with our AI engine. You'll receive a baseline skin score as soon as you complete your first scan.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <input type="checkbox" checked={formData.weekly_report} onChange={(e) => setFormData({ ...formData, weekly_report: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                    <span className="text-sm font-bold text-slate-700">Receive weekly AI skin health reports</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-12 flex items-center justify-between">
                        <button
                            onClick={prevStep}
                            className={`flex items-center gap-2 font-black uppercase tracking-widest text-xs transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-slate-900'}`}
                        >
                            <FaArrowLeft /> Previous
                        </button>

                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-slate-900' : 'w-1.5 bg-slate-200'}`}></div>
                            ))}
                        </div>

                        <button
                            onClick={step === totalSteps ? handleFinish : nextStep}
                            disabled={loading}
                            className={`bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-xl ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? 'Saving...' : step === totalSteps ? 'Finish Profile' : (
                                <>Next Step <FaArrowRight /></>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingWizard;
