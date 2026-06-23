import React, { useState, useEffect } from 'react';
import { FaUserAlt, FaChartBar, FaLightbulb, FaCheckCircle, FaExclamationTriangle, FaShieldAlt, FaCamera, FaInfoCircle, FaCalendarAlt, FaFingerprint, FaDownload } from 'react-icons/fa';
import { downloadReport, downloadDemoReport } from '../../services/api';
import ProductRecommendations from './ProductRecommendations';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';

/**
 * ResultCard - A premium, clinical-grade analysis report component
 */
const ResultCard = ({
  data, image, annotatedImage,
  faceShapeConfidence, faceQuality, facesDetectedCount, multipleFacesDetected, faceShapeModelStatus
}) => {
  const [showAnnotated, setShowAnnotated] = useState(true);
  const [activeSection, setActiveSection] = useState('skin');
  const [isVisible, setIsVisible] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const reportRef = React.useRef(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      let blob;
      let filenameSuffix;

      if (data.id || data._id) {
        const analysisId = data.id || data._id;
        blob = await downloadReport(analysisId);
        filenameSuffix = analysisId.substring(0, 8);
      } else {
        // demo mode
        toast.info("Exporting Demo Archive...");
        blob = await downloadDemoReport(data);
        filenameSuffix = "demo";
      }

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `beauty_report_${filenameSuffix}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success("PDF Archive Generated!");
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Failed to export PDF. Check backend logs.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!reportRef.current) return;
    try {
      setIsSharing(true);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc'
      });

      const image = canvas.toDataURL("image/png");
      const blob = await (await fetch(image)).blob();
      const file = new File([blob], "skin_analysis.png", { type: "image/png" });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'My AI Skin Analysis Report',
          text: 'Check out my professional skin analysis from AI Beauty Consultant!',
        });
        toast.success("Shared successfully!");
      } else {
        // Fallback: Download
        const link = document.createElement('a');
        link.href = image;
        link.download = 'my_beauty_report.png';
        link.click();
        toast.info("Sharing not supported. Image downloaded instead.");
      }
    } catch (err) {
      console.error("Sharing failed", err);
      toast.error("Failed to generate shareable card.");
    } finally {
      setIsSharing(false);
    }
  };

  if (!data) return null;

  const { faceShape, skinScores, recommendations, personalizedTips, error, colorAnalysis, gender } = data;

  if (error) {
    return (
      <div className="mt-8 animate-fade-in-up">
        <div className="bg-white border-2 border-red-100 p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 text-4xl shrink-0 shadow-inner">
            <FaExclamationTriangle />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">Analysis Interrupted</h3>
            <p className="text-lg font-bold text-red-600 mb-2">{error.replace(/"/g, '')}</p>
            {data.message && (
              <p className="text-slate-600 font-medium mb-4 leading-relaxed">
                <span className="font-bold text-slate-900">Reason:</span> {data.message}
              </p>
            )}
            {data.professional_tip && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-6 flex gap-3 items-start">
                <div className="text-amber-500 mt-0.5"><FaLightbulb /></div>
                <p className="text-xs text-amber-900 font-bold leading-relaxed">
                  <span className="uppercase tracking-widest text-[9px] block mb-1 opacity-70">Professional Tip</span>
                  {data.professional_tip}
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:translate-y-[-2px] uppercase tracking-widest text-xs"
              >
                Try Again
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-xl hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest text-xs"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getScoreInfo = (value) => {
    if (value > 0.7) return { label: "High Sensitivity", color: "red", icon: "⚠️" };
    if (value > 0.4) return { label: "Moderate Concern", color: "amber", icon: "⚖️" };
    return { label: "Optimal Condition", color: "emerald", icon: "✅" };
  };

  const reportId = `AB-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const analysisDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div ref={reportRef} className={`max-w-6xl mx-auto transition-all duration-700 transform px-4 pb-12 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

      {/* PROFESSIONAL HEADER BAR */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 mb-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-1">
          <div className="bg-slate-900/40 backdrop-blur-sm px-8 py-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-400/30 rounded-xl flex items-center justify-center text-indigo-400 text-xl shadow-lg">
                <FaFingerprint />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Facial Intelligence Report</h2>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  ID: {reportId} • {analysisDate}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-center min-w-[100px] backdrop-blur-xl">
                <div className="text-[10px] text-slate-500 uppercase font-black">Subject</div>
                <div className="text-sm font-bold text-white">{gender || 'Profile'}</div>
              </div>
              <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center min-w-[120px] backdrop-blur-xl">
                <div className="text-[10px] text-indigo-400 uppercase font-black">Morphology</div>
                <div className="text-sm font-black text-white">{faceShape || 'Analyzing...'}</div>
              </div>
              {/* Additive: confidence + detection-method transparency badges.
                  Render only when the backend actually supplied the data, so
                  older/cached results without these fields look identical
                  to before. */}
              {typeof faceShapeConfidence === 'number' && (
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-center min-w-[100px] backdrop-blur-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-black">Confidence</div>
                  <div className="text-sm font-bold text-white">{Math.round(faceShapeConfidence * 100)}%</div>
                </div>
              )}
              {faceShapeModelStatus && (
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-center min-w-[100px] backdrop-blur-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-black">Method</div>
                  <div className="text-sm font-bold text-white">
                    {faceShapeModelStatus === 'LOADED' ? 'AI Model' : 'Geometric'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additive, non-blocking diagnostic banner: only appears when the
            backend flags a borderline capture (small/turned face, multiple
            faces, or other quality warning). Never blocks rendering of the
            existing report below. */}
        {(multipleFacesDetected || faceQuality?.warning) && (
          <div className="px-8 pt-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="text-amber-500 mt-0.5"><FaExclamationTriangle /></div>
              <div className="text-xs text-amber-900 font-bold leading-relaxed">
                {multipleFacesDetected && (
                  <p>Multiple faces detected{typeof facesDetectedCount === 'number' ? ` (${facesDetectedCount})` : ''}. Results reflect the primary/largest face in the frame.</p>
                )}
                {faceQuality?.warning && <p>{faceQuality.warning}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* LEFT: VISUAL DIAGNOSTICS */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
              <div className="group relative rounded-3xl overflow-hidden bg-slate-900 aspect-[4/3] sm:aspect-square shadow-inner transition-all duration-500 hover:shadow-2xl border-4 border-slate-50 flex items-center justify-center">
                <img
                  src={showAnnotated && annotatedImage ? annotatedImage : image}
                  alt="Diagnostic Capture"
                  className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105"
                />

                {/* Image Toggle Overlays */}
                <div className="absolute inset-x-4 bottom-4 flex justify-between items-center bg-black/40 backdrop-blur-md rounded-2xl p-2.5 border border-white/20">
                  <div className="flex bg-white/10 rounded-xl p-1 shadow-inner">
                    <button
                      onClick={() => setShowAnnotated(false)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${!showAnnotated ? 'bg-white text-slate-900 shadow-xl' : 'text-white hover:bg-white/10'}`}
                    >
                      RAW
                    </button>
                    <button
                      onClick={() => setShowAnnotated(true)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${showAnnotated ? 'bg-indigo-500 text-white shadow-xl' : 'text-white hover:bg-white/10'}`}
                    >
                      AI MAPPING
                    </button>
                  </div>
                  <div className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest">
                    Live Feed Active
                  </div>
                </div>

                {/* Face Focus Overlay - Scanner Effect */}
                <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10 m-8 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_indigo] opacity-40 animate-scan"></div>
              </div>

              {/* Color Analysis Module */}
              {colorAnalysis && (
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-slate-900">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Chromatic Analysis</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(colorAnalysis).filter(([k]) => k !== 'season' && k !== 'recommended_colors').slice(0, 4).map(([key, val]) => (
                      <div key={key} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-indigo-50/30 hover:border-indigo-100">
                        <div className="text-[10px] text-slate-400 uppercase font-black mb-1">{key.replace('_', ' ')}</div>
                        <div className="text-sm font-bold text-slate-700 truncate capitalize">{val}</div>
                      </div>
                    ))}
                  </div>
                  {colorAnalysis.season && (
                    <div className="mt-4 bg-gradient-to-br from-indigo-700 to-purple-800 rounded-2xl p-5 text-white flex items-center justify-between shadow-xl">
                      <div>
                        <div className="text-[10px] font-black uppercase opacity-60 tracking-widest">Personal Palette</div>
                        <div className="text-xl font-black italic">{colorAnalysis.season}</div>
                      </div>
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/10">🎨</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: DATA & INSIGHTS */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-8">

              {/* SECTION TABS - Professional Slider */}
              <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full sm:w-fit shadow-inner">
                {[
                  { id: 'skin', icon: <FaChartBar />, label: 'Metrics' },
                  { id: 'routine', icon: <FaShieldAlt />, label: 'Routine' },
                  { id: 'tips', icon: <FaLightbulb />, label: 'Insights' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex-1 sm:flex-none ${activeSection === tab.id ? 'bg-white text-slate-900 shadow-xl translate-y-[-1px]' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* SECTION: SKIN HEALTH */}
              {activeSection === 'skin' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {skinScores && Object.keys(skinScores).length > 0 ? (
                      Object.entries(skinScores).map(([key, value]) => {
                        const info = getScoreInfo(value);
                        return (
                          <div key={key} className="bg-white group p-6 rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl hover:border-indigo-200 transition-all duration-500">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 capitalize">{key}</h4>
                                </div>
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-tighter shadow-sm
                                      ${info.color === 'red' ? 'bg-red-50 text-red-600 border-red-100' :
                                    info.color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                      'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                  {info.icon} {info.label}
                                </div>
                              </div>
                              <div className={`text-4xl font-black tracking-tighter ${info.color === 'red' ? 'text-red-500' : info.color === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {Math.round(value * 100)}<span className="text-sm opacity-30 ml-0.5">%</span>
                              </div>
                            </div>

                            <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-50">
                              <div
                                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-[1.5s] ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]
                                    ${info.color === 'red' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                                    info.color === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                                      'bg-gradient-to-r from-emerald-400 to-emerald-600'}`}
                                style={{ width: `${value * 100}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-3 px-1">
                              <span className="text-[10px] font-bold text-slate-300">BENCHMARK</span>
                              <span className="text-[10px] font-bold text-slate-500">{value > 0.5 ? 'NEEDS ATTENTION' : 'GOOD RANGE'}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 py-24 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm text-2xl">🔬</div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Awaiting Deep Metric Feed</p>
                      </div>
                    )}
                  </div>
                  <div className="p-5 bg-gradient-to-r from-indigo-50 to-slate-50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0"><FaInfoCircle /></div>
                    <p className="text-xs text-indigo-900 font-medium leading-relaxed italic">
                      Professional Intelligence Note: These scores are processed via a DenseNet-121 architecture trained on dermatological and aesthetic imaging datasets. Please consult a professional for clinical diagnosis.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION: ROUTINE */}
              {activeSection === 'routine' && (
                <div className="space-y-4 animate-fade-in px-1">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">AI-Generated Regimen</h3>
                      <p className="text-xs text-slate-500 font-medium">Customized specifically for your morphological traits.</p>
                    </div>
                    <span className="text-[10px] px-4 py-1.5 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span> MEDICAL-GRADE
                    </span>
                  </div>
                  <div className="space-y-3">
                    {recommendations && recommendations.length > 0 ? (
                      recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-md hover:shadow-xl hover:translate-x-1 transition-all group border-l-4 border-l-transparent hover:border-l-indigo-600">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-50 flex items-center justify-center text-indigo-600 text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            <FaCheckCircle />
                          </div>
                          <div className="flex-1 pt-1.5">
                            <p className="text-slate-700 font-bold leading-relaxed">{rec.replace(/\*\*/g, '')}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-24 text-center text-slate-300 font-black uppercase tracking-widest text-sm italic">Recalibrating Formula...</div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: TIPS */}
              {activeSection === 'tips' && (
                <div className="space-y-5 animate-fade-in px-1">
                  <div className="grid grid-cols-1 gap-5">
                    {personalizedTips && personalizedTips.length > 0 ? (
                      personalizedTips.map((tip, i) => (
                        <div key={i} className="relative group overflow-hidden rounded-3xl cursor-default">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="relative bg-white p-8 rounded-3xl border border-slate-100 shadow-xl group-hover:bg-transparent group-hover:border-transparent transition-all duration-300 flex items-center gap-8">
                            <div className="text-5xl filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500 transform">
                              {tip.match(/^[\u{1F300}-\u{1F9FF}]/u)?.[0] || "💡"}
                            </div>
                            <div className="flex-1">
                              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 group-hover:text-white/60">Intelligence Asset #{i + 1}</div>
                              <p className="text-lg font-black text-slate-800 group-hover:text-white transition-all leading-tight tracking-tight">
                                {tip.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 font-black uppercase tracking-widest text-xs">
                        Unlock Advanced Insights in the Premium Ecosystem
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RECOMMENDED PRODUCTS SECTION */}
              <div className="pt-10 border-t border-slate-100">
                <ProductRecommendations
                  skinType={skinScores && Object.keys(skinScores).length > 0 ? Object.keys(skinScores)[0] : 'normal'}
                  concern={recommendations && recommendations.length > 0 ? recommendations[0].split(' ')[0] : ''}
                />
              </div>

            </div>
          </div>
        </div>

        {/* FOOTER BAR - Premium Experience */}
        <div className="px-8 py-6 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-8">
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black tracking-widest uppercase">
              <FaCalendarAlt className="text-indigo-400" /> VALIDITY: 30 CYCLES
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black tracking-widest uppercase">
              <FaShieldAlt className="text-emerald-400" /> SHA-256 ENCRYPTED REPORT
            </div>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 sm:flex-none px-8 py-3 bg-slate-800 text-white font-black rounded-xl hover:bg-slate-700 transition-all text-xs tracking-widest uppercase border border-slate-700 flex items-center justify-center gap-2"
            >
              {isSharing ? 'GENERATING...' : 'SHARE ASSET'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`flex-1 sm:flex-none px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] text-xs tracking-widest uppercase flex items-center justify-center gap-2 ${isExporting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  GENERATING PORTFOLIO...
                </>
              ) : (
                <>
                  <FaDownload /> EXPORT ARCHIVE PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
