import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DemoModal from '../components/DemoModal';
import { getDemoResultById } from '../data/demoData';

const STATS = [
  { value: '50K+', label: 'Happy Customers', icon: '👥' },
  { value: '500+', label: 'Partner Salons', icon: '🏪' },
  { value: '98%', label: 'AI Accuracy', icon: '🎯' },
  { value: '12', label: 'Countries', icon: '🌍' },
];

const PRICING = [
  {
    name: 'Free',
    price: '₹0',
    priceUSD: '$0',
    period: '/month',
    badge: null,
    color: 'border-slate-200',
    btnClass: 'bg-slate-900 text-white hover:bg-slate-700',
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
    color: 'border-violet-500 ring-2 ring-violet-500',
    btnClass: 'bg-gradient-to-r from-violet-600 to-teal-600 text-white hover:opacity-90',
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
    color: 'border-amber-400 ring-2 ring-amber-400',
    btnClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90',
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

const FEATURES_CUSTOMER = [
  { emoji: '🔬', title: 'AI Skin Analysis', desc: 'DenseNet-201 powered scan with 97% accuracy. Get acne, oiliness & skin type readings instantly.' },
  { emoji: '📍', title: 'Salon Discovery', desc: 'Find top-rated salons, parlours & spas near you. Real-time slot availability.' },
  { emoji: '💄', title: 'Virtual Try-On AR', desc: 'Experiment with makeup shades & hair colours using precision AR mirror.' },
  { emoji: '🎯', title: 'Goals Tracker', desc: 'Set skin goals and track your glow-up journey over weeks and months.' },
  { emoji: '🌿', title: 'Ingredient Scanner', desc: 'Scan any beauty product label. AI flags harmful ingredients instantly.' },
  { emoji: '💬', title: 'Expert Consultation', desc: 'Chat with certified dermatologists and beauty professionals.' },
];

const FEATURES_BUSINESS = [
  { emoji: '📊', title: 'AI Business Insights', desc: 'Revenue forecasts, peak hours analysis, and customer retention metrics.' },
  { emoji: '👥', title: 'Staff Management', desc: 'Schedules, commissions, attendance tracking for your full team.' },
  { emoji: '💰', title: 'POS & Billing', desc: 'Integrated point-of-sale, GST invoicing, and payment tracking.' },
  { emoji: '📦', title: 'Smart Inventory', desc: 'Real-time stock levels, low-stock alerts, and vendor management.' },
  { emoji: '📣', title: 'Campaign Builder', desc: 'AI-generated WhatsApp, SMS & email campaigns to re-engage customers.' },
  { emoji: '🌐', title: 'Franchise HQ', desc: 'Manage multiple branches from one dashboard with network analytics.' },
];

const COUNTRIES = ['🇮🇳 India', '🇦🇪 UAE', '🇸🇬 Singapore', '🇬🇧 UK', '🇺🇸 USA', '🇦🇺 Australia', '🇸🇦 Saudi Arabia', '🇲🇾 Malaysia', '🇧🇩 Bangladesh', '🇵🇰 Pakistan', '🇨🇦 Canada', '🇿🇦 South Africa'];

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'Beauty Enthusiast', location: 'Chennai, India', text: 'The AI scan told me exactly what my skin needed. My acne cleared in 3 weeks following the routine!', avatar: '👩🏽' },
  { name: 'Rania K.', role: 'Salon Owner', location: 'Dubai, UAE', text: 'GlowAI doubled our bookings in 2 months. The campaign tool alone paid for the subscription 10x over.', avatar: '👩🏻' },
  { name: 'Meera V.', role: 'Premium Member', location: 'Singapore', text: 'I love the skin journey tracker. Seeing my before/after progress photos keeps me motivated every day.', avatar: '👩🏾' },
];

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
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Sticky Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-teal-500 rounded-xl flex items-center justify-center text-white text-base font-black">G</div>
            <div>
              <span className="font-black text-lg bg-gradient-to-r from-violet-700 to-teal-600 bg-clip-text text-transparent">GlowAI</span>
              <span className="text-[10px] text-slate-400 block leading-none font-semibold tracking-wide">Multinational SaaS</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-violet-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-violet-600 transition-colors">Pricing</a>
            <a href="#global" className="hover:text-violet-600 transition-colors">Global</a>
            <a href="#testimonials" className="hover:text-violet-600 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="hidden md:block text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="INR">🇮🇳 INR</option>
              <option value="USD">🇺🇸 USD</option>
              <option value="AED">🇦🇪 AED</option>
              <option value="GBP">🇬🇧 GBP</option>
            </select>
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-violet-600 transition-colors">Sign In</Link>
            <Link to="/signup" className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-violet-600 to-teal-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-teal-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply blur-3xl opacity-40 animate-blob" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-blob animation-delay-4000" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-24 pb-16">
          {/* Mode toggle */}
          <div className="inline-flex bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm mb-8">
            <button onClick={() => setMode('customer')} className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${mode === 'customer' ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              👩 For Customers
            </button>
            <button onClick={() => setMode('shop')} className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${mode === 'shop' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              🏪 For Salons
            </button>
          </div>

          {/* Global badge */}
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-black px-4 py-1.5 rounded-full mb-5 uppercase tracking-wider">
            🌍 Available in 12 Countries · Trusted by 50,000+ Users
          </div>

          {mode === 'customer' ? (
            <>
              <h1 className="text-5xl md:text-7xl font-black mb-5 text-slate-900 leading-[1.05] tracking-tight">
                Your AI-Powered<br />
                <span className="bg-gradient-to-r from-violet-600 via-pink-600 to-teal-600 bg-clip-text text-transparent">Beauty Consultant</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 mb-8 max-w-2xl mx-auto font-medium leading-relaxed">
                Instant skin analysis, salon discovery, virtual try-on, and personalized routines — all powered by AI. Available worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/signup" className="px-8 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  Start for Free — No Card Required 🚀
                </Link>
                <button onClick={() => setIsDemoModalOpen(true)} className="px-8 py-4 bg-white border-2 border-violet-200 text-violet-700 font-bold rounded-2xl hover:border-violet-400 hover:shadow-lg transition-all">
                  Try AI Skin Demo ✨
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-7xl font-black mb-5 text-slate-900 leading-[1.05] tracking-tight">
                Grow Your Salon<br />
                <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">With AI Business Tools</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 mb-8 max-w-2xl mx-auto font-medium leading-relaxed">
                Staff management, smart POS, inventory, AI campaigns, franchise HQ and more — the complete SaaS platform for beauty businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/shop-owner/signup" className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  Register My Salon Free 🏪
                </Link>
                <Link to="/shop-owner/login" className="px-8 py-4 bg-white border-2 border-amber-300 text-amber-700 font-bold rounded-2xl hover:border-amber-500 hover:shadow-lg transition-all">
                  Partner Login →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-3xl font-black text-white">{s.value}</div>
              <div className="text-xs text-slate-400 font-semibold mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
              {mode === 'customer' ? '✨ Consumer Features' : '🏢 Business Features'}
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              {mode === 'customer' ? 'Everything for Your Glow-Up' : 'A Complete Business Operating System'}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {mode === 'customer' ? 'From AI skin diagnosis to booking your favourite salon — all in one app.' : 'Every tool your salon needs to grow, retain customers, and scale globally.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="group p-6 rounded-2xl border border-slate-100 hover:border-violet-200 hover:shadow-lg hover:-translate-y-1 transition-all bg-white">
                <div className="text-4xl mb-3">{f.emoji}</div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-violet-700 transition-colors">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => setMode(mode === 'customer' ? 'shop' : 'customer')} className="text-sm font-bold text-violet-600 hover:text-violet-800 transition-colors underline underline-offset-4">
              {mode === 'customer' ? 'View Business Features →' : 'View Customer Features →'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
              💎 Simple, Transparent Pricing
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-3">Choose Your Plan</h2>
            <p className="text-slate-500">All plans include 14-day free trial. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map(plan => (
              <div key={plan.name} className={`bg-white rounded-3xl border-2 p-8 relative ${plan.color} transition-all hover:-translate-y-1 hover:shadow-xl`}>
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black text-white ${plan.name === 'Premium' ? 'bg-gradient-to-r from-violet-600 to-teal-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}>
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-slate-900">{currency === 'USD' ? plan.priceUSD : plan.price}</span>
                    <span className="text-slate-400 font-semibold text-sm mb-1">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-teal-500 font-black mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.link} className={`block w-full text-center py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105 ${plan.btnClass}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Global Presence ── */}
      <section id="global" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            🌍 Multinational Platform
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4">Available Worldwide</h2>
          <p className="text-slate-500 mb-10 max-w-xl mx-auto">GlowAI supports 12 countries with local currency, RTL languages (Arabic), and region-specific beauty preferences.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {COUNTRIES.map(c => (
              <div key={c} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-semibold text-slate-700 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-all cursor-default">
                {c}
              </div>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {['🇮🇳 हिन्दी', '🇸🇦 عربي', '🇮🇳 தமிழ்', '🇪🇸 Español', '🇫🇷 Français', '🇺🇸 English'].map(l => (
              <div key={l} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold text-center">{l}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-3">Loved Worldwide ⭐</h2>
            <p className="text-slate-500">Join thousands of happy customers and growing businesses.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">{t.avatar}</div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role} · {t.location}</div>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed italic">"{t.text}"</p>
                <div className="flex gap-0.5 mt-4">
                  {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            {mode === 'customer' ? 'Ready to Glow Up? 💅' : 'Ready to Grow? 🚀'}
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            {mode === 'customer' ? 'Join 50,000+ customers across 12 countries. Free forever.' : 'Join 500+ salons growing with AI-powered business tools.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={mode === 'customer' ? '/signup' : '/shop-owner/signup'}
              className="px-10 py-4 bg-gradient-to-r from-violet-600 to-teal-600 text-white font-black rounded-2xl hover:shadow-2xl hover:scale-105 transition-all">
              {mode === 'customer' ? 'Get Started Free →' : 'Register My Salon →'}
            </Link>
            <Link to="/login" className="px-10 py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 py-8 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-black">G</div>
            <span className="font-black text-white text-sm">GlowAI</span>
            <span className="text-slate-500 text-xs ml-2">Multinational SaaS Beauty Platform</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span>© 2025 GlowAI</span>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} onSelectDemo={handleDemoSelect} />
    </div>
  );
};

export default LandingPage;
