import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DemoModal from '../components/DemoModal';
import { getDemoResultById } from '../data/demoData';

const PRICING = [
  {
    name: 'Free',
    price: '₹0',
    priceUSD: '$0',
    period: '/month',
    badge: null,
    tier: 'free',
    features: [
      '10 AI skin scans/month',
      'Basic salon discovery',
      'Appointment booking',
      '30-day history',
      'Community support',
    ],
    cta: 'Get Started Free',
    link: '/signup',
  },
  {
    name: 'Premium',
    price: '₹299',
    priceUSD: '$4',
    period: '/month',
    badge: 'Most Popular',
    tier: 'premium',
    features: [
      'Unlimited AI scans',
      'Advanced skin insights',
      'Skin journey tracking',
      'Goals & evolution tracker',
      'Routine AI builder',
      'Priority support',
      'Export PDF reports',
    ],
    cta: 'Start Premium',
    link: '/signup',
  },
  {
    name: 'Business',
    price: '₹999',
    priceUSD: '$12',
    period: '/month',
    badge: 'For Salons',
    tier: 'business',
    features: [
      'Full Shop Owner Dashboard',
      'Staff & HR management',
      'Inventory & POS system',
      'AI marketing campaigns',
      'Franchise HQ (multi-branch)',
      'Supply chain & B2B orders',
      'API access & webhooks',
      'Custom intake forms',
    ],
    cta: 'Register My Salon',
    link: '/shop-owner/signup',
  },
];

/* ── Icon wrappers for feature cards (no emojis in the display layer) ── */
const FeatureIcon = ({ color, children }) => (
  <div
    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-xl shrink-0"
    style={{ background: color + '18', color }}
  >
    {children}
  </div>
);

/* SVG Icons — self-contained, no extra dep */
const IconMicroscope = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M10 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/><path d="M14 8V5a2 2 0 0 0-4 0v3"/><path d="M10 14v.01"/><path d="M4 20h16"/>
  </svg>
);
const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconSparkles = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-4.2-6.8-2.1 2.1M8.3 15.7l-2.1 2.1m0-11.3 2.1 2.1m7.3 7.3 2.1 2.1"/>
  </svg>
);
const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconBarChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconCreditCard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconPackage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
  </svg>
);
const IconMegaphone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="m3 11 19-9-9 19-2-8-8-2z"/>
  </svg>
);
const IconGlobe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const FEATURES_CUSTOMER = [
  { icon: <IconMicroscope />, color: '#5B4FF7', title: 'AI Skin Analysis', desc: 'DenseNet-201 powered scan with 97% accuracy. Get acne, oiliness & skin type readings instantly.' },
  { icon: <IconMapPin />,     color: '#0EA5E9', title: 'Salon Discovery',  desc: 'Find top-rated salons, parlours & spas near you. Real-time slot availability.' },
  { icon: <IconSparkles />,  color: '#EC4899', title: 'Virtual Try-On AR', desc: 'Experiment with makeup shades & hair colours using precision AR mirror.' },
  { icon: <IconTarget />,    color: '#F59E0B', title: 'Goals Tracker',     desc: 'Set skin goals and track your glow-up journey over weeks and months.' },
  { icon: <IconSearch />,    color: '#10B981', title: 'Ingredient Scanner', desc: 'Scan any beauty product label. AI flags harmful ingredients instantly.' },
  { icon: <IconChat />,      color: '#8B5CF6', title: 'Expert Consultation', desc: 'Chat with certified dermatologists and beauty professionals.' },
];

const FEATURES_BUSINESS = [
  { icon: <IconBarChart />,   color: '#5B4FF7', title: 'AI Business Insights', desc: 'Revenue forecasts, peak hours analysis, and customer retention metrics.' },
  { icon: <IconUsers />,     color: '#0EA5E9', title: 'Staff Management',     desc: 'Schedules, commissions, attendance tracking for your full team.' },
  { icon: <IconCreditCard />,color: '#10B981', title: 'POS & Billing',        desc: 'Integrated point-of-sale, GST invoicing, and payment tracking.' },
  { icon: <IconPackage />,   color: '#F59E0B', title: 'Smart Inventory',      desc: 'Real-time stock levels, low-stock alerts, and vendor management.' },
  { icon: <IconMegaphone />, color: '#EC4899', title: 'Campaign Builder',     desc: 'AI-generated WhatsApp, SMS & email campaigns to re-engage customers.' },
  { icon: <IconGlobe />,     color: '#8B5CF6', title: 'Franchise HQ',         desc: 'Manage multiple branches from one dashboard with network analytics.' },
];

const COUNTRIES = ['India', 'UAE', 'Singapore', 'UK', 'USA', 'Australia', 'Saudi Arabia', 'Malaysia', 'Bangladesh', 'Pakistan', 'Canada', 'South Africa'];

const TESTIMONIALS = [
  { name: 'Priya S.', initials: 'PS', role: 'Beauty Enthusiast', location: 'Chennai, India', text: 'The AI scan told me exactly what my skin needed. My acne cleared in 3 weeks following the routine!', gradient: 'from-violet-500 to-pink-500' },
  { name: 'Rania K.', initials: 'RK', role: 'Salon Owner', location: 'Dubai, UAE', text: 'GlowAI doubled our bookings in 2 months. The campaign tool alone paid for the subscription 10x over.', gradient: 'from-blue-500 to-teal-500' },
  { name: 'Meera V.', initials: 'MV', role: 'Premium Member', location: 'Singapore', text: 'I love the skin journey tracker. Seeing my before/after progress photos keeps me motivated every day.', gradient: 'from-amber-500 to-rose-500' },
];

/* ── Section label pill (no emojis) ── */
const SectionPill = ({ children, color = 'violet' }) => {
  const colors = {
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    teal:   'bg-teal-50 text-teal-700 border-teal-100',
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    slate:  'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <div className={`inline-flex items-center border px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4 ${colors[color]}`}>
      {children}
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [mode, setMode] = useState('customer');
  const [currency, setCurrency] = useState('INR');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDemoSelect = (demoId) => {
    const demoData = getDemoResultById(demoId);
    if (demoData) {
      sessionStorage.setItem('demoResult', JSON.stringify(demoData));
      navigate('/demo-results');
    }
  };

  const features = mode === 'customer' ? FEATURES_CUSTOMER : FEATURES_BUSINESS;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: "'Inter', 'SF Pro Display', 'Segoe UI', sans-serif" }}>

      {/* ── Sticky Navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#5B4FF7] to-[#7C6CF9] rounded-xl flex items-center justify-center text-white font-black text-sm">
              G
            </div>
            <div>
              <span
                className="font-black text-[17px] tracking-tight"
                style={{ background: 'linear-gradient(90deg,#5B4FF7,#7C6CF9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                GlowAI
              </span>
              <span className="text-[9px] text-slate-400 block leading-none font-semibold tracking-widest uppercase">Beauty Platform</span>
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-slate-500">
            <a href="#features" className="hover:text-[#5B4FF7] transition-colors duration-150">Features</a>
            <a href="#pricing"  className="hover:text-[#5B4FF7] transition-colors duration-150">Pricing</a>
            <a href="#global"   className="hover:text-[#5B4FF7] transition-colors duration-150">Global</a>
            <a href="#testimonials" className="hover:text-[#5B4FF7] transition-colors duration-150">Reviews</a>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="hidden md:block text-[12px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5B4FF7]/20 cursor-pointer"
              aria-label="Select currency"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="GBP">GBP</option>
            </select>
            <Link
              to="/login"
              className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-[#5B4FF7] transition-colors duration-150"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold bg-[#5B4FF7] text-white rounded-xl hover:bg-[#4a41d4] transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-[#5B4FF7]/20"
            >
              Get Started
              <IconChevronRight />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5F3FF] via-white to-[#F0FDFB]" />
        <div className="absolute top-20 left-10 w-80 h-80 bg-[#5B4FF7] rounded-full mix-blend-multiply blur-3xl opacity-[0.07] animate-blob" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply blur-3xl opacity-[0.07] animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply blur-3xl opacity-[0.05] animate-blob animation-delay-4000" />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 text-center pt-28 pb-20">

          {/* ── Mode Toggle — perfectly centered ── */}
          <div className="flex justify-center mb-7">
            <div
              className="inline-flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm"
              role="group"
              aria-label="View mode selector"
            >
              <button
                onClick={() => setMode('customer')}
                className={`px-6 py-2.5 text-[13px] font-bold rounded-[10px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4FF7] ${
                  mode === 'customer'
                    ? 'bg-gradient-to-r from-[#5B4FF7] to-[#7C6CF9] text-white shadow-md shadow-[#5B4FF7]/20'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                For Customers
              </button>
              <button
                onClick={() => setMode('shop')}
                className={`px-6 py-2.5 text-[13px] font-bold rounded-[10px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  mode === 'shop'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                For Salons
              </button>
            </div>
          </div>

          {/* ── Trust badge — enterprise grade, no emoji ── */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-0 border border-slate-200 bg-white/70 backdrop-blur-sm rounded-full px-5 py-2 shadow-xs">
              {/* <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                Global Presence in 12 Countries
              </span> */}
              {/* <span className="mx-3 text-slate-300 text-xs font-light">•</span> */}
              {/* <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                Trusted by 50,000+ Customers
              </span> */}
            </div>
          </div>

          {/* ── Hero content — customer mode ── */}
          {mode === 'customer' ? (
            <>
              <h1 className="text-5xl md:text-7xl font-black mb-5 text-slate-900 leading-[1.05] tracking-tight">
                Your AI-Powered<br />
                <span style={{ background: 'linear-gradient(135deg,#5B4FF7,#EC4899,#0EA5E9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Beauty Consultant
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 mb-8 max-w-2xl mx-auto font-medium leading-relaxed">
                Instant skin analysis, salon discovery, virtual try-on, and personalized routines — all powered by AI. Available worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#5B4FF7] text-white font-bold rounded-2xl shadow-lg shadow-[#5B4FF7]/25 hover:bg-[#4a41d4] hover:shadow-xl hover:shadow-[#5B4FF7]/30 hover:-translate-y-0.5 transition-all duration-200"
                >
                  Start for Free — No Card Required
                  <IconArrowRight />
                </Link>
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:border-[#5B4FF7]/40 hover:text-[#5B4FF7] hover:shadow-lg transition-all duration-200"
                >
                  Try AI Skin Demo
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-7xl font-black mb-5 text-slate-900 leading-[1.05] tracking-tight">
                Grow Your Salon<br />
                <span style={{ background: 'linear-gradient(135deg,#F59E0B,#F97316,#EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  With AI Business Tools
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 mb-8 max-w-2xl mx-auto font-medium leading-relaxed">
                Staff management, smart POS, inventory, AI campaigns, franchise HQ and more — the complete SaaS platform for beauty businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/shop-owner/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/25 hover:opacity-95 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  Register My Salon Free
                  <IconArrowRight />
                </Link>
                <Link
                  to="/shop-owner/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-amber-200 text-amber-700 font-bold rounded-2xl hover:border-amber-400 hover:shadow-lg transition-all duration-200"
                >
                  Partner Login
                  <IconChevronRight />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionPill color={mode === 'customer' ? 'violet' : 'teal'}>
              {mode === 'customer' ? 'Consumer Features' : 'Business Features'}
            </SectionPill>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
              {mode === 'customer' ? 'Everything for Your Glow-Up' : 'A Complete Business Operating System'}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-[15px] leading-relaxed">
              {mode === 'customer'
                ? 'From AI skin diagnosis to booking your favourite salon — all in one app.'
                : 'Every tool your salon needs to grow, retain customers, and scale globally.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-slate-100 bg-white hover:border-[#5B4FF7]/20 hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5 transition-all duration-200 cursor-default"
              >
                <FeatureIcon color={f.color}>
                  {f.icon}
                </FeatureIcon>
                <h3 className="font-bold text-slate-900 mb-2 text-[15px] group-hover:text-[#5B4FF7] transition-colors duration-150">
                  {f.title}
                </h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => setMode(mode === 'customer' ? 'shop' : 'customer')}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#5B4FF7] hover:text-[#4a41d4] transition-colors"
            >
              {mode === 'customer' ? 'View Business Features' : 'View Customer Features'}
              <IconChevronRight />
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionPill color="teal">Simple, Transparent Pricing</SectionPill>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Choose Your Plan</h2>
            <p className="text-slate-500 text-[15px]">All plans include a 14-day free trial. No credit card required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map(plan => (
              <div
                key={plan.name}
                className={`bg-white rounded-3xl border-2 p-8 relative transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                  plan.tier === 'premium'
                    ? 'border-[#5B4FF7] shadow-lg shadow-[#5B4FF7]/10'
                    : plan.tier === 'business'
                    ? 'border-amber-400 shadow-lg shadow-amber-400/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold text-white ${
                      plan.tier === 'premium'
                        ? 'bg-gradient-to-r from-[#5B4FF7] to-[#7C6CF9]'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <h3 className="text-[17px] font-black text-slate-900 mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-slate-900">
                      {currency === 'USD' ? plan.priceUSD : plan.price}
                    </span>
                    <span className="text-slate-400 font-semibold text-sm mb-1">{plan.period}</span>
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                      <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                        <IconCheck />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.link}
                  className={`flex items-center justify-center gap-1.5 w-full py-3 rounded-xl font-bold text-[13px] transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 ${
                    plan.tier === 'premium'
                      ? 'bg-[#5B4FF7] text-white hover:bg-[#4a41d4] shadow-md shadow-[#5B4FF7]/20 focus-visible:ring-[#5B4FF7]'
                      : plan.tier === 'business'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 shadow-md shadow-amber-400/20 focus-visible:ring-amber-500'
                      : 'bg-slate-900 text-white hover:bg-slate-700 focus-visible:ring-slate-700'
                  }`}
                >
                  {plan.cta}
                  <IconChevronRight />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Global Presence ── */}
      <section id="global" className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <SectionPill color="blue">Multinational Platform</SectionPill>
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Available Worldwide</h2>
          <p className="text-slate-500 mb-10 max-w-xl mx-auto text-[15px] leading-relaxed">
            GlowAI supports 12 countries with local currency, RTL languages (Arabic), and region-specific beauty preferences.
          </p>

          <div className="flex flex-wrap justify-center gap-2.5">
            {COUNTRIES.map(c => (
              <div
                key={c}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-[13px] font-semibold text-slate-600 hover:bg-[#5B4FF7]/5 hover:border-[#5B4FF7]/30 hover:text-[#5B4FF7] transition-all duration-150 cursor-default"
              >
                {c}
              </div>
            ))}
          </div>

          <div className="mt-10 inline-flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
            {[
              { code: 'hi', label: 'हिन्दी' },
              { code: 'ar', label: 'عربي' },
              { code: 'ta', label: 'தமிழ்' },
              { code: 'es', label: 'Español' },
              { code: 'fr', label: 'Français' },
              { code: 'en', label: 'English' },
            ].map(l => (
              <div
                key={l.code}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-semibold"
              >
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionPill color="violet">Customer Stories</SectionPill>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Loved Worldwide</h2>
            <p className="text-slate-500 text-[15px]">Join thousands of happy customers and growing businesses.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5 transition-all duration-200">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-slate-600 text-[13px] leading-relaxed italic mb-5">"{t.text}"</p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-[11px] font-black shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-[13px]">{t.name}</div>
                    <div className="text-[11px] text-slate-400">{t.role} · {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5B4FF7]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            {mode === 'customer' ? 'Ready to Glow Up?' : 'Ready to Scale Your Business?'}
          </h2>
          <p className="text-slate-400 mb-8 text-[17px] leading-relaxed">
            {mode === 'customer'
              ? 'Join 50,000+ customers across 12 countries. Free forever.'
              : 'Join 500+ salons growing with AI-powered business tools.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={mode === 'customer' ? '/signup' : '/shop-owner/signup'}
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-[#5B4FF7] to-[#7C6CF9] text-white font-black rounded-2xl hover:shadow-2xl hover:shadow-[#5B4FF7]/30 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4FF7]/60"
            >
              {mode === 'customer' ? 'Get Started Free' : 'Register My Salon'}
              <IconArrowRight />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-10 py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/15 hover:bg-white/15 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 py-8 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-[#5B4FF7] to-[#7C6CF9] rounded-lg flex items-center justify-center text-white text-xs font-black">G</div>
            <span className="font-black text-white text-[14px]">GlowAI</span>
            <span className="text-slate-500 text-[12px] ml-1">Multinational SaaS Beauty Platform</span>
          </div>
          <div className="flex items-center gap-6 text-[12px] text-slate-500">
            <span>© 2025 GlowAI</span>
            <a href="#" className="hover:text-white transition-colors" aria-label="Privacy policy">Privacy</a>
            <a href="#" className="hover:text-white transition-colors" aria-label="Terms of service">Terms</a>
            <a href="#" className="hover:text-white transition-colors" aria-label="Contact us">Contact</a>
          </div>
        </div>
      </footer>

      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} onSelectDemo={handleDemoSelect} />
    </div>
  );
};

export default LandingPage;
