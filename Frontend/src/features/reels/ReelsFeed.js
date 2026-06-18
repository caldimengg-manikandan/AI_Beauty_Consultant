import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiHeart, FiMessageCircle, FiShare2, FiPlay, FiCalendar,
  FiPlus, FiX, FiUploadCloud, FiBookmark, FiEye, FiBarChart2,
  FiTrash2, FiTag, FiDollarSign, FiAlertTriangle,
} from 'react-icons/fi';
import { FaStore, FaMapMarkerAlt, FaFire, FaRegBookmark, FaBookmark } from 'react-icons/fa';
import {
  getReelsFeed, getOwnerReels, toggleReelLike, toggleReelSave,
  incrementReelView, deleteReel, uploadReel,
} from '../../services/reelsApi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt    = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtNum = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n || 0);
};

const CATEGORIES = ['All', 'Hair', 'Skin', 'Spa', 'Makeup', 'Nail', 'General'];

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
const ReelSkeleton = () => (
  <div className="relative w-full h-[calc(100vh-80px)] md:h-[820px] max-w-sm mx-auto bg-zinc-900 md:rounded-3xl overflow-hidden animate-pulse">
    <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
      <div className="h-3 bg-zinc-700 rounded w-1/2" />
      <div className="h-3 bg-zinc-700 rounded w-3/4" />
      <div className="h-10 bg-zinc-700 rounded-xl w-full" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// REEL VIDEO — Customer View
// ─────────────────────────────────────────────────────────────────────────────
const ReelVideo = ({ reel, isActive }) => {
  const videoRef    = useRef(null);
  const navigate    = useNavigate();
  const [isPlaying, setIsPlaying]         = useState(false);
  const [localLike, setLocalLike]         = useState(reel.is_liked);
  const [localLikeCount, setLocalLikeCount] = useState(reel.likes_count || 0);
  const [localSave, setLocalSave]         = useState(reel.is_saved);
  const [localSaveCount, setLocalSaveCount] = useState(reel.saves_count || 0);
  const [videoError, setVideoError]       = useState(false);
  const viewFired = useRef(false);

  // Auto-play / pause
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      // Fire view count once per activation
      if (!viewFired.current) {
        viewFired.current = true;
        incrementReelView(reel.id);
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, reel.id]);

  const handleVideoClick = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleLike = async () => {
    const prev = localLike;
    setLocalLike(!prev);
    setLocalLikeCount(prev ? localLikeCount - 1 : localLikeCount + 1);
    try {
      const res = await toggleReelLike(reel.id);
      setLocalLike(res.is_liked);
      setLocalLikeCount(res.likes_count);
    } catch {
      setLocalLike(prev);
      setLocalLikeCount(prev ? localLikeCount : localLikeCount - 1);
    }
  };

  const handleSave = async () => {
    const prev = localSave;
    setLocalSave(!prev);
    setLocalSaveCount(prev ? localSaveCount - 1 : localSaveCount + 1);
    try {
      const res = await toggleReelSave(reel.id);
      setLocalSave(res.is_saved);
      setLocalSaveCount(res.saves_count);
    } catch {
      setLocalSave(prev);
    }
  };

  const handleShare = () => {
    const shareText = reel.service_name
      ? `Check out "${reel.service_name}" at ${reel.salon_name}!`
      : `Check out this reel from ${reel.salon_name}!`;
    if (navigator.share) {
      navigator.share({ title: shareText, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const handleBook = () => {
    if (reel.salon_id) {
      navigate(`/dashboard/salon/${reel.salon_id}`);
    } else {
      navigate('/dashboard/services');
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] md:h-[820px] max-w-sm mx-auto snap-center bg-black overflow-hidden shadow-2xl md:rounded-3xl border border-zinc-800">

      {/* ── Video ── */}
      {videoError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-3">
          <FiAlertTriangle className="text-zinc-500 text-4xl" />
          <p className="text-zinc-400 text-sm">Unable to load reel</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={reel.video_url}
          poster={reel.thumbnail_url}
          className="w-full h-full object-cover cursor-pointer"
          loop playsInline muted={false}
          onClick={handleVideoClick}
          onError={() => setVideoError(true)}
        />
      )}

      {/* ── Pause overlay ── */}
      {!isPlaying && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/25">
          <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80">
            <FiPlay size={38} className="ml-2" />
          </div>
        </div>
      )}

      {/* ── Top meta (category badge) ── */}
      {reel.category && (
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/10">
            {reel.category}
          </span>
        </div>
      )}

      {/* ── Right Side Actions ── */}
      <div className="absolute right-3 bottom-40 flex flex-col items-center gap-5 z-10 text-white">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/30 backdrop-blur-lg rounded-full flex items-center justify-center group-hover:bg-black/50 transition-all">
            <FiHeart
              size={24}
              className={`transition-all duration-200 ${localLike ? 'fill-red-500 text-red-500 scale-110' : 'text-white'}`}
            />
          </div>
          <span className="text-[10px] font-bold drop-shadow">{fmtNum(localLikeCount)}</span>
        </button>

        {/* Comment */}
        <button onClick={() => toast.info('Comments coming soon!')} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/30 backdrop-blur-lg rounded-full flex items-center justify-center group-hover:bg-black/50 transition-all">
            <FiMessageCircle size={24} className="text-white" />
          </div>
          <span className="text-[10px] font-bold drop-shadow">{fmtNum(reel.comments_count || 0)}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/30 backdrop-blur-lg rounded-full flex items-center justify-center group-hover:bg-black/50 transition-all">
            <FiShare2 size={24} className="text-white" />
          </div>
          <span className="text-[10px] font-bold drop-shadow">{fmtNum(reel.shares_count || 0)}</span>
        </button>

        {/* Save */}
        <button onClick={handleSave} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/30 backdrop-blur-lg rounded-full flex items-center justify-center group-hover:bg-black/50 transition-all">
            {localSave
              ? <FaBookmark size={22} className="text-violet-400" />
              : <FaRegBookmark size={22} className="text-white" />}
          </div>
          <span className="text-[10px] font-bold drop-shadow">{fmtNum(localSaveCount)}</span>
        </button>
      </div>

      {/* ── Bottom Info Overlay ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex flex-col gap-2.5">
        {/* Parlour identity */}
        <div className="flex items-center gap-2.5">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(reel.salon_name || 'S')}&background=7c3aed&color=fff&size=40`}
            alt="parlour"
            className="w-10 h-10 rounded-full border-2 border-white/70 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-white font-black text-sm truncate">{reel.salon_name || 'Beauty Studio'}</p>
              <span className="shrink-0 bg-violet-600/80 backdrop-blur text-[9px] font-bold px-1.5 py-0.5 rounded text-white">PRO</span>
            </div>
            {reel.stylist_name && (
              <p className="text-white/60 text-[10px]">by {reel.stylist_name}</p>
            )}
          </div>
        </div>

        {/* Caption */}
        {reel.caption && (
          <p className="text-white/90 text-xs leading-relaxed line-clamp-2">{reel.caption}</p>
        )}

        {/* Service tag */}
        {reel.service_name && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 bg-white/10 backdrop-blur text-white text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/20">
              <FiTag size={9} />
              {reel.service_name}
            </span>
            {reel.service_price > 0 && (
              <span className="flex items-center gap-1 bg-emerald-500/20 backdrop-blur text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-400/30">
                <FiDollarSign size={9} />
                Starting {fmt(reel.service_price)}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleBook}
          className="w-full py-3 bg-white text-zinc-900 rounded-xl font-black text-sm
                     flex items-center justify-center gap-2 hover:bg-violet-50 active:scale-[0.97]
                     transition-all shadow-xl"
        >
          <FiCalendar size={15} />
          {reel.service_name ? `Book ${reel.service_name}` : 'Book This Stylist'}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER REEL CARD — Management view
// ─────────────────────────────────────────────────────────────────────────────
const OwnerReelCard = ({ reel, onDelete }) => {
  const [deleting, setDeleting] = useState(false);
  const a = reel.analytics || {};

  const handleDelete = async () => {
    if (!window.confirm(`Delete reel "${reel.caption || reel.service_name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteReel(reel.id);
      toast.success('Reel deleted');
      onDelete(reel.id);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to delete reel');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-violet-600/40 transition-all">
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] max-h-52 bg-zinc-800 overflow-hidden">
        <img
          src={reel.thumbnail_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(reel.salon_name || 'R')}&background=333&color=999&size=200`}
          alt={reel.caption || 'Reel'}
          className="w-full h-full object-cover"
        />
        {/* overlay: delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-2 right-2 w-8 h-8 bg-red-600/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all"
          title="Delete reel"
        >
          {deleting
            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <FiTrash2 size={13} />}
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2">
        {reel.service_name && (
          <div className="flex items-center gap-1 text-violet-400 text-[11px] font-semibold">
            <FiTag size={9} /> {reel.service_name}
            {reel.service_price > 0 && <span className="ml-auto text-emerald-400">{fmt(reel.service_price)}</span>}
          </div>
        )}
        {reel.caption && (
          <p className="text-zinc-300 text-[11px] line-clamp-2 leading-relaxed">{reel.caption}</p>
        )}

        {/* Analytics row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
          {[
            { label: 'Views',  val: fmtNum(a.views  || 0), icon: <FiEye size={10} />        },
            { label: 'Likes',  val: fmtNum(a.likes  || 0), icon: <FiHeart size={10} />      },
            { label: 'Shares', val: fmtNum(a.shares || 0), icon: <FiShare2 size={10} />     },
            { label: 'Saves',  val: fmtNum(a.saves  || 0), icon: <FiBookmark size={10} />   },
            { label: 'CTR',    val: `${a.ctr || 0}%`,      icon: <FiBarChart2 size={10} />  },
            { label: 'Cmts',   val: fmtNum(a.comments || 0), icon: <FiMessageCircle size={10} /> },
          ].map(({ label, val, icon }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-0.5 text-zinc-400 mb-0.5">{icon}</div>
              <p className="text-white text-[11px] font-bold">{val}</p>
              <p className="text-zinc-500 text-[9px]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD MODAL (shared, used by both views)
// ─────────────────────────────────────────────────────────────────────────────
const UploadModal = ({ onClose, onSuccess }) => {
  const [uploadFile, setUploadFile]       = useState(null);
  const [caption, setCaption]             = useState('');
  const [serviceName, setServiceName]     = useState('');
  const [servicePrice, setServicePrice]   = useState('');
  const [category, setCategory]           = useState('General');
  const [isUploading, setIsUploading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) { toast.error('Please select a video'); return; }

    setIsUploading(true);
    const fd = new FormData();
    fd.append('video', uploadFile);
    fd.append('caption', caption);
    fd.append('service_name', serviceName);
    fd.append('service_price', servicePrice || 0);
    fd.append('category', category);

    try {
      const res = await uploadReel(fd);
      toast.success(res.message || 'Reel published!');
      onSuccess(res.reel);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <h2 className="text-lg font-black text-white">Create New Reel</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <FiX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File picker */}
          <div className="relative border-2 border-dashed border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-violet-600 transition-colors bg-zinc-800/40 cursor-pointer">
            <FiUploadCloud size={36} className="text-violet-400 mb-2" />
            <span className="text-zinc-300 font-semibold text-sm mb-1">
              {uploadFile ? uploadFile.name : 'Tap to upload video'}
            </span>
            <span className="text-zinc-500 text-xs">MP4, WebM · up to 50 MB</span>
            <input
              type="file" accept="video/*"
              onChange={(e) => e.target.files?.[0] && setUploadFile(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Service tag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                Service Name
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Balayage"
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-600 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                Price (₹)
              </label>
              <input
                type="number"
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
                placeholder="e.g. 2500"
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-600 placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-600"
            >
              {['Hair','Skin','Spa','Makeup','Nail','General'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
              Caption & Hashtags
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a catchy description..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-600 resize-none placeholder:text-zinc-600"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading || !uploadFile}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black rounded-xl
                       hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing…
              </>
            ) : 'Publish Reel'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — ReelsFeed
// ─────────────────────────────────────────────────────────────────────────────
export default function ReelsFeed() {
  const { role } = useAuth();
  const isOwner  = role === 'shop_owner' || role === 'admin';

  const [view, setView]             = useState(isOwner ? 'manage' : 'feed'); // 'feed' | 'manage'
  const [reels, setReels]           = useState([]);
  const [ownerReels, setOwnerReels] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [apiError, setApiError]     = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeCat, setActiveCat]   = useState('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const containerRef = useRef(null);

  // ── Load customer feed ────────────────────────────────────────────────────
  const loadFeed = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    try {
      const cat = activeCat === 'All' ? undefined : activeCat;
      const res = await getReelsFeed(cat);
      setReels(res);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, [activeCat]);

  // ── Load owner reels ──────────────────────────────────────────────────────
  const loadOwnerReels = useCallback(async () => {
    if (!isOwner) return;
    setLoading(true);
    try {
      const res = await getOwnerReels();
      setOwnerReels(res);
    } catch {
      toast.error('Failed to load your reels');
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    if (view === 'feed')   loadFeed();
    if (view === 'manage') loadOwnerReels();
  }, [view, loadFeed, loadOwnerReels]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const idx = Math.round(scrollTop / clientHeight);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const handleUploadSuccess = (newReel) => {
    if (view === 'feed')   setReels((p) => [newReel, ...p]);
    if (view === 'manage') setOwnerReels((p) => [newReel, ...p]);
    if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (deletedId) => {
    setOwnerReels((p) => p.filter((r) => r.id !== deletedId));
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-zinc-950 min-h-screen relative overflow-hidden">

      {/* ── TOP BAR ── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center gap-1">
          <span className="text-white font-black text-base">Beauty Reels</span>
          <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse ml-1" />
        </div>

        {/* View toggle (only for shop owners) */}
        {isOwner && (
          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            {[
              { key: 'feed',   label: 'Discover' },
              { key: 'manage', label: 'My Reels'  },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`px-3.5 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                  view === key
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Upload FAB */}
        <button
          onClick={() => setIsUploadOpen(true)}
          className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-violet-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
          aria-label="Upload reel"
        >
          <FiPlus size={20} />
        </button>
      </div>

      {/* ── FEED VIEW — Customer Discovery ── */}
      {view === 'feed' && (
        <>
          {/* Category pills */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-b border-zinc-800">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`shrink-0 px-3.5 py-1.5 text-[11px] font-bold rounded-full whitespace-nowrap transition-all border ${
                  activeCat === cat
                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                    : 'text-zinc-400 border-zinc-800 hover:border-violet-600/40 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center pt-10">
              <ReelSkeleton />
            </div>
          ) : apiError ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-8">
              <FiAlertTriangle className="text-zinc-500 text-4xl" />
              <p className="text-zinc-400 text-sm font-medium">Unable to load beauty feed</p>
              <button
                onClick={loadFeed}
                className="px-5 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : reels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-8">
              <FiPlay className="text-zinc-600 text-5xl" />
              <p className="text-zinc-400 font-bold">No beauty reels available</p>
              <p className="text-zinc-600 text-xs">
                {activeCat !== 'All'
                  ? `No reels in "${activeCat}" category yet.`
                  : 'Parlours haven\'t posted any reels yet.'}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <div
                ref={containerRef}
                onScroll={handleScroll}
                className="w-full max-w-sm h-[calc(100vh-160px)] snap-y snap-mandatory overflow-y-scroll overflow-x-hidden no-scrollbar"
              >
                {reels.map((reel, index) => (
                  <ReelVideo key={reel.id} reel={reel} isActive={index === activeIndex} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MANAGE VIEW — Shop Owner ── */}
      {view === 'manage' && isOwner && (
        <div className="px-4 py-4 max-w-4xl mx-auto">
          {/* Summary strip */}
          {ownerReels.length > 0 && (() => {
            const totViews  = ownerReels.reduce((s, r) => s + (r.analytics?.views  || 0), 0);
            const totLikes  = ownerReels.reduce((s, r) => s + (r.analytics?.likes  || 0), 0);
            const totShares = ownerReels.reduce((s, r) => s + (r.analytics?.shares || 0), 0);
            return (
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Total Views',  val: fmtNum(totViews),  icon: <FiEye size={16} />,     color: 'text-blue-400'   },
                  { label: 'Total Likes',  val: fmtNum(totLikes),  icon: <FiHeart size={16} />,   color: 'text-red-400'    },
                  { label: 'Total Shares', val: fmtNum(totShares), icon: <FiShare2 size={16} />,  color: 'text-violet-400' },
                ].map(({ label, val, icon, color }) => (
                  <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                    <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
                    <p className="text-white text-lg font-black">{val}</p>
                    <p className="text-zinc-500 text-[10px]">{label}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[9/16] max-h-52 bg-zinc-800" />
                  <div className="p-3 space-y-2">
                    <div className="h-2 bg-zinc-800 rounded w-3/4" />
                    <div className="h-2 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : ownerReels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <FiUploadCloud className="text-zinc-600 text-5xl" />
              <p className="text-zinc-400 font-bold">No reels published yet</p>
              <p className="text-zinc-600 text-xs max-w-xs">
                Upload your first beauty reel to showcase your services and attract customers.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-6 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors"
              >
                Upload First Reel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ownerReels.map((reel) => (
                <OwnerReelCard key={reel.id} reel={reel} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Upload Modal ── */}
      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Hide scrollbars */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
