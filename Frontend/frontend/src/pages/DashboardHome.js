import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaCamera, FaMagic, FaCut, FaPaintBrush, FaChartLine, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaCrown, FaArrowUp, FaShieldAlt, FaStethoscope, FaPalette, FaFileDownload } from 'react-icons/fa';
import { getUserRole, getUserStats } from '../services/premiumApi';
import { getHistory, getOnboardingStatus } from '../services/api';
import OnboardingWizard from '../components/OnboardingWizard';
import SkinScoreCard from '../components/SkinScoreCard';
import WeatherSkinTips from '../components/WeatherSkinTips';
import generateBeautyReport from '../utils/generateBeautyReport';
import { useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const DashboardHome = () => {
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [role, stats, history, onboarding] = await Promise.all([
          getUserRole(),
          getUserStats(),
          getHistory(),
          getOnboardingStatus()
        ]);
        setUserRole(role);
        setUserStats(stats);
        setHasCompletedOnboarding(onboarding.completed);
        if (!onboarding.completed) {
          setOnboardingOpen(true);
        }
        // Take top 3 most recent
        const historyArray = Array.isArray(history) ? history : [];
        setRecentAnalyses(historyArray.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const [recentAnalyses, setRecentAnalyses] = useState([]);

  // Skin Health Insights
  const skinInsights = [
    {
      title: 'Hydration Level',
      value: 'Good',
      percentage: 75,
      trend: 'up',
      color: 'from-blue-500 to-cyan-500',
      icon: <FaCheckCircle />
    },
    {
      title: 'Sun Protection',
      value: 'Needs Attention',
      percentage: 45,
      trend: 'down',
      color: 'from-orange-500 to-yellow-500',
      icon: <FaExclamationTriangle />
    },
    {
      title: 'Skin Texture',
      value: 'Excellent',
      percentage: 92,
      trend: 'up',
      color: 'from-green-500 to-emerald-500',
      icon: <FaCheckCircle />
    },
  ];

  const quickActions = [
    {
      title: 'Face Analysis',
      desc: 'Upload a photo for instant skin analysis',
      icon: <FaMagic className="text-4xl" />,
      link: '/dashboard/analyze',
      gradient: 'from-purple-600 to-teal-600',
      badge: 'Popular'
    },
    {
      title: 'Live Camera',
      desc: 'Real-time face analysis with your webcam',
      icon: <FaCamera className="text-4xl" />,
      link: '/dashboard/live-analyze',
      gradient: 'from-blue-600 to-cyan-600',
      badge: 'New'
    },
    // --- ROLE BASED QUICK ACTIONS ---
    ...(userRole?.role === "admin" ? [{
      title: 'Admin Console',
      desc: 'Manage users, view analytics and system health',
      icon: <FaShieldAlt className="text-4xl" />,
      link: '/dashboard/admin',
      gradient: 'from-red-600 to-rose-700',
      badge: 'Admin'
    }] : []),
    ...(userRole?.role === "expert" || userRole?.role === "admin" ? [{
      title: 'Review Queue',
      desc: 'Dermatologist portal for AI scan validation',
      icon: <FaStethoscope className="text-4xl" />,
      link: '/dashboard/expert',
      gradient: 'from-indigo-600 to-blue-700',
      badge: 'Expert'
    }] : []),
    {
      title: 'Expert Consult',
      desc: 'Book a 1:1 video call with a skin expert',
      icon: <FaStethoscope className="text-4xl" />,
      link: '/dashboard/services',
      gradient: 'from-purple-900 to-indigo-950',
      badge: 'PRO'
    },
    {
      title: 'Hair Styling',
      desc: 'Get personalized hairstyle recommendations',
      icon: <FaCut className="text-4xl" />,
      link: '/dashboard/hair-styling',
      gradient: 'from-orange-600 to-red-600',
    },
    {
      title: 'Nail Studio',
      desc: 'Discover nail art that matches your style',
      icon: <FaPaintBrush className="text-4xl" />,
      link: '/dashboard/nail-styling',
      gradient: 'from-teal-600 to-cyan-600',
      badge: 'New'
    },
    {
      title: 'Style Lookbook',
      desc: 'Personalized color palette & wardrobe',
      icon: <FaPalette className="text-4xl" />,
      link: '/dashboard/lookbook',
      gradient: 'from-rose-500 to-pink-600',
      badge: 'AI'
    },
  ];

  if (loading) return (
    <div className="p-10 space-y-10 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Skeleton height={200} borderRadius={40} baseColor="rgba(0,0,0,0.05)" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton height={180} borderRadius={30} baseColor="rgba(0,0,0,0.05)" />
        <Skeleton height={180} borderRadius={30} baseColor="rgba(0,0,0,0.05)" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton height={150} borderRadius={30} baseColor="rgba(0,0,0,0.05)" />
        <Skeleton height={150} borderRadius={30} baseColor="rgba(0,0,0,0.05)" />
        <Skeleton height={150} borderRadius={30} baseColor="rgba(0,0,0,0.05)" />
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-10 animate-fade-in bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">
      {/* Premium Status Banner */}
      {userRole && (
        userRole.is_premium ? (
          <div className="glass-card p-6 rounded-3xl bg-gradient-to-r from-yellow-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-900 border-2 border-yellow-300 dark:border-yellow-600/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-4 rounded-2xl">
                  <FaCrown className="text-3xl text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Premium Member
                  </h2>
                  <p className="text-gray-600">
                    Enjoying unlimited access until {userRole.subscription_end && new Date(userRole.subscription_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-3xl font-bold text-purple-600">
                  {userStats?.analysis_count_this_month || 0} <span className="text-lg text-gray-400">analyses</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-3xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl">
                  <FaArrowUp className="text-3xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Upgrade to Premium
                  </h2>
                  <p className="text-gray-600">
                    {userStats?.analysis_count_this_month || 0}/{userStats?.limits?.analysis_per_month || 10} analyses used this month
                  </p>
                </div>
              </div>
              <Link
                to="/premium"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )
      )}

      {/* Welcome Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-purple-100 dark:border-slate-800 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-teal-500/5 rounded-full blur-3xl -mr-48 -mt-48 group-hover:scale-110 transition-transform duration-1000"></div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic mb-2 relative z-10">
          {t('welcome')}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-teal-600">{localStorage.getItem('user_name')?.split(' ')[0] || 'Member'}!</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg relative z-10 font-medium">
          Your personalized AI-powered beauty consultant is ready to help you achieve your best look.
        </p>
      </div>

      {/* LIVE WEATHER SKIN TIPS */}
      <div className="animate-fade-in-up">
        <WeatherSkinTips />
      </div>

      {/* Skin Health Overview */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FaChartLine className="text-purple-600" />
          Your Skin Health Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {skinInsights.map((insight, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${insight.color} text-white text-xl`}>
                  {insight.icon}
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${insight.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                  {insight.trend === 'up' ? '↑ Improving' : '↓ Attention'}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">{insight.title}</h3>
              <p className="text-2xl font-bold text-gray-800 mb-3">{insight.value}</p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${insight.color} transition-all duration-500`}
                  style={{ width: `${insight.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{insight.percentage}% Optimal</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.link}
              className="glass-card p-6 rounded-2xl card-hover group relative overflow-hidden"
            >
              {/* Badge */}
              {action.badge && (
                <span className="absolute top-4 right-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  {action.badge}
                </span>
              )}

              {/* Icon */}
              <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${action.gradient} text-white mb-4 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-800 mb-2">{action.title}</h3>
              <p className="text-gray-600 text-sm">{action.desc}</p>

              {/* Hover Arrow */}
              <div className="mt-4 flex items-center text-purple-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Get Started
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Personalized Tips */}
      <div className="glass-card p-8 rounded-3xl bg-gradient-to-r from-purple-50 to-teal-50">
        <div className="flex items-center gap-2 mb-4">
          <FaInfoCircle className="text-purple-600 text-2xl" />
          <h2 className="text-2xl font-bold text-gray-800">Personalized Tips for You</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex gap-3 p-4 bg-white/60 rounded-xl">
            <div className="text-2xl">💧</div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Boost Hydration</h4>
              <p className="text-sm text-gray-600">Your skin shows signs of dehydration. Use a hyaluronic acid serum daily.</p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-white/60 rounded-xl">
            <div className="text-2xl">☀️</div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">SPF Protection</h4>
              <p className="text-sm text-gray-600">Apply SPF 50+ sunscreen every morning to prevent sun damage and dark spots.</p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-white/60 rounded-xl">
            <div className="text-2xl">🌙</div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Night Routine</h4>
              <p className="text-sm text-gray-600">Add a retinol treatment 2-3 times per week to improve skin texture.</p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-white/60 rounded-xl">
            <div className="text-2xl">🥗</div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Nutrition Matters</h4>
              <p className="text-sm text-gray-600">Increase vitamin C intake through citrus fruits for brighter, healthier skin.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Recent Analyses</h2>
          <Link to="/dashboard/history" className="text-purple-600 hover:text-teal-600 font-semibold text-sm flex items-center gap-1 transition-colors">
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid gap-4">
          {recentAnalyses.map((analysis, idx) => (
            <div key={idx} className="glass-card p-5 rounded-2xl hover:shadow-lg transition-all duration-300 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-teal-100 rounded-xl flex items-center justify-center">
                  <FaMagic className="text-purple-600 text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{(analysis.face_shape || "New") + " Face Analysis"}</p>
                  <p className="text-sm text-gray-500">{analysis.date || "Just now"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium">
                    {analysis.gender || "Analyzed"}
                  </span>
                </div>
                <FaCheckCircle className="text-green-500 text-xl" />
              </div>
            </div>
          ))}
          {recentAnalyses.length === 0 && (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400">No recent scans found.</p>
              <Link to="/dashboard/analyze" className="text-purple-600 font-bold text-sm mt-2 block">Start your first scan →</Link>
            </div>
          )}
        </div>
      </div>

      <OnboardingWizard
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={() => {
          setOnboardingOpen(false);
          setHasCompletedOnboarding(true);
        }}
      />


      {/* ── PDF BEAUTY REPORT ── */}
      <div className="mt-6 bg-gradient-to-r from-purple-600 to-teal-600 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-200 mb-1">New Feature</p>
          <h3 className="text-2xl font-black uppercase italic">Download Your Beauty Report</h3>
          <p className="text-purple-100 font-medium text-sm mt-1">Export a personalised 3-page PDF with your full seasonal analysis, colour palette, makeup & skincare guide.</p>
        </div>
        <button
          onClick={() => {
            const email = localStorage.getItem('email') || 'User';
            const username = email.includes('@') ? email.split('@')[0] : email;
            generateBeautyReport(recentAnalyses[0] || null, username);
          }}
          className="shrink-0 flex items-center gap-3 px-8 py-4 bg-white text-purple-700 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-purple-50 transition-all shadow-2xl"
        >
          <FaFileDownload /> Export PDF Report
        </button>
      </div>
    </div>
  );
};

export default DashboardHome;

