import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Stethoscope,
    Clock,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    ExternalLink,
    ShieldCheck,
    Send
} from 'lucide-react';
import { getReviewQueue, submitExpertReview } from '../../services/api';

const ExpertDashboard = () => {
    const [queue, setQueue] = useState([]);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expertTip, setExpertTip] = useState("");
    const [isAccurate, setIsAccurate] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchQueue();
    }, []);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const data = await getReviewQueue();
            setQueue(data);
        } catch (error) {
            console.error("Failed to fetch review queue", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!selectedAnalysis || !expertTip) return;
        try {
            setSubmitting(true);
            await submitExpertReview({
                analysis_id: selectedAnalysis.id,
                expert_tip: expertTip,
                is_accurate: isAccurate
            });
            // Cleanup
            setExpertTip("");
            setSelectedAnalysis(null);
            await fetchQueue();
            toast.success("Professional review submitted! This improves our AI accuracy.");
        } catch (error) {
            toast.error("Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Professional Review Center</h1>
                    <p className="text-slate-500 font-medium mt-1">Human-in-the-loop expert validation for AI diagnostics</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-2xl flex items-center space-x-2 text-blue-700 font-bold shadow-sm">
                    <Stethoscope size={20} />
                    <span>Dermatologist Portal</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Review Queue */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center">
                            <Clock className="mr-2 text-slate-400" size={20} />
                            Review Queue ({queue.length})
                        </h2>
                        <button onClick={fetchQueue} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider">Refresh</button>
                    </div>

                    <div className="space-y-3 h-[calc(100vh-320px)] overflow-y-auto pr-2 custom-scrollbar">
                        {queue.length === 0 ? (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                                <p className="text-slate-500 font-medium">All analyses have been reviewed. Excellent work!</p>
                            </div>
                        ) : (
                            queue.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedAnalysis(item)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-lg
                    ${selectedAnalysis?.id === item.id
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-white border-slate-200 hover:border-blue-400 text-slate-900'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full
                      ${selectedAnalysis?.id === item.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                            {typeof item.face_shape === 'string' ? item.face_shape : (item.face_shape?.value || (Array.isArray(item.face_shape) ? item.face_shape[0] : "Unknown"))}
                                        </span>
                                        <span className={`text-[10px] font-bold ${selectedAnalysis?.id === item.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {item.date} {item.time}
                                        </span>
                                    </div>
                                    <div className="font-bold flex justify-between items-center">
                                        <span>Scan ID: {item.id.slice(-8).toUpperCase()}</span>
                                        <ChevronRight size={16} className={`${selectedAnalysis?.id === item.id ? 'text-white' : 'text-slate-300 group-hover:text-blue-500'}`} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Workspace */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[32px] shadow-sm flex flex-col min-h-[calc(100vh-320px)] overflow-hidden">
                    {selectedAnalysis ? (
                        <div className="flex flex-col h-full animate-in zoom-in-95 duration-300">
                            {/* Scan Details */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-inner">
                                        <img src={selectedAnalysis.image_url} alt="Scan" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 uppercase tracking-tight">Reviewing Scan {selectedAnalysis.id.slice(-8)}</h3>
                                        <p className="text-xs text-slate-400 font-bold">{selectedAnalysis.user_email}</p>
                                    </div>
                                </div>
                                <a href={selectedAnalysis.image_url} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-colors">
                                    <ExternalLink size={20} />
                                </a>
                            </div>

                            <div className="flex-1 p-8 grid grid-cols-2 gap-8 overflow-y-auto">
                                {/* Analysis Comparison */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">AI Predictions</h4>
                                        <div className="space-y-4">
                                            <DiagnosisBadge label="Face Shape" value={typeof selectedAnalysis.face_shape === 'string' ? selectedAnalysis.face_shape : (selectedAnalysis.face_shape?.value || (Array.isArray(selectedAnalysis.face_shape) ? selectedAnalysis.face_shape[0] : "Unknown"))} />
                                            <DiagnosisBadge label="Gender" value={selectedAnalysis.gender} />
                                            <DiagnosisBadge label="Skin Type" value={selectedAnalysis.skin_type || "Combination"} />
                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-500">Confidence</span>
                                                <span className="font-black text-blue-600">{(selectedAnalysis.face_shape_conf * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">AI Recommendations</h4>
                                        <div className="space-y-2">
                                            {selectedAnalysis.recommendations?.slice(0, 3).map((rec, i) => (
                                                <div key={i} className="text-xs font-bold text-slate-600">• {rec.split(':')[0]}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Professional Input */}
                                <div className="space-y-6 flex flex-col">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Your Expert Diagnosis</h4>

                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={() => setIsAccurate(true)}
                                                    className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl border-2 transition-all font-bold
                              ${isAccurate ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                                >
                                                    <CheckCircle2 size={18} />
                                                    <span>AI Correct</span>
                                                </button>
                                                <button
                                                    onClick={() => setIsAccurate(false)}
                                                    className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl border-2 transition-all font-bold
                              ${!isAccurate ? 'bg-red-50 border-red-500 text-red-700 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                                >
                                                    <AlertCircle size={18} />
                                                    <span>Needs Correction</span>
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 ml-1">Professional Advice</label>
                                                <textarea
                                                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                                    placeholder="Add your expert medical tips for this client..."
                                                    value={expertTip}
                                                    onChange={(e) => setExpertTip(e.target.value)}
                                                />
                                            </div>

                                            <button
                                                onClick={handleSubmitReview}
                                                disabled={submitting || !expertTip}
                                                className="w-full bg-blue-600 text-white flex items-center justify-center space-x-3 py-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                                            >
                                                <ShieldCheck size={20} />
                                                <span>{submitting ? "Submitting..." : "Submit Verification"}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center shadow-inner">
                                <Stethoscope size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Select Case to Review</h3>
                                <p className="text-slate-500 font-medium max-w-xs mx-auto">Click on a scan from the queue to start your professional validation.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DiagnosisBadge = ({ label, value }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-500">{label}</span>
        <span className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl text-sm font-black text-slate-800">{value}</span>
    </div>
);

export default ExpertDashboard;
