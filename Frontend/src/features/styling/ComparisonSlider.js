import React, { useState, useEffect } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { getHistory, resolveImageUrl } from '../../services/api';
import { FaSyncAlt, FaCalendarAlt, FaChevronDown } from 'react-icons/fa';

const ComparisonSlider = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [beforeIdx, setBeforeIdx] = useState(0);
    const [afterIdx, setAfterIdx] = useState(1);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getHistory();
                const analyses = Array.isArray(data) ? data : [];
                setHistory(analyses);
                if (analyses.length >= 2) {
                    // Set "After" as newest (idx 0) and "Before" as one before (idx 1)
                    setAfterIdx(0);
                    setBeforeIdx(1);
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <div className="h-[400px] bg-slate-100 rounded-[2rem] animate-pulse"></div>;

    if (history.length < 2) {
        return (
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 text-center space-y-4">
                <div className="text-4xl">📸</div>
                <h4 className="text-xl font-bold text-slate-800 tracking-tight">Comparison Locked</h4>
                <p className="text-slate-500 max-w-sm mx-auto text-sm">
                    You need at least two scans to use the Before & After slider. Complete your daily scan to unlock this feature!
                </p>
            </div>
        );
    }

    const beforeAnalysis = history[beforeIdx];
    const afterAnalysis = history[afterIdx];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                        Before <span className="text-indigo-600">&</span> After
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Visual Regression Analysis</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <FaCalendarAlt className="text-indigo-600" />
                        Select Scans <FaChevronDown className={`transition-transform ${showOptions ? 'rotate-180' : ''}`} />
                    </button>

                    {showOptions && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-20 animate-fade-in">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Original State (Before)</label>
                                    <select
                                        value={beforeIdx}
                                        onChange={(e) => setBeforeIdx(parseInt(e.target.value))}
                                        className="w-full text-xs font-bold p-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {history.map((h, i) => (
                                            <option key={i} value={i} disabled={i === afterIdx}>{h.date} - {h.face_shape || 'Scan'}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Current State (After)</label>
                                    <select
                                        value={afterIdx}
                                        onChange={(e) => setAfterIdx(parseInt(e.target.value))}
                                        className="w-full text-xs font-bold p-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {history.map((h, i) => (
                                            <option key={i} value={i} disabled={i === beforeIdx}>{h.date} - {h.face_shape || 'Scan'}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => setShowOptions(false)}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                                >
                                    Update View
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative bg-slate-900 group">
                <ReactCompareSlider
                    itemOne={<ReactCompareSliderImage src={resolveImageUrl(beforeAnalysis.image_url)} alt="Before" />}
                    itemTwo={<ReactCompareSliderImage src={resolveImageUrl(afterAnalysis.image_url)} alt="After" />}
                    style={{ height: '450px', width: '100%' }}
                />

                {/* Date Labels */}
                <div className="absolute top-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest pointer-events-none group-hover:opacity-0 transition-opacity">
                    Before: {beforeAnalysis.date}
                </div>
                <div className="absolute top-6 right-6 px-4 py-2 bg-indigo-600/60 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest pointer-events-none group-hover:opacity-0 transition-opacity">
                    After: {afterAnalysis.date}
                </div>

                {/* Analysis Overlay Tag */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/90 backdrop-blur-md rounded-full text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl pointer-events-none">
                    Drag to Compare
                </div>
            </div>
        </div>
    );
};

export default ComparisonSlider;
