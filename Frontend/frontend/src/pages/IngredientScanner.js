import React, { useState } from 'react';
import { FaMicroscope, FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaCamera, FaSearch } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

const IngredientScanner = () => {
    const [ingredientsText, setIngredientsText] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleScan = async () => {
        if (!ingredientsText.trim()) {
            toast.warning("Please enter some ingredients or upload a photo.");
            return;
        }

        try {
            setLoading(true);
            const res = await api.post('/api/ingredients/scan', { ingredients_text: ingredientsText });
            setResults(res.data);
            if (res.data.recognized_count > 0) {
                toast.success(`Found ${res.data.recognized_count} recognized ingredients!`);
            } else {
                toast.info("Analysis complete. No common restricted ingredients found.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Analysis engine failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            setLoading(true);
            toast.info("AI is extracting ingredients from your photo...");
            const res = await api.post('/api/ingredients/ocr', formData);

            if (res.data.success) {
                setIngredientsText(res.data.extracted_text);
                setResults(res.data);
                toast.success("AI Transcription Successful!");
            } else {
                toast.error(res.data.message || "Failed to extract text.");
            }
        } catch (err) {
            toast.error("OCR Service Failure. Please enter text manually.");
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setIngredientsText('');
        setResults(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-20">
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-teal-900 p-1 rounded-[2.5rem] shadow-2xl">
                <div className="bg-white dark:bg-slate-900 rounded-[2.4rem] p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-4xl shadow-lg border border-indigo-200 dark:border-indigo-800">
                            <FaMicroscope />
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                                Ingredient<span className="text-indigo-600">Scanner</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">AI-powered toxicity and benefit analysis.</p>
                        </div>
                        <div className="ml-auto">
                            {results && (
                                <button onClick={resetScanner} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">
                                    Clear Results
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="relative group">
                            <textarea
                                value={ingredientsText}
                                onChange={(e) => setIngredientsText(e.target.value)}
                                placeholder="Paste list or click camera to scan photo..."
                                className="w-full h-48 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 focus:ring-0 transition-all font-medium text-slate-800 dark:text-slate-200"
                            />
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoScan}
                                />
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-50 transition-all shadow-md font-bold text-xs uppercase"
                                >
                                    <FaCamera /> Scan Labels
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleScan}
                            disabled={loading}
                            className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3
                                ${loading ? 'bg-slate-400' : 'bg-slate-900 dark:bg-indigo-600 text-white'}`}
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>AI Processing...</span>
                                </div>
                            ) : (
                                <><FaSearch /> Analyze Composition</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {results && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Risk & Health Summary</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800/50 text-center">
                                <div className="text-2xl font-black text-rose-600">{results.harmful_count}</div>
                                <div className="text-[8px] font-black text-rose-400 uppercase">Harmful</div>
                            </div>
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 text-center">
                                <div className="text-2xl font-black text-emerald-600">{results.beneficial_count}</div>
                                <div className="text-[8px] font-black text-emerald-400 uppercase">Beneficial</div>
                            </div>
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 text-center">
                                <div className="text-2xl font-black text-indigo-600">{results.active_count}</div>
                                <div className="text-[8px] font-black text-indigo-400 uppercase">Actives</div>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center gap-3 shadow-inner">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                                <FaInfoCircle />
                            </div>
                            <p className="text-[10px] font-bold text-slate-500">
                                AI verified {results.total_checked} terms. {results.recognized_count} markers matched against global safety databases.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Biometric Match Data</h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {results.matches.length > 0 ? results.matches.map((item, i) => (
                                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-start gap-4 hover:translate-x-1 transition-transform border-l-4 border shadow-sm"
                                    style={{ borderLeftColor: item.type === 'Harmful' ? '#f43f5e' : item.type === 'Beneficial' ? '#10b981' : '#6366f1' }}>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.name}</span>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase
                                                ${item.type === 'Harmful' ? 'bg-rose-100 text-rose-600' :
                                                    item.type === 'Beneficial' ? 'bg-emerald-100 text-emerald-600' :
                                                        'bg-indigo-100 text-indigo-600'}`}>
                                                {item.type}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-2">{item.note}</p>
                                        {item.scanned_as && (
                                            <div className="text-[8px] text-slate-400 italic">Scanned as: {item.scanned_as}</div>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                                    <FaSearch className="text-3xl mb-4" />
                                    <div className="text-xs font-black uppercase tracking-widest">No matching markers found.</div>
                                    <p className="text-[10px] max-w-[150px] mx-auto mt-2">Try a clearer photo or check for typos in manual entry.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IngredientScanner;
