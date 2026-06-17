import { useState, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import illustration from "../assets/auth_illustration.png";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ── Inline SVG Icons — no extra dep ── */
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconBuilding = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 22V12h6v10"/><path d="M3 9h18"/><path d="M3 15h4"/><path d="M17 15h4"/>
  </svg>
);
const IconAlertCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* ── Stat pill used in right panel ── */
const StatPill = ({ value, label }) => (
  <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center border border-slate-100">
    <div className="font-black text-slate-800 text-lg leading-tight">{value}</div>
    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{label}</div>
  </div>
);

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [roleType, setRoleType] = useState(searchParams.get("role") || "customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password,
        role_type: roleType,
      });

      const { access_token, role, name, account_type } = res.data;
      login(access_token);
      localStorage.setItem("email", email);
      localStorage.setItem("name", name || email);
      localStorage.setItem("role", role);
      localStorage.setItem("account_type", account_type || "customer");

      if (role === "admin") {
        navigate("/dashboard/admin");
      } else if (role === "shop_owner" || account_type === "shop_owner") {
        navigate("/dashboard/shop-owner");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      const status = err.response?.status;
      if (status === 403 && detail.toLowerCase().includes("email not verified")) {
        setError("Your email is not verified. Redirecting to verify...");
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(email)}&role=${roleType}`);
        }, 1500);
      } else if (status === 403 && detail.toLowerCase().includes("shop owner")) {
        setError("This account is not registered as a Shop Owner. Please use the Customer login tab.");
      } else if (status === 403 && detail.toLowerCase().includes("customer login")) {
        setError("This is a Shop Owner account. Please switch to the Shop Owner tab above.");
      } else {
        setError(detail || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const isShopOwner = roleType === "shop_owner";

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white overflow-hidden">

      {/* ── LEFT — Form ── */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12 relative z-10">

        {/* Brand */}
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2.5 mb-8" aria-label="Go to homepage">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm"
              style={{ background: isShopOwner ? '#F59E0B' : '#5B4FF7' }}>
              G
            </div>
            <span className="font-black text-[17px] tracking-tight text-slate-800">GlowAI</span>
          </Link>

          <h1 className="text-3xl font-black text-slate-900 mb-1.5 tracking-tight">
            {isShopOwner ? "Partner Portal" : "Welcome Back"}
          </h1>
          <p className="text-slate-500 text-[15px]">
            {isShopOwner
              ? "Manage your salon, bookings and customers."
              : "Sign in to access your AI beauty dashboard."}
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex justify-start mb-7">
          <div
            className="inline-flex bg-slate-100 rounded-xl p-1 gap-1"
            role="group"
            aria-label="Account type selector"
          >
            <button
              type="button"
              id="toggle-customer"
              onClick={() => { setRoleType("customer"); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-[10px] text-[13px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4FF7] ${
                !isShopOwner
                  ? "bg-white text-[#5B4FF7] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <IconUser /> Customer
            </button>
            <button
              type="button"
              id="toggle-shopowner"
              onClick={() => { setRoleType("shop_owner"); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-[10px] text-[13px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isShopOwner
                  ? "bg-white text-amber-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <IconBuilding /> Shop Owner
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium text-red-700 bg-red-50 border border-red-100"
          >
            <IconAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-md" noValidate>

          {/* Email */}
          <div>
            <label htmlFor="login-email" className="text-[13px] font-semibold text-slate-700 mb-1.5 block">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B4FF7]/25 focus:border-[#5B4FF7]/50 text-slate-900 placeholder-slate-400 transition-all duration-150 text-[13px] font-medium shadow-xs"
                placeholder={isShopOwner ? "salon@business.com" : "name@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="text-[13px] font-semibold text-slate-700 mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B4FF7]/25 focus:border-[#5B4FF7]/50 text-slate-900 placeholder-slate-400 transition-all duration-150 text-[13px] font-medium shadow-xs"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4FF7]/40 rounded"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-[13px] font-semibold text-[#5B4FF7] hover:text-[#4a41d4] transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-[14px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              loading
                ? "bg-slate-300 cursor-not-allowed"
                : isShopOwner
                ? "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500 shadow-sm hover:shadow-md hover:shadow-amber-500/20"
                : "bg-[#5B4FF7] hover:bg-[#4a41d4] focus-visible:ring-[#5B4FF7] shadow-sm hover:shadow-md hover:shadow-[#5B4FF7]/20"
            }`}
          >
            {loading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Signing in...</>
            ) : (
              <>Sign In <IconArrowRight /></>
            )}
          </button>
        </form>

        <p className="mt-7 text-slate-500 text-[13px]">
          {isShopOwner ? "New salon or parlour?" : "New to GlowAI?"}{" "}
          <Link
            to={isShopOwner ? "/signup?role=shop_owner" : "/signup"}
            className="font-bold text-[#5B4FF7] hover:text-[#4a41d4] hover:underline transition-colors"
          >
            {isShopOwner ? "Register your business" : "Create an account"}
          </Link>
        </p>

        {!isShopOwner && (
          <p className="mt-2 text-[13px] text-slate-400">
            Are you a salon owner?{" "}
            <button
              onClick={() => setRoleType("shop_owner")}
              className="text-amber-600 font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 rounded"
            >
              Switch to Partner Portal
            </button>
          </p>
        )}

        <div className="mt-auto pt-8 text-[11px] text-slate-400">
          © {new Date().getFullYear()} GlowAI. All rights reserved.
        </div>
      </div>

      {/* ── RIGHT — Visual panel ── */}
      <div
        className={`hidden md:flex flex-col items-center justify-center relative p-12 overflow-hidden transition-colors duration-500 ${
          isShopOwner ? "bg-[#FFFBEB]" : "bg-[#F5F3FF]"
        }`}
      >
        {/* Subtle radial gradient — no blobs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isShopOwner
              ? "radial-gradient(ellipse at 70% 30%, rgba(245,158,11,0.08) 0%, transparent 70%)"
              : "radial-gradient(ellipse at 70% 30%, rgba(91,79,247,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 text-center max-w-sm w-full">
          {isShopOwner ? (
            <>
              {/* Clean icon container — no emoji */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Grow Your Business</h3>
              <p className="text-slate-500 text-[14px] leading-relaxed mb-8">
                Join 500+ salons, parlours and spas on GlowAI. Manage bookings, track earnings, and build a loyal customer base — all in one place.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[["500+", "Partner Salons"], ["10K+", "Monthly Bookings"], ["4.8", "Avg Rating"]].map(([val, label]) => (
                  <StatPill key={label} value={val} label={label} />
                ))}
              </div>
            </>
          ) : (
            <>
              <img
                src={illustration}
                alt="AI Beauty skin analysis illustration"
                className="w-full h-auto drop-shadow-xl mb-8"
              />
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Smart Skin Analysis</h3>
              <p className="text-slate-500 text-[14px] leading-relaxed">
                Experience AI-powered beauty consultation and book your perfect salon instantly.
              </p>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default Login;
