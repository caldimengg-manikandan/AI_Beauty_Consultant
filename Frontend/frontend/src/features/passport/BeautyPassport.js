import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  FaUserCircle, FaShareAlt, FaDownload, FaCopy, FaCheck,
  FaLeaf, FaExclamationTriangle, FaStar, FaHeart, FaTint,
  FaShieldAlt, FaPalette, FaBullseye, FaQrcode, FaSyncAlt,
  FaMedal, FaCrown, FaFire, FaTimes
} from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";

const Tag = ({ label, color, icon }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-transform duration-200 hover:scale-105 ${color}`}>
    {icon && <span className="opacity-80 text-[10px]">{icon}</span>}
    {label}
  </span>
);

const Section = ({ icon, title, children }) => (
  <div className="flex-1 min-w-[250px]">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-slate-400 text-sm">{icon}</span>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const Achievement = ({ icon, title, desc, color }) => (
  <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${color}`}>
      {icon}
    </div>
    <div>
      <h4 className="text-xs font-black text-slate-800">{title}</h4>
      <p className="text-[10px] font-medium text-slate-500">{desc}</p>
    </div>
  </div>
);

export default function BeautyPassport() {
  const { user, profile } = useAuth();
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const fetchPassport = async () => {
      try {
        const [profileRes, historyRes] = await Promise.allSettled([
          api.get("/api/onboarding/profile"),
          api.get("/history?limit=5"),
        ]);
        const p = profileRes.status === "fulfilled"
          ? (profileRes.value.data?.profile || profileRes.value.data)
          : {};
        const analyses = historyRes.status === "fulfilled"
          ? (historyRes.value.data?.analyses || [])
          : [];

        const latestScan = analyses[0] || {};
        setPassport({ ...p, latestScan, totalScans: analyses.length });
        setShareUrl(`${window.location.origin}/passport/${encodeURIComponent(user?.sub || "preview")}`);
      } catch (e) {
        console.error("Passport load error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPassport();
  }, [user]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    
    // Ensure card is flipped to front for download
    const wasFlipped = isFlipped;
    if (wasFlipped) setIsFlipped(false);
    
    // Small delay to allow flip animation to reverse if needed
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          logging: false
        });
        
        const link = document.createElement('a');
        link.download = `BeautyPassport_${profile?.name || "User"}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error("Download failed", error);
      } finally {
        if (wasFlipped) setIsFlipped(true);
        setIsDownloading(false);
      }
    }, wasFlipped ? 500 : 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-4 border-[#7B2FF7]/20 border-t-[#7B2FF7] animate-spin" />
      </div>
    );
  }

  const skinType = passport?.current_skin_type || profile?.current_skin_type || "Unknown";
  const concerns = passport?.skin_concerns || profile?.skin_concerns || [];
  const goals    = passport?.beauty_goals   || profile?.beauty_goals   || [];
  const allergies= passport?.allergies      || profile?.allergies      || [];
  const name     = passport?.display_name   || profile?.name           || user?.sub?.split("@")[0] || "User";
  const age      = passport?.age            || profile?.age;
  const gender   = passport?.gender         || profile?.gender;
  const budget   = passport?.budget_range;
  const routine  = passport?.routine_style;

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans text-slate-800 selection:bg-[#7B2FF7]/20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Beauty Passport</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Your shareable AI beauty identity</p>
        </div>
        <button
          onClick={handleDownloadImage}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm disabled:opacity-50"
        >
          {isDownloading ? <FaSyncAlt className="animate-spin text-[#7B2FF7]" /> : <FaDownload className="text-[#7B2FF7]" />}
          {isDownloading ? "Generating Image..." : "Download Card"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Passport Card & Stats */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Interactive 3D Flip Card Container */}
          <div className="relative group w-full perspective-1000 h-[380px]">
            <div 
              ref={cardRef}
              className={`w-full h-full relative transition-transform duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              
              {/* --- FRONT OF CARD --- */}
              <div className="absolute inset-0 backface-hidden w-full h-full bg-gradient-to-br from-[#7B2FF7] to-[#5F6FFF] rounded-[1.5rem] p-8 text-white shadow-[0_20px_40px_rgba(123,47,247,0.2)] overflow-hidden">
                {/* Background Texture / Orbs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#14B87A]/20 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4 pointer-events-none" />

                {/* Avatar & Flip Icon */}
                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div className="w-20 h-20 rounded-[1.25rem] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                    <FaUserCircle size={48} className="opacity-90" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FaSyncAlt size={12} />
                  </div>
                </div>

                <div className="relative z-10 mb-6">
                  <h2 className="text-3xl font-black tracking-tight">{name}</h2>
                  <div className="flex items-center gap-2 mt-1.5 text-sm opacity-90 font-medium">
                    {age && <span>{age} yrs</span>}
                    {gender && <span>• {gender}</span>}
                  </div>
                </div>

                {/* Badges */}
                <div className="relative z-10 flex flex-wrap gap-2.5 pb-6 border-b border-white/20">
                  <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-xs font-black shadow-sm border border-white/10">
                    {skinType} Skin
                  </span>
                  {routine && (
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-xs font-black shadow-sm border border-white/10">
                      {routine} Routine
                    </span>
                  )}
                  {budget && (
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-xs font-black shadow-sm border border-white/10">
                      {budget}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="relative z-10 grid grid-cols-3 gap-4 pt-4">
                  <div className="flex flex-col gap-1 text-left">
                    <p className="text-3xl font-black leading-none">{passport?.totalScans || 0}</p>
                    <p className="text-[10px] opacity-75 uppercase tracking-widest font-bold">Total Scans</p>
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <p className="text-3xl font-black leading-none">{goals.length}</p>
                    <p className="text-[10px] opacity-75 uppercase tracking-widest font-bold">Goals</p>
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <p className="text-3xl font-black leading-none">{concerns.length}</p>
                    <p className="text-[10px] opacity-75 uppercase tracking-widest font-bold">Concerns</p>
                  </div>
                </div>
              </div>

              {/* --- BACK OF CARD --- */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full bg-slate-900 rounded-[1.5rem] p-8 text-white shadow-[0_20px_40px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#7B2FF7]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Digital Identity</p>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <FaSyncAlt size={12} className="text-slate-400" />
                    </div>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Pass ID</p>
                      <p className="text-sm font-mono text-slate-200">
                        {user?.sub ? btoa(user.sub).substring(0, 16).toUpperCase() : "USR-0000-0000"}
                      </p>
                    </div>
                    <FaShieldAlt className="text-[#7B2FF7] opacity-50" size={24} />
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  {/* Faux Barcode */}
                  <div className="flex gap-1 h-12 w-full justify-center mb-3 opacity-60">
                    {[2,4,1,3,6,2,1,5,3,2,4,1,2,6,3,1,2,4,2].map((w, i) => (
                      <div key={i} className="bg-white h-full" style={{ width: `${w}px` }} />
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-500 tracking-[0.3em] font-mono">SCANNABLE AUTHENTICATOR</p>
                </div>
              </div>

            </div>
          </div>
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
            <FaSyncAlt /> Click card to flip
          </p>
        </div>

        {/* Right Column: Info Arch & Share */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Information Architecture (Concerns, Goals, Allergies) */}
          <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8">
            <div className="flex flex-col md:flex-row gap-8 flex-wrap">
              {concerns.length > 0 && (
                <Section icon={<FaExclamationTriangle className="text-[#EF4444]" />} title="Skin Concerns">
                  {concerns.map(c => <Tag key={c} label={c} color="bg-[#EF4444]/10 text-[#EF4444]" icon="⚠" />)}
                </Section>
              )}

              {goals.length > 0 && (
                <Section icon={<FaBullseye className="text-[#14B87A]" />} title="Beauty Goals">
                  {goals.map(g => <Tag key={g} label={g} color="bg-[#14B87A]/10 text-[#14B87A]" icon="✓" />)}
                </Section>
              )}

              {allergies.length > 0 && (
                <Section icon={<FaShieldAlt className="text-[#F59E0B]" />} title="Allergies & Sensitivities">
                  {allergies.map(a => <Tag key={a} label={a} color="bg-[#F59E0B]/10 text-[#F59E0B]" icon="⚠" />)}
                </Section>
              )}
            </div>

            {passport?.latestScan?.summary && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-slate-400 text-sm"><FaStar className="text-[#7B2FF7]" /></span>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Latest AI Insight</h3>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {passport.latestScan.summary}
                </p>
              </div>
            )}
          </div>

          {/* Gamification Badges Section */}
          <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8">
            <div className="flex items-center gap-2 mb-6">
              <FaMedal className="text-amber-500 text-lg" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unlocked Achievements</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Achievement 
                icon={<FaFire />} 
                title="7-Day Streak" 
                desc="Logged in 7 days in a row."
                color="bg-orange-100 text-orange-500" 
              />
              <Achievement 
                icon={<FaCrown />} 
                title="Early Adopter" 
                desc="Joined during the beta phase."
                color="bg-violet-100 text-violet-600" 
              />
              {passport?.totalScans >= 3 && (
                <Achievement 
                  icon={<FaStar />} 
                  title="Skin Expert" 
                  desc="Completed 3+ AI Face Scans."
                  color="bg-teal-100 text-teal-600" 
                />
              )}
            </div>
          </div>

          {/* Share Section Redesign */}
          <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#7B2FF7]/10 flex items-center justify-center">
                <FaShareAlt className="text-[#7B2FF7] text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Share Beauty Passport</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Allow salons and experts to view your profile and personalize recommendations.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <div className="relative flex-1">
                <input
                  readOnly
                  value={shareUrl}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3.5 text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#7B2FF7]/30 transition-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-[#7B2FF7] transition-colors duration-250 flex items-center gap-1.5"
                >
                  {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              
              <button
                onClick={() => setShowQR(true)}
                className="shrink-0 px-5 py-3.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors duration-250 flex items-center justify-center gap-2"
              >
                <FaQrcode size={16} className="text-[#7B2FF7]" />
                Show QR
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Real QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full relative">
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <FaTimes />
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#7B2FF7]/10 text-[#7B2FF7] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FaQrcode size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Scan Passport</h3>
              <p className="text-xs text-slate-500 mt-1">Show this code to your salon</p>
            </div>
            
            <div className="bg-white p-4 border-2 border-slate-100 rounded-2xl flex justify-center shadow-inner">
              <QRCodeCanvas 
                value={shareUrl} 
                size={200} 
                bgColor={"#ffffff"} 
                fgColor={"#0f172a"} 
                level={"H"} 
                includeMargin={false}
              />
            </div>
            
            <button
              onClick={() => setShowQR(false)}
              className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-[#7B2FF7] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Add Custom CSS for 3D Flip */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
