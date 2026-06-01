import React, { useState, useEffect, useRef } from 'react';
import { FiHeart, FiMessageCircle, FiShare2, FiPlay, FiCalendar, FiPlus, FiX, FiUploadCloud } from 'react-icons/fi';
import { getReelsFeed, toggleReelLike, uploadReel } from '../../services/reelsApi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const ReelVideo = ({ reel, isActive }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localLike, setLocalLike] = useState(reel.is_liked);
  const [localLikeCount, setLocalLikeCount] = useState(reel.likes_count);
  const navigate = useNavigate();

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleLike = async () => {
    try {
      const prevLiked = localLike;
      setLocalLike(!prevLiked);
      setLocalLikeCount(prevLiked ? localLikeCount - 1 : localLikeCount + 1);
      
      const res = await toggleReelLike(reel.id);
      setLocalLike(res.is_liked);
      setLocalLikeCount(res.likes_count);
    } catch (e) {
      toast.error('Failed to like reel');
    }
  };

  const handleBook = () => {
    navigate(`/dashboard/salon/${reel.salon_id}`);
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] md:h-[850px] max-w-md mx-auto snap-center bg-black overflow-hidden shadow-2xl md:rounded-3xl border border-slate-800">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.thumbnail_url}
        className="w-full h-full object-cover cursor-pointer"
        loop
        playsInline
        muted={false}
        onClick={handleVideoClick}
      />

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80">
            <FiPlay size={40} className="ml-2" />
          </div>
        </div>
      )}

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-10 drop-shadow-md text-white">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 bg-black/20 backdrop-blur-lg rounded-full flex items-center justify-center group-hover:bg-black/40 transition-all">
            <FiHeart size={26} className={`transition-transform duration-300 ${localLike ? 'fill-red-500 text-red-500 scale-110' : 'text-white group-hover:scale-110'}`} />
          </div>
          <span className="text-xs font-black drop-shadow-lg">{localLikeCount}</span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center gap-1 group" onClick={() => toast.info('Comments coming soon!')}>
          <div className="w-12 h-12 bg-black/20 backdrop-blur-lg rounded-full flex items-center justify-center group-hover:bg-black/40 transition-all">
            <FiMessageCircle size={26} className="text-white group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xs font-black drop-shadow-lg">{reel.comments_count}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1 group" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
          <div className="w-12 h-12 bg-black/20 backdrop-blur-lg rounded-full flex items-center justify-center group-hover:bg-black/40 transition-all">
            <FiShare2 size={26} className="text-white group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xs font-black drop-shadow-lg">{reel.shares_count}</span>
        </button>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 flex flex-col gap-3">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-800 shrink-0">
             <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(reel.salon_name)}&background=random`} alt="avatar" className="w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white truncate text-base">{reel.salon_name}</h3>
              <span className="bg-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded text-white shrink-0">PRO</span>
            </div>
            <p className="text-xs font-medium text-white/80">Stylist: {reel.stylist_name}</p>
          </div>
        </div>

        {/* Caption */}
        <p className="text-sm text-white line-clamp-2 leading-relaxed">
          {reel.caption}
        </p>

        {/* Booking CTA */}
        <button 
          onClick={handleBook}
          className="w-full py-3.5 bg-white text-slate-900 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-95 transition-all shadow-xl"
        >
          <FiCalendar /> Book This Stylist
        </button>
      </div>
    </div>
  );
};

export default function ReelsFeed() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const res = await getReelsFeed();
      setReels(res);
    } catch (e) {
      toast.error('Failed to load beauty feed');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error("Please select a video to upload");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('video', uploadFile);
    formData.append('caption', uploadCaption);

    try {
      const res = await uploadReel(formData);
      toast.success(res.message || "Reel uploaded!");
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadCaption('');
      // Reload the feed to show the new reel at the top
      loadReels();
      // Scroll to top
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to upload reel");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading && reels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-slate-900">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="md:p-4 bg-slate-950 min-h-screen flex items-center justify-center overflow-hidden relative">
      
      {/* Upload FAB */}
      <button 
        onClick={() => setIsUploadOpen(true)}
        className="absolute top-6 right-6 md:top-10 md:right-10 z-50 w-14 h-14 bg-gradient-to-tr from-pink-500 to-indigo-500 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:scale-110 active:scale-95 transition-all"
      >
        <FiPlus size={28} />
      </button>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-700 overflow-hidden relative">
            <button 
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <FiX size={24} />
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-black text-white mb-6">Create New Reel</h2>
              <form onSubmit={handleUploadSubmit} className="space-y-6">
                
                {/* File Drop/Select Area */}
                <div className="relative border-2 border-dashed border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition-colors bg-slate-800/50">
                  <FiUploadCloud size={40} className="text-indigo-400 mb-3" />
                  <span className="text-slate-300 font-medium mb-1">
                    {uploadFile ? uploadFile.name : "Tap to upload video"}
                  </span>
                  <span className="text-xs text-slate-500">MP4, WebM up to 50MB</span>
                  <input 
                    type="file" 
                    accept="video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {/* Caption Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Caption & Hashtags</label>
                  <textarea 
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    placeholder="Write a catchy description..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isUploading || !uploadFile}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Publish Reel"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reels Feed Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-[calc(100vh-80px)] md:h-[850px] snap-y snap-mandatory overflow-y-scroll overflow-x-hidden no-scrollbar md:rounded-3xl shadow-2xl relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        {reels.map((reel, index) => (
          <ReelVideo 
            key={reel.id} 
            reel={reel} 
            isActive={index === activeIndex} 
          />
        ))}

        {reels.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-white/50 text-center p-8">
            <FiPlay size={48} className="mb-4 opacity-50" />
            <h2 className="text-xl font-bold">No Reels Found</h2>
            <p className="text-sm mt-2">Salons haven't posted any transformations yet.</p>
          </div>
        )}
      </div>

      {/* Global CSS for hiding scrollbar specifically for this container */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
