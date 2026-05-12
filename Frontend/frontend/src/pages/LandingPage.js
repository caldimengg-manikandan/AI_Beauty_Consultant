import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DemoModal from '../components/DemoModal';
import { getDemoResultById } from '../data/demoData';
import LanguageSwitcher from '../components/LanguageSwitcher';

const STATS = [
  { value: '500+', label: 'Salons & Parlours' },
  { value: '10K+', label: 'Happy Customers' },
  { value: '50K+', label: 'Slots Booked' },
  { value: '4.8★', label: 'Avg Rating' },
];

const FEATURES = [
  { emoji: '🔬', title: 'AI Skin Analysis', desc: 'DenseNet-201 powered analysis with 97% accuracy. Detect acne, oiliness, and get a personalised skincare routine instantly.' },
  { emoji: '🏪', title: 'Salon Marketplace', desc: 'Discover top-rated parlours, salons & spas near you. Real-time slot availability — skip the queue, book in seconds.' },
  { emoji: '⭐', title: 'Ratings & Reviews', desc: 'Honest community reviews help you pick the best shop. Rate your experience after every visit.' },
  { emoji: '💆‍♀️', title: 'Slot Booking', desc: 'Reserve your preferred time slot at any salon. No more waiting — walk in at your scheduled time.' },
  { emoji: '💄', title: 'Virtual Try-On AR', desc: 'Experiment with makeup shades and hair colours instantly using our high-precision AR mirror.' },
  { emoji: '🏬', title: 'Shop Owner Portal', desc: 'List your salon, manage bookings, see earnings, and connect directly with customers. Free to join.' },
];

const HOW_IT_WORKS_CUSTOMER = [
  { step: '01', title: 'Create Account', desc: 'Sign up in 30 seconds for free' },
  { step: '02', title: 'Find a Salon', desc: 'Browse salons near you by type, ratings & services' },
  { step: '03', title: 'Pick a Slot', desc: 'Choose your preferred date and available time slot' },
  { step: '04', title: 'Walk In & Enjoy', desc: 'Show your booking ref at the salon — zero wait time' },
];

const HOW_IT_WORKS_SHOP = [
  { step: '01', title: 'Register Your Shop', desc: 'Fill in your salon details and services' },
  { step: '02', title: 'Go Live', desc: 'Get listed on the marketplace instantly' },
  { step: '03', title: 'Manage Bookings', desc: 'View, confirm & complete customer slots' },
  { step: '04', title: 'Grow Your Business', desc: 'Build reviews, ratings and a loyal customer base' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [mode, setMode] = useState('customer'); // 'customer' | 'shop'

  const handleDemoSelect = (demoId) => {
    const demoData = getDemoResultById(demoId);
    if (demoData) {
      sessionStorage.setItem('demoResult', JSON.stringify(demoData));
      navigate('/demo-results');
    }
  };

  const steps = mode === 'customer' ? HOW_IT_WORKS_CUSTOMER : HOW_IT_WORKS_SHOP;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 relative overflow-hidden">

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-teal-600 rounded-xl flex items-center justify-center text-white text-lg">✨</div>
          <div>
            <span className="font-black text-xl bg-gradient-to-r from-purple-700 to-teal-600 bg-clip-text text-transparent">GlowAI</span>
            <span className="text-xs text-gray-400 block leading-none">Beauty Platform</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link to="/login" className="px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50 rounded-xl transition-colors">Sign In</Link>
          <Link to="/signup" className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-purple-600 to-teal-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-12 pb-20 px-4 text-center">
        {/* Mode switcher */}
        <div className="inline-flex bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-1.5 shadow-sm mb-10">
          <button
            onClick={() => setMode('customer')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === 'customer' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            👩 I'm a Customer
          </button>
          <button
            onClick={() => setMode('shop')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === 'shop' ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🏪 I'm a Shop Owner
          </button>
        </div>

        {mode === 'customer' ? (
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
              🌟 India's #1 Beauty Booking Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-purple-700 via-pink-600 to-teal-600 bg-clip-text text-transparent leading-tight">
              Book Your Beauty Experience
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Discover top-rated salons, parlours & spas near you. Get AI-powered skin analysis, book slots instantly, and skip the wait forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-base">
                Find Salons Near Me 📍
              </Link>
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-8 py-4 bg-white/90 backdrop-blur-sm border-2 border-purple-300 text-purple-700 font-bold rounded-2xl hover:shadow-xl hover:border-purple-500 hover:scale-105 transition-all text-base"
              >
                Try AI Skin Analysis ✨
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
              🏪 Grow Your Beauty Business
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              List Your Salon. Get More Customers.
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Join 500+ salons & parlours on GlowAI. Manage bookings, reduce no-shows, build your brand, and connect directly with customers — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="px-8 py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-base">
                Register My Salon — It's Free 🚀
              </Link>
              <Link to="/login" className="px-8 py-4 bg-white/90 backdrop-blur-sm border-2 border-teal-300 text-teal-700 font-bold rounded-2xl hover:shadow-xl hover:scale-105 transition-all text-base">
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-3 text-gray-900">
            {mode === 'customer' ? 'Book in 4 Simple Steps' : 'Start in 4 Simple Steps'}
          </h2>
          <p className="text-center text-gray-500 text-sm mb-12">
            {mode === 'customer' ? 'From finding a salon to walking in — effortless.' : 'List your shop and start getting bookings today.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-purple-300 to-teal-300 -z-10" style={{ width: 'calc(100% - 2rem)' }} />
                )}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-black text-base mb-3">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-3 text-gray-900">Everything You Need</h2>
          <p className="text-center text-gray-500 text-sm mb-12">Powered by AI, built for India's beauty industry</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all group">
                <div className="text-4xl mb-3">{f.emoji}</div>
                <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-purple-700 transition-colors">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-purple-700 via-pink-600 to-teal-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {mode === 'customer' ? 'Ready to Glow Up? 💅' : 'Ready to Grow Your Business? 🚀'}
          </h2>
          <p className="text-white/80 mb-8">
            {mode === 'customer'
              ? 'Join 10,000+ customers who book smarter with GlowAI.'
              : 'Join 500+ shops growing with GlowAI — completely free.'}
          </p>
          <Link
            to="/signup"
            className="inline-block px-10 py-4 bg-white text-purple-700 font-black rounded-2xl hover:shadow-xl hover:scale-105 transition-all text-base"
          >
            {mode === 'customer' ? 'Get Started Free →' : 'Register My Salon →'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 text-center text-xs text-gray-400">
        <p>© 2025 GlowAI Beauty Platform · Built with ❤️ for India's Beauty Industry</p>
      </footer>

      {/* Demo Modal */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectDemo={handleDemoSelect}
      />
    </div>
  );
};

export default LandingPage;
