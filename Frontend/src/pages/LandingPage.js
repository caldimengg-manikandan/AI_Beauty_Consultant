import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import DemoModal from '../components/DemoModal';
import { getDemoResultById } from '../data/demoData';

/* ═══════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════ */
function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0 = null;
    const frame = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target, duration, start]);
  return count;
}

function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ═══════════════════════════════════════════
   DESIGN TOKENS - LIGHT LUXURY
═══════════════════════════════════════════ */
const T = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#FAFAFA',
  bgSection: '#F8F9FC',
  bgSoft: '#F5F7FB',
  cardBg: '#FFFFFF',

  lavender: '#8B5CF6',
  softViolet: '#A78BFA',
  roseGold: '#E7B8A2',
  champagne: '#D6B370',
  softBlue: '#60A5FA',

  textPrimary: '#111827',
  textSub: '#6B7280',
  textMuted: '#9CA3AF',

  borderSubtle: '#E5E7EB',
  borderPremium: 'rgba(0,0,0,0.06)',

  gradViolet: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
  gradGold: 'linear-gradient(135deg, #D6B370 0%, #E7B8A2 100%)',
  gradHero: 'linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 45%, #FFF5F1 100%)',
};

/* ═══════════════════════════════════════════
   DATA  (all preserved)
═══════════════════════════════════════════ */
const PRICING = [
  {
    name: 'Free', price: '₹0', priceUSD: '$0', period: '/month',
    badge: null, tier: 'free',
    features: ['10 AI skin scans/month', 'Basic salon discovery', 'Appointment booking', '30-day history', 'Community support'],
    cta: 'Get Started Free', link: '/signup',
  },
  {
    name: 'Premium', price: '₹299', priceUSD: '$4', period: '/month',
    badge: 'Most Popular', tier: 'premium',
    features: ['Unlimited AI scans', 'Advanced skin insights', 'Skin journey tracking', 'Goals & evolution tracker', 'Routine AI builder', 'Priority support', 'Export PDF reports'],
    cta: 'Start Premium', link: '/signup',
  },
  {
    name: 'Business', price: '₹999', priceUSD: '$12', period: '/month',
    badge: 'For Salons', tier: 'business',
    features: ['Full Shop Owner Dashboard', 'Staff & HR management', 'Inventory & POS system', 'AI marketing campaigns', 'Franchise HQ (multi-branch)', 'Supply chain & B2B orders', 'API access & webhooks', 'Custom intake forms'],
    cta: 'Register My Salon', link: '/shop-owner/signup',
  },
];

const TESTIMONIALS = [
  { name: 'Priya S.', initials: 'PS', role: 'Beauty Enthusiast', location: 'Chennai, India', text: 'The AI scan told me exactly what my skin needed. My acne cleared in 3 weeks following the routine!', grad: 'linear-gradient(135deg,#8B5CF6,#A78BFA)' },
  { name: 'Rania K.', initials: 'RK', role: 'Salon Owner', location: 'Dubai, UAE', text: 'GlowAI doubled our bookings in 2 months. The campaign tool alone paid for the subscription 10× over.', grad: 'linear-gradient(135deg,#D6B370,#E7B8A2)' },
  { name: 'Meera V.', initials: 'MV', role: 'Premium Member', location: 'Singapore', text: 'I love the skin journey tracker. Seeing my before/after progress photos keeps me motivated every day.', grad: 'linear-gradient(135deg,#A78BFA,#8B5CF6)' },
  { name: 'Aisha M.', initials: 'AM', role: 'Dermatologist', location: 'London, UK', text: 'Remarkable accuracy. The AI assessment aligns with clinical findings 94% of the time in my practice.', grad: 'linear-gradient(135deg,#D6B370,#E7B8A2)' },
  { name: 'Sofia R.', initials: 'SR', role: 'Makeup Artist', location: 'Sydney, AU', text: 'The shade matching feature is a game-changer for my clients. Saves us 20 minutes per consultation.', grad: 'linear-gradient(135deg,#8B5CF6,#A78BFA)' },
];

const FEATURES_CUSTOMER = [
  { icon: '🔬', title: 'AI Skin Analysis', desc: 'DenseNet-201 powered scan with 97% accuracy. Acne, oiliness & skin type readings in seconds.' },
  { icon: '📍', title: 'Salon Discovery', desc: 'Find top-rated salons & spas near you. Real-time slot availability and instant booking.' },
  { icon: '✨', title: 'Virtual Try-On AR', desc: 'Experiment with makeup shades & hair colours using precision augmented reality mirror.' },
  { icon: '🎯', title: 'Goals Tracker', desc: 'Set skin goals and track your glow-up journey across weeks and months with AI insights.' },
  { icon: '🧴', title: 'Ingredient Scanner', desc: 'Scan any beauty product label. AI flags harmful ingredients and suggests safer alternatives.' },
  { icon: '💬', title: 'Expert Consultation', desc: 'Chat with certified dermatologists and beauty professionals on demand.' },
];

const FEATURES_BUSINESS = [
  { icon: '📊', title: 'AI Business Insights', desc: 'Revenue forecasts, peak hours analysis, and customer retention metrics at a glance.' },
  { icon: '👥', title: 'Staff Management', desc: 'Schedules, commissions, attendance tracking for your full salon team.' },
  { icon: '💳', title: 'POS & Billing', desc: 'Integrated point-of-sale, GST invoicing, and seamless payment tracking.' },
  { icon: '📦', title: 'Smart Inventory', desc: 'Real-time stock levels, low-stock alerts, and full vendor management.' },
  { icon: '📣', title: 'Campaign Builder', desc: 'AI-generated WhatsApp, SMS & email campaigns to re-engage your customer base.' },
  { icon: '🌐', title: 'Franchise HQ', desc: 'Manage multiple branches from one dashboard with unified network analytics.' },
];

const WHY_US = [
  { icon: '⚡', title: '95% Accuracy', desc: 'Our DenseNet-201 model delivers near-clinical skin analysis precision on every scan.' },
  { icon: '🌿', title: 'Personalised Results', desc: 'Every recommendation is uniquely built for your skin type, tone, and lifestyle.' },
  { icon: '🧪', title: 'Dermatology-Inspired', desc: 'Protocols developed with certified dermatologists and cosmetologists.' },
  { icon: '⏱️', title: 'Instant Recommendations', desc: 'Get your full beauty plan in under 60 seconds. No appointments needed.' },
  { icon: '🤖', title: 'AI-Powered Insights', desc: 'Continuously learning models that improve the more you use the platform.' },
  { icon: '📈', title: 'Progress Tracking', desc: 'Track your beauty journey over time with measurable before-and-after results.' },
];

/* ═══════════════════════════════════════════
   GLOBAL STYLES — Light Luxury System
═══════════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; background-color: #FFFFFF; color: #111827; }

  /* ── Keyframes ── */
  @keyframes fadeUp   { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes scaleIn  { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  @keyframes floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes ripple   { to{transform:scale(4);opacity:0} }
  @keyframes pulse    { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.25)} }
  @keyframes ring     { 0%{box-shadow:0 0 0 0 rgba(139,92,246,.25)} 70%{box-shadow:0 0 0 14px rgba(139,92,246,0)} 100%{box-shadow:0 0 0 0 rgba(139,92,246,0)} }
  @keyframes scroll   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes shimmer  { 0%{background-position:-300% center} 100%{background-position:300% center} }
  @keyframes gradMove { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

  /* ── Scroll reveal ── */
  .sr { opacity:0; transform:translateY(28px);
        transition:opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
  .sr.on { opacity:1; transform:translateY(0); }
  .sr-s { opacity:0; transform:scale(.96);
          transition:opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
  .sr-s.on { opacity:1; transform:scale(1); }

  /* ── Section badge ── */
  .badge {
    display:inline-flex; align-items:center; gap:8px;
    padding:6px 16px; border-radius:100px;
    background:rgba(139,92,246,.06); border:1px solid rgba(139,92,246,.15);
    font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
    color:#8B5CF6; font-family:'Inter',sans-serif; margin-bottom:24px;
  }
  .badge::before { content:''; width:6px; height:6px; border-radius:50%; background:#8B5CF6; flex-shrink:0; }

  /* ── Unified card ── */
  .card {
    background: #FFFFFF; border-radius: 24px; border: 1px solid rgba(0,0,0,0.06);
    box-shadow: 0 8px 30px rgba(15,23,42,0.06);
    transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s cubic-bezier(.16,1,.3,1), border-color .25s;
    overflow: hidden; position: relative;
  }
  .card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 40px rgba(15,23,42,0.08), 0 8px 16px rgba(139,92,246,0.04);
    border-color: rgba(139,92,246,0.20);
  }

  /* ── Feature card icon ── */
  .feat-icon { transition:transform .3s cubic-bezier(.16,1,.3,1); display: inline-block; }
  .card:hover .feat-icon { transform:scale(1.12) rotate(4deg); }

  /* ── Gradient border on hover ── */
  .card-edge::after {
    content:''; position:absolute; bottom:0; left:0; right:0; height:3px;
    background:linear-gradient(90deg,#8B5CF6,#A78BFA,#D6B370);
    transform:scaleX(0); transform-origin:left;
    transition:transform .35s cubic-bezier(.16,1,.3,1);
  }
  .card-edge:hover::after { transform:scaleX(1); }

  /* ── Primary button ── */
  .btn-primary {
    position:relative; overflow:hidden; display:inline-flex; align-items:center;
    justify-content:center; gap:8px;
    padding:14px 32px; border-radius:12px; border:none; cursor:pointer;
    background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
    color:#fff; font-family:'Inter',sans-serif; font-size:14px; font-weight:700;
    letter-spacing:.01em; text-decoration:none;
    box-shadow: 0 4px 14px rgba(139,92,246,0.25);
    transition:transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s cubic-bezier(.16,1,.3,1), filter .18s;
  }
  .btn-primary:hover { transform:translateY(-2px); box-shadow: 0 8px 24px rgba(139,92,246,0.35); filter:brightness(1.05); }
  .btn-primary:active { transform:translateY(0); }

  /* ── Secondary button ── */
  .btn-secondary {
    position:relative; overflow:hidden; display:inline-flex; align-items:center;
    justify-content:center; gap:8px;
    padding:13px 30px; border-radius:12px; cursor:pointer;
    background: #FFFFFF; color: #111827;
    font-family:'Inter',sans-serif; font-size:14px; font-weight:600;
    letter-spacing:.01em; text-decoration:none;
    border: 1.5px solid #E5E7EB;
    transition:border-color .2s, background .2s, color .2s, box-shadow .2s;
  }
  .btn-secondary:hover { border-color:#A78BFA; color:#8B5CF6; background:rgba(139,92,246,.03); box-shadow:0 4px 16px rgba(139,92,246,.08); }

  /* ── Nav underline ── */
  .nav-item { position:relative; padding-bottom:3px; text-decoration:none; }
  .nav-item::after {
    content:''; position:absolute; bottom:0; left:0; width:0; height:1.5px;
    background:linear-gradient(90deg,#8B5CF6,#A78BFA);
    transition:width .25s cubic-bezier(.16,1,.3,1);
  }
  .nav-item:hover::after { width:100%; }

  /* ── Metric bar ── */
  .metric-bar { height:6px; border-radius:3px; background:#F3F4F6; overflow:hidden; }
  .metric-fill { height:100%; border-radius:3px; transition:width 1.4s cubic-bezier(.4,0,.2,1); }

  /* ── Pricing highlight ── */
  .plan-popular {
    border: 2px solid #8B5CF6 !important;
    box-shadow: 0 12px 40px rgba(139,92,246,0.12) !important;
    background: linear-gradient(160deg, #FFFFFF 0%, #FAF5FF 100%) !important;
  }
  .plan-popular::before {
    content:''; position:absolute; inset:0; border-radius:24px;
    background:linear-gradient(160deg,rgba(139,92,246,.04) 0%,transparent 60%);
    pointer-events:none;
  }

  .gradient-text {
    background: linear-gradient(135deg, #8B5CF6 0%, #D6B370 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

/* ═══════════════════════════════════════════
   ICONS
═══════════════════════════════════════════ */
const Ico = {
  arrowR: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  chevR: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  star: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#D6B370" stroke="#D6B370" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════
   REUSABLE COMPONENTS
═══════════════════════════════════════════ */
/* Scroll-reveal wrapper */
const SR = ({ children, className = '', delay = 0, scale = false, style = {} }) => {
  const [ref, vis] = useInView(0.08);
  return (
    <div ref={ref} className={`${scale ? 'sr-s' : 'sr'} ${vis ? 'on' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
};

/* Ripple button — wraps any element */
const Ripple = ({ children, className = '', style = {}, onClick, as: Tag = 'button', to, ...rest }) => {
  const ref = useRef(null);
  const click = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const s = document.createElement('span');
    const r = el.getBoundingClientRect();
    const sz = Math.max(r.width, r.height);
    s.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;
      width:${sz}px;height:${sz}px;
      left:${e.clientX - r.left - sz / 2}px;top:${e.clientY - r.top - sz / 2}px;
      background:rgba(255,255,255,.22);animation:ripple .55s linear forwards;`;
    el.appendChild(s);
    setTimeout(() => s.remove(), 560);
    onClick?.(e);
  }, [onClick]);
  if (Tag === Link)
    return <Link to={to} ref={ref} className={className} style={{ position: 'relative', overflow: 'hidden', ...style }} onClick={click} {...rest}>{children}</Link>;
  return <Tag ref={ref} className={className} style={{ position: 'relative', overflow: 'hidden', ...style }} onClick={click} {...rest}>{children}</Tag>;
};

/* Animated hero stat */
const HeroStat = ({ target, suffix, label, visible, delay = 0 }) => {
  const n = useCountUp(target, 1800, visible);
  return (
    <div style={{
      textAlign: 'center', padding: '0 32px',
      borderRight: '1px solid rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column',
      gap: 8, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)',
      transition: `opacity .65s ease ${delay}ms, transform .65s cubic-bezier(.16,1,.3,1) ${delay}ms`
    }}>
      <div style={{ fontSize: 36, fontWeight: 900, color: '#111827', fontFamily: "'Playfair Display',serif", letterSpacing: '-.02em', lineHeight: 1 }}>
        {n}{suffix}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#6B7280', fontFamily: "'Inter',sans-serif" }}>
        {label}
      </div>
    </div>
  );
};

/* Animated dashboard stat card */
const StatCard = ({ value, label, color, visible, delay = 0 }) => (
  <div style={{
    padding: '24px 24px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)',
    background: '#FFFFFF', boxShadow: '0 8px 30px rgba(15,23,42,0.04)',
    opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
    transition: `opacity .65s ease ${delay}ms, transform .65s cubic-bezier(.16,1,.3,1) ${delay}ms`,
  }}>
    <div style={{ fontSize: 32, fontWeight: 900, color, fontFamily: "'Playfair Display',serif", letterSpacing: '-.02em', marginBottom: 8 }}>{value}</div>
    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6B7280', fontFamily: "'Inter',sans-serif" }}>{label}</div>
  </div>
);

/* ═══════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [isDemoOpen, setDemoOpen] = useState(false);
  const [mode, setMode] = useState('customer');
  const [currency, setCurrency] = useState('INR');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [heroVis, setHeroVis] = useState(false);
  const [statsVis, setStatsVis] = useState(false);
  const [testimonialPaused, setTPaused] = useState(false);
  const statsRef = useRef(null);

  /* scroll → nav glass */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* hero stats after 700ms */
  useEffect(() => { const t = setTimeout(() => setHeroVis(true), 700); return () => clearTimeout(t); }, []);

  /* intelligence stats on scroll */
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVis(true); }, { threshold: .25 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  /* global scroll-reveal */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); }), { threshold: .08 });
    document.querySelectorAll('.sr,.sr-s').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [mode]);

  const handleDemoSelect = useCallback((id) => {
    const d = getDemoResultById(id);
    if (d) { sessionStorage.setItem('demoResult', JSON.stringify(d)); navigate('/demo-results'); }
  }, [navigate]);

  const features = mode === 'customer' ? FEATURES_CUSTOMER : FEATURES_BUSINESS;

  /* ─── RENDER ─── */
  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", background: T.bgPrimary, overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' }}>
      <style>{STYLES}</style>

      {/* ════════════════════════════
          NAV
      ════════════════════════════ */}
      <nav style={{
        position: 'fixed', inset: '0 0 auto', zIndex: 200,
        height: 72,
        background: scrolled ? 'rgba(255,255,255,.98)' : 'rgba(255,255,255,.8)',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'blur(10px)',
        borderBottom: scrolled ? `1px solid ${T.borderPremium}` : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 20px rgba(15,23,42,0.03)' : 'none',
        transition: 'background .35s, border-color .35s, box-shadow .35s',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', height: '100%', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, background: T.gradViolet,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 18, fontFamily: "'Playfair Display',serif",
              boxShadow: '0 4px 12px rgba(139,92,246,0.3)'
            }}>G</div>
            <div>
              <div style={{
                fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 22,
                color: T.textPrimary, letterSpacing: '-.01em', lineHeight: 1.1
              }}>GlowAI</div>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 40 }}>
            {[['#services', 'Services'], ['#intelligence', 'AI Tech'], ['#pricing', 'Pricing'], ['#testimonials', 'Reviews']].map(([href, lbl]) => (
              <a key={href} href={href} className="nav-item"
                style={{ fontSize: 14, fontWeight: 600, color: T.textSub, transition: 'color .2s' }}>
                {lbl}
              </a>
            ))}
          </div>

          {/* Right controls */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
            {/* Currency */}
            {/* <select value={currency} onChange={e => setCurrency(e.target.value)} aria-label="Currency"
              style={{ fontSize:13, fontWeight:600, padding:'8px 12px', borderRadius:10,
                border:`1px solid ${T.borderSubtle}`,
                background: '#FFFFFF',
                color: T.textPrimary,
                outline:'none', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,0,0,0.02)' }}>
              <option value="INR">₹ INR</option><option value="USD">$ USD</option>
              <option value="AED">AED</option><option value="GBP">£ GBP</option>
            </select> */}

            {/* Mode toggle */}
            <div style={{
              display: 'flex', background: T.bgSoft,
              borderRadius: 12, padding: 4, border: `1px solid ${T.borderSubtle}`
            }}>
              {[['customer', 'Customers'], ['shop', 'Salons']].map(([val, lbl]) => (
                <button key={val} onClick={() => setMode(val)} style={{
                  padding: '8px 16px', fontSize: 12, fontWeight: 700, letterSpacing: '.04em',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  transition: 'all .2s',
                  background: mode === val ? '#FFFFFF' : 'transparent',
                  color: mode === val ? T.lavender : T.textSub,
                  boxShadow: mode === val ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                }}>{lbl}</button>
              ))}
            </div>

            <Link to="/login" style={{
              fontSize: 14, fontWeight: 600, color: T.textPrimary,
              textDecoration: 'none', padding: '8px 16px'
            }}>Sign In</Link>
            <Ripple as={Link} to="/signup" className="btn-primary" style={{ padding: '12px 24px', fontSize: 14 }}>
              Get Started <Ico.chevR />
            </Ripple>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: T.textPrimary
            }}>
            {mobileOpen ? <Ico.close /> : <Ico.menu />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div style={{ background: '#fff', borderTop: `1px solid ${T.borderSubtle}`, padding: '24px 24px 32px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[['#services', 'Services'], ['#intelligence', 'AI Tech'], ['#pricing', 'Pricing'], ['#testimonials', 'Reviews']].map(([href, lbl]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)}
                style={{ fontSize: 16, fontWeight: 600, color: T.textPrimary, textDecoration: 'none', padding: '16px 0', borderBottom: `1px solid ${T.borderSubtle}` }}>{lbl}</a>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Link to="/login" style={{ flex: 1 }}>
                <button className="btn-secondary" style={{ width: '100%', padding: '14px 0' }}>Sign In</button>
              </Link>
              <Ripple as={Link} to="/signup" style={{ flex: 1 }} className="btn-primary" style2={{ width: '100%', padding: '14px 0' }}>
                Get Started
              </Ripple>
            </div>
          </div>
        )}
      </nav>

      {/* ════════════════════════════
          HERO (Section 1 - White)
      ════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.bgPrimary }}>

        {/* Background layers */}
        <div style={{ position: 'absolute', inset: 0, background: T.gradHero, backgroundSize: '200% 200%', animation: 'gradMove 15s ease infinite', opacity: 0.8 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(139,92,246,.08) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 80%, rgba(214,179,112,.06) 0%, transparent 60%)' }} />

        {/* Main content */}
        <div style={{
          position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center',
          maxWidth: 1280, margin: '0 auto', width: '100%', padding: '120px 40px 140px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', width: '100%' }}
            className="block">

            {/* LEFT */}
            <div style={{ animation: 'fadeUp .8s cubic-bezier(.16,1,.3,1) both' }}>
              {/* Badge */}
              <div className="badge">
                {mode === 'customer' ? 'AI-Powered Beauty Intelligence' : 'AI-Powered Salon Management'}
              </div>

              {/* H1 */}
              {mode === 'customer' ? (
                <h1 style={{
                  fontFamily: "'Playfair Display',serif", fontSize: 'clamp(48px,5vw,72px)',
                  fontWeight: 800, color: T.textPrimary, lineHeight: 1.10, letterSpacing: '-.02em', marginBottom: 24
                }}>
                  Meet Your Personal<br />
                  <span className="gradient-text">AI Beauty</span><br />
                  Consultant
                </h1>
              ) : (
                <h1 style={{
                  fontFamily: "'Playfair Display',serif", fontSize: 'clamp(48px,5vw,72px)',
                  fontWeight: 800, color: T.textPrimary, lineHeight: 1.10, letterSpacing: '-.02em', marginBottom: 24
                }}>
                  Grow Your Salon<br />
                  <span className="gradient-text">With Intelligent</span><br />
                  AI Business Tools
                </h1>
              )}

              {/* Sub */}
              <p style={{
                fontSize: 18, fontWeight: 400, color: T.textSub, lineHeight: 1.80,
                maxWidth: 500, marginBottom: 48, fontFamily: "'Inter',sans-serif"
              }}>
                {mode === 'customer'
                  ? 'Personalized skincare, makeup, and beauty recommendations powered by advanced artificial intelligence.'
                  : 'Staff management, smart POS, AI campaigns, and franchise tools — everything your beauty business needs.'}
              </p>

              {/* CTA row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 56 }}>
                {mode === 'customer' ? (
                  <>
                    <Ripple as={Link} to="/signup" className="btn-primary"
                      style={{ padding: '16px 40px', fontSize: 15 }}>
                      Start Free Analysis &nbsp;<Ico.arrowR />
                    </Ripple>
                    <Ripple className="btn-secondary" onClick={() => setDemoOpen(true)} style={{ padding: '16px 40px', fontSize: 15 }}>
                      Watch Demo
                    </Ripple>
                  </>
                ) : (
                  <>
                    <Ripple as={Link} to="/shop-owner/signup" className="btn-primary"
                      style={{ padding: '16px 40px', fontSize: 15 }}>
                      Register My Salon &nbsp;<Ico.arrowR />
                    </Ripple>
                    <Ripple as={Link} to="/shop-owner/login" className="btn-secondary" style={{ padding: '16px 40px', fontSize: 15 }}>
                      Partner Login
                    </Ripple>
                  </>
                )}
              </div>

              {/* Trust bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex' }}>
                    {[44, 68, 90, 65].map((num, i) => (
                      <img key={i} src={`https://randomuser.me/api/portraits/women/${num}.jpg`} alt="User"
                        style={{
                          width: 38, height: 38, borderRadius: '50%', objectFit: 'cover',
                          border: '2px solid #fff', marginLeft: i ? -12 : 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>{[...Array(5)].map((_, i) => <Ico.star key={i} />)}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.textSub }}>Trusted by 50,000+</span>
                  </div>
                </div>
                <div style={{ width: 1, height: 32, background: T.borderSubtle }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: T.textPrimary }}>4.9</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: T.textMuted, lineHeight: 1.4 }}>App Store<br />Rating</div>
                </div>
              </div>
            </div>

            {/* RIGHT — AI Dashboard card */}
            <div className="hidden md:flex" style={{ justifyContent: 'flex-end', animation: 'floatY 9s ease-in-out infinite' }}>
              <div style={{
                width: '100%', maxWidth: 440, borderRadius: 32,
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 40px 100px rgba(15,23,42,0.08), 0 10px 40px rgba(139,92,246,0.06)',
                padding: 36
              }}>

                {/* Dashboard header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                  <div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
                      color: T.textMuted, marginBottom: 6
                    }}>Skin Intelligence</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary, fontFamily: "'Playfair Display',serif" }}>AI Skin Analysis</div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100,
                    background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.15)', animation: 'ring 3s infinite'
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.lavender, letterSpacing: '.08em' }}>LIVE</span>
                  </div>
                </div>

                {/* Circular metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
                  {[{ l: 'Hydration', v: 82, c: T.lavender }, { l: 'Radiance', v: 91, c: T.champagne }, { l: 'Clarity', v: 74, c: T.roseGold }].map(m => {
                    const r = 26, circ = 2 * Math.PI * r, dash = circ * (m.v / 100);
                    return (
                      <div key={m.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative', width: 64, height: 64 }}>
                          <svg viewBox="0 0 64 64" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                            <circle cx="32" cy="32" r={r} fill="none" stroke="#F3F4F6" strokeWidth="6" />
                            <circle cx="32" cy="32" r={r} fill="none" stroke={m.c} strokeWidth="6"
                              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                              style={{ filter: `drop-shadow(0 4px 6px ${m.c}40)` }} />
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary }}>{m.v}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: T.textSub }}>{m.l}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                  {[{ l: 'Acne Detection', v: 88, c: T.lavender }, { l: 'Pigmentation', v: 42, c: T.champagne }, { l: 'Routine Score', v: 95, c: T.roseGold }].map(b => (
                    <div key={b.l}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub }}>{b.l}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: T.textPrimary }}>{b.v}%</span>
                      </div>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{ width: `${b.v}%`, background: b.c, boxShadow: `0 2px 8px ${b.c}40` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 20,
                  background: 'rgba(139,92,246,.04)', border: '1px solid rgba(139,92,246,.12)'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: T.gradViolet,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', flexShrink: 0,
                    boxShadow: '0 6px 16px rgba(139,92,246,.25)'
                  }}>✦</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.lavender }}>AI Recommendation Ready</div>
                    <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>Personalised 8-step routine generated</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero stat bar — bottom strip */}
        <div style={{
          position: 'relative', zIndex: 10, borderTop: `1px solid ${T.borderPremium}`,
          background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)'
        }}>
          <div style={{
            maxWidth: 1280, margin: '0 auto', padding: '32px 40px',
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)'
          }}>
            <HeroStat target={95} suffix="%" label="Accuracy Rate" visible={heroVis} delay={0} />
            <HeroStat target={2} suffix="M+" label="AI Analyses" visible={heroVis} delay={140} />
            <HeroStat target={50} suffix="K+" label="Beauty Plans" visible={heroVis} delay={280} />
            <HeroStat target={12} suffix="+" label="Countries" visible={heroVis} delay={420} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          SERVICES (Section 2 - Soft Gray)
      ════════════════════════════ */}
      <section id="services" style={{ background: T.bgSecondary, padding: '120px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SR style={{ textAlign: 'center', marginBottom: 80 }}>
            <div className="badge">{mode === 'customer' ? 'Consumer Features' : 'Business Features'}</div>
            <h2 style={{
              fontFamily: "'Playfair Display',serif", fontSize: 'clamp(36px,4vw,56px)', fontWeight: 800,
              color: T.textPrimary, letterSpacing: '-.02em', lineHeight: 1.15, maxWidth: 700, margin: '0 auto 20px'
            }}>
              {mode === 'customer' ? 'Everything for Your Glow-Up' : 'A Complete Business Operating System'}
            </h2>
            <p style={{ fontSize: 18, color: T.textSub, maxWidth: 600, margin: '0 auto', lineHeight: 1.80 }}>
              {mode === 'customer'
                ? 'From AI skin diagnosis to booking your favourite salon — all in one app.'
                : 'Every tool your salon needs to grow, retain customers, and scale globally.'}
            </p>
          </SR>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 32 }}>
            {features.map((f, i) => (
              <SR key={f.title} delay={i * 65} scale>
                <div className="card card-edge" style={{ padding: '48px 40px', height: '100%', cursor: 'default', display: 'flex', flexDirection: 'column' }}>
                  <div className="feat-icon" style={{ fontSize: 40, marginBottom: 24 }}>{f.icon}</div>
                  <h3 style={{
                    fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700,
                    color: T.textPrimary, marginBottom: 16, lineHeight: 1.3
                  }}>{f.title}</h3>
                  <p style={{ fontSize: 16, color: T.textSub, lineHeight: 1.75, flexGrow: 1 }}>{f.desc}</p>
                </div>
              </SR>
            ))}
          </div>

          <SR style={{ textAlign: 'center', marginTop: 64 }}>
            <button onClick={() => setMode(mode === 'customer' ? 'shop' : 'customer')}
              className="btn-secondary" style={{ padding: '16px 40px', fontSize: 15 }}>
              {mode === 'customer' ? 'View Business Features' : 'View Customer Features'}
              &nbsp;<Ico.chevR />
            </button>
          </SR>
        </div>
      </section>

      {/* ════════════════════════════
          AI INTELLIGENCE (Section 3 - White)
      ════════════════════════════ */}
      <section id="intelligence" style={{ background: T.bgPrimary, padding: '120px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle,rgba(139,92,246,.04) 0%,transparent 70%)', filter: 'blur(80px)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%', width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle,rgba(214,179,112,.04) 0%,transparent 70%)', filter: 'blur(80px)'
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}
            className="block">

            {/* LEFT — dashboard */}
            <SR className="order-2 md:order-1">
              <div style={{ animation: 'floatY 8s ease-in-out infinite' }}>
                <div style={{
                  borderRadius: 32, padding: 40, background: '#FFFFFF',
                  border: `1px solid ${T.borderPremium}`,
                  boxShadow: '0 30px 80px rgba(15,23,42,0.06)'
                }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 6 }}>Real-Time Analysis</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary, fontFamily: "'Playfair Display',serif" }}>Skin Intelligence Dashboard</div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100,
                      background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.15)', animation: 'ring 3s infinite'
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.lavender, letterSpacing: '.08em' }}>SCANNING</span>
                    </div>
                  </div>

                  {/* Metric bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                    {[
                      { l: 'Skin Age Estimation', v: 68, c: T.lavender, s: 'score' },
                      { l: 'Acne Detection', v: 88, c: T.champagne, s: 'clear' },
                      { l: 'Pigmentation Index', v: 42, c: T.roseGold, s: 'low' },
                      { l: 'Routine Optimization', v: 95, c: T.lavender, s: 'optimal' },
                    ].map(b => (
                      <div key={b.l}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.textSub }}>{b.l}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: b.c }}>{b.v}% {b.s}</span>
                        </div>
                        <div className="metric-bar">
                          <div className="metric-fill" style={{ width: `${b.v}%`, background: b.c, boxShadow: `0 2px 8px ${b.c}44` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tag pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {['Facial Mapping', 'Skin Health', 'Beauty Score', 'AI Recommendations', 'Progress Tracking'].map(tag => (
                      <span key={tag} style={{
                        fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 100,
                        background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.12)',
                        color: T.lavender, letterSpacing: '.04em'
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </SR>

            {/* RIGHT — copy */}
            <SR className="order-1 md:order-2" delay={100}>
              <div className="badge">AI Beauty Intelligence</div>
              <h2 style={{
                fontFamily: "'Playfair Display',serif", fontSize: 'clamp(36px,4vw,56px)',
                fontWeight: 800, color: T.textPrimary, lineHeight: 1.15, letterSpacing: '-.02em', marginBottom: 24
              }}>
                The Science of Beautiful Skin
              </h2>
              <p style={{ fontSize: 18, color: T.textSub, lineHeight: 1.80, marginBottom: 48 }}>
                Our AI analyzes thousands of facial characteristics, skin conditions, and lifestyle factors to create a personalized beauty journey designed specifically for you.
              </p>

              {/* Stat grid */}
              <div ref={statsRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 48 }}>
                {[
                  { value: '95%', label: 'Recommendation Accuracy', color: T.lavender },
                  { value: '2M+', label: 'Beauty Analyses Done', color: T.champagne },
                  { value: '50K+', label: 'Personalised Plans', color: T.roseGold },
                  { value: '24/7', label: 'AI Assistance', color: T.lavender },
                ].map((s, i) => <StatCard key={i} {...s} visible={statsVis} delay={i * 100} />)}
              </div>

              <Ripple as={Link} to="/signup" className="btn-primary" style={{ padding: '16px 40px', fontSize: 15 }}>
                Experience AI Analysis &nbsp;<Ico.arrowR />
              </Ripple>
            </SR>
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          WHY CHOOSE US (Section 4 - Lavender Tint)
      ════════════════════════════ */}
      <section style={{ background: T.bgSoft, padding: '120px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SR style={{ textAlign: 'center', marginBottom: 80 }}>
            <div className="badge">Why GlowAI</div>
            <h2 style={{
              fontFamily: "'Playfair Display',serif", fontSize: 'clamp(36px,4vw,56px)',
              fontWeight: 800, color: T.textPrimary, letterSpacing: '-.02em', lineHeight: 1.15, maxWidth: 700, margin: '0 auto 20px'
            }}>
              Beauty Excellence, Powered by Intelligence
            </h2>
            <p style={{ fontSize: 18, color: T.textSub, maxWidth: 600, margin: '0 auto', lineHeight: 1.80 }}>
              Every feature is designed to deliver salon-quality results with the precision of advanced AI technology.
            </p>
          </SR>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 32 }}>
            {WHY_US.map((item, i) => (
              <SR key={item.title} delay={i * 55} scale>
                <div className="card" style={{ padding: '48px 40px', height: '100%' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, background: T.bgPrimary, border: `1px solid ${T.borderSubtle}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 24, boxShadow: '0 4px 12px rgba(15,23,42,0.04)'
                  }}>{item.icon}</div>
                  <div style={{ width: 40, height: 3, borderRadius: 2, background: T.gradViolet, marginBottom: 20 }} />
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: T.textPrimary, marginBottom: 16 }}>{item.title}</h3>
                  <p style={{ fontSize: 16, color: T.textSub, lineHeight: 1.80 }}>{item.desc}</p>
                </div>
              </SR>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          PRICING (Section 5 - White)
      ════════════════════════════ */}
      <section id="pricing" style={{ background: T.bgPrimary, padding: '120px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, pointerEvents: 'none',
          background: 'radial-gradient(ellipse,rgba(139,92,246,.04) 0%,transparent 70%)', filter: 'blur(40px)'
        }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>

          <SR style={{ textAlign: 'center', marginBottom: 80 }}>
            <div className="badge">Simple, Transparent Pricing</div>
            <h2 style={{
              fontFamily: "'Playfair Display',serif", fontSize: 'clamp(36px,4vw,56px)',
              fontWeight: 800, color: T.textPrimary, letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 20
            }}>
              Choose Your Plan
            </h2>
            <p style={{ fontSize: 18, color: T.textSub, lineHeight: 1.80 }}>
              14-day free trial on all plans. No credit card required.
            </p>
          </SR>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 32 }}>
            {PRICING.map((plan, i) => (
              <SR key={plan.name} delay={i * 80} scale>
                <div className={`card ${plan.tier === 'premium' ? 'plan-popular' : ''}`}
                  style={{
                    padding: '56px 40px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
                    background: plan.tier === 'premium' ? '#FFFFFF' : '#FFFFFF'
                  }}>

                  {plan.badge && (
                    <div style={{
                      position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                      padding: '8px 24px', borderRadius: 100, fontSize: 12, fontWeight: 800, letterSpacing: '.12em',
                      textTransform: 'uppercase', color: '#fff',
                      background: plan.tier === 'premium' ? T.gradViolet : T.gradGold,
                      boxShadow: plan.tier === 'premium' ? '0 8px 20px rgba(139,92,246,.3)' : '0 8px 20px rgba(214,179,112,.3)',
                      whiteSpace: 'nowrap'
                    }}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan header */}
                  <div style={{ marginBottom: 40 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
                      color: plan.tier === 'premium' ? T.lavender : plan.tier === 'business' ? T.champagne : T.textMuted,
                      marginBottom: 12
                    }}>{plan.name} Plan</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{
                        fontFamily: "'Playfair Display',serif", fontSize: 64, fontWeight: 900,
                        color: T.textPrimary, letterSpacing: '-.03em', lineHeight: 1
                      }}>
                        {currency === 'USD' ? plan.priceUSD : plan.price}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 500, color: T.textMuted }}>{plan.period}</span>
                    </div>
                  </div>

                  {/* Feature list */}
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48, flexGrow: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 16, color: T.textPrimary, lineHeight: 1.6 }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: plan.tier === 'premium' ? 'rgba(139,92,246,.1)' : plan.tier === 'business' ? 'rgba(214,179,112,.1)' : T.bgSecondary,
                          color: plan.tier === 'premium' ? T.lavender : plan.tier === 'business' ? T.champagne : T.textSub
                        }}>
                          <Ico.check />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Ripple as={Link} to={plan.link} className={plan.tier === 'free' ? 'btn-secondary' : 'btn-primary'}
                    style={{
                      width: '100%', padding: '18px 0', justifyContent: 'center', fontSize: 15,
                      background: plan.tier === 'premium' ? T.gradViolet : plan.tier === 'business' ? T.gradGold : undefined,
                      boxShadow: plan.tier === 'premium' ? '0 8px 24px rgba(139,92,246,.3)' : plan.tier === 'business' ? '0 8px 24px rgba(214,179,112,.3)' : undefined,
                      color: plan.tier !== 'free' ? '#fff' : undefined,
                      border: plan.tier !== 'free' ? 'none' : undefined
                    }}>
                    {plan.cta} &nbsp;<Ico.arrowR />
                  </Ripple>
                </div>
              </SR>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════
          TESTIMONIALS (Section 6 - Soft Section Bg)
      ════════════════════════════ */}
      <section id="testimonials" style={{ background: T.bgSection, padding: '120px 0', position: 'relative', overflow: 'hidden' }}>
        <SR style={{ textAlign: 'center', marginBottom: 80, padding: '0 40px' }}>
          <div className="badge">Real Transformations</div>
          <h2 style={{
            fontFamily: "'Playfair Display',serif", fontSize: 'clamp(36px,4vw,56px)',
            fontWeight: 800, color: T.textPrimary, letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 20
          }}>
            Real People. Real Results.
          </h2>
          <p style={{ fontSize: 18, color: T.textSub, lineHeight: 1.80, maxWidth: 600, margin: '0 auto' }}>
            Discover how our AI technology has revolutionized personalized beauty routines across the globe.
          </p>
        </SR>

        {/* Infinite scroll carousel */}
        <div style={{ overflow: 'hidden', position: 'relative' }}
          onMouseEnter={() => setTPaused(true)}
          onMouseLeave={() => setTPaused(false)}>
          <div style={{
            display: 'flex', gap: 32, width: 'max-content', padding: '0 40px',
            animation: 'scroll 40s linear infinite',
            animationPlayState: testimonialPaused ? 'paused' : 'running'
          }}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} className="card" style={{
                width: 400, flexShrink: 0, padding: '40px 36px',
                cursor: 'default',
              }}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>{[...Array(5)].map((_, j) => <Ico.star key={j} />)}</div>
                {/* Quote */}
                <p style={{ fontSize: 16, color: T.textPrimary, lineHeight: 1.80, marginBottom: 32 }}>"{t.text}"</p>
                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: t.grad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,.15)'
                  }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary, fontFamily: "'Playfair Display',serif" }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: T.textSub, marginTop: 4 }}>{t.role} · {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Fade masks */}
          <div style={{ position: 'absolute', inset: '0 auto 0 0', width: 160, background: `linear-gradient(to right,${T.bgSection},transparent)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '0 0 0 auto', width: 160, background: `linear-gradient(to left,${T.bgSection},transparent)`, pointerEvents: 'none' }} />
        </div>
      </section>

      {/* ════════════════════════════
          FINAL CTA (Section 7 - White w/ Soft Gradient)
      ════════════════════════════ */}
      <section style={{ background: T.bgPrimary, padding: '140px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 50% 0%,rgba(139,92,246,.05) 0%,transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(139,92,246,.15),transparent)' }} />

        <SR style={{ textAlign: 'center', position: 'relative', zIndex: 10, maxWidth: 800, margin: '0 auto' }}>
          <div className="badge" style={{ margin: '0 auto 24px' }}>
            Begin Your Journey
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display',serif", fontSize: 'clamp(40px,5vw,72px)',
            fontWeight: 800, color: T.textPrimary, letterSpacing: '-.02em', lineHeight: 1.12, marginBottom: 24
          }}>
            Discover The Beauty Routine<br />
            <span className="gradient-text">Designed For You</span>
          </h2>
          <p style={{ fontSize: 18, color: T.textSub, lineHeight: 1.80, maxWidth: 600, margin: '0 auto 48px' }}>
            {mode === 'customer'
              ? 'Join our growing community of beauty lovers today.'
              : 'Join 500+ salons growing with AI-powered business management tools.'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            <Ripple as={Link} to={mode === 'customer' ? '/signup' : '/shop-owner/signup'} className="btn-primary"
              style={{ padding: '18px 48px', fontSize: 16 }}>
              Get Your AI Beauty Analysis &nbsp;<Ico.arrowR />
            </Ripple>
            <Ripple as={Link} to="/login" className="btn-secondary" style={{ padding: '18px 48px', fontSize: 16 }}>
              Sign In
            </Ripple>
          </div>
        </SR>
      </section>

      {/* ════════════════════════════
          FOOTER
      ════════════════════════════ */}
      <footer style={{ background: T.bgPrimary, padding: '48px 40px', borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: T.gradViolet,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 16, fontFamily: "'Playfair Display',serif",
              boxShadow: '0 4px 12px rgba(139,92,246,.25)'
            }}>G</div>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 18, color: T.textPrimary }}>GlowAI</span>
            <span style={{ fontSize: 14, color: T.textMuted, marginLeft: 12 }}>AI-Powered Beauty Platform</span>
          </div>
          {/* Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="nav-item"
                style={{ fontSize: 14, fontWeight: 600, color: T.textSub, textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = T.lavender}
                onMouseLeave={e => e.target.style.color = T.textSub}>
                {l}
              </a>
            ))}
            <span style={{ fontSize: 14, color: T.textMuted }}>© 2025 GlowAI</span>
          </div>
        </div>
      </footer>

      <DemoModal isOpen={isDemoOpen} onClose={() => setDemoOpen(false)} onSelectDemo={handleDemoSelect} />
    </div>
  );
}
