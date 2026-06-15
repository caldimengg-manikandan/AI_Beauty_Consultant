import { useState, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaStore, FaUser } from "react-icons/fa";
import illustration from "../assets/auth_illustration.png";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // "customer" or "shop_owner" – default from URL param if present
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

      // Redirect based on role
      if (role === "admin") {
        navigate("/dashboard/admin");
      } else if (role === "shop_owner" || account_type === "shop_owner") {
        navigate("/dashboard/shop-owner");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === "Email not verified") {
        setError("Your email is not verified. Redirecting to verification...");
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(email)}&role=${roleType}`);
        }, 1500);
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

      {/* LEFT SIDE - FORM */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12 relative z-10">

        {/* Logo */}
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg ${isShopOwner ? 'bg-gradient-to-tr from-teal-500 to-emerald-600' : 'bg-gradient-to-tr from-purple-600 to-pink-500'}`}>
              {isShopOwner ? <FaStore /> : "AI"}
            </div>
            <span className="font-black text-xl text-gray-800">GlowAI</span>
          </Link>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            {isShopOwner ? "Partner Portal" : "Welcome Back"}
          </h1>
          <p className="text-slate-500">
            {isShopOwner ? "Manage your salon, bookings & customers." : "Unlock real-time skin insights & book salons."}
          </p>
        </div>

        {/* Role Switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-8 gap-1">
          <button
            type="button"
            onClick={() => { setRoleType("customer"); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${!isShopOwner
              ? "bg-white text-purple-700 shadow-md"
              : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaUser className="text-xs" /> Customer
          </button>
          <button
            type="button"
            onClick={() => { setRoleType("shop_owner"); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${isShopOwner
              ? "bg-white text-teal-700 shadow-md"
              : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaStore className="text-xs" /> Shop Owner
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 shadow-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-md">

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                className={`w-full pl-11 pr-5 py-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-slate-900 placeholder-slate-400 transition-all font-medium ${isShopOwner ? 'focus:ring-teal-500/50 focus:border-teal-500 border-slate-200' : 'focus:ring-purple-500/50 focus:border-purple-500 border-slate-200'}`}
                placeholder={isShopOwner ? "salon@business.com" : "name@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Password</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full pl-11 pr-12 py-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-slate-900 placeholder-slate-400 transition-all font-medium ${isShopOwner ? 'focus:ring-teal-500/50 focus:border-teal-500 border-slate-200' : 'focus:ring-purple-500/50 focus:border-purple-500 border-slate-200'}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className={`text-sm font-semibold transition-colors ${isShopOwner ? 'text-teal-600 hover:text-teal-800' : 'text-purple-600 hover:text-purple-800'}`}>
              Forgot Password?
            </Link>
          </div>

          <button
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-white text-base tracking-wide shadow-lg transform transition-all duration-300 ${loading
              ? 'bg-slate-300 cursor-not-allowed'
              : isShopOwner
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 hover:scale-[1.01] active:scale-[0.98] shadow-teal-500/20'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-[1.01] active:scale-[0.98] shadow-purple-500/20'
            }`}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <p className="mt-8 text-slate-500 text-sm">
          {isShopOwner ? "New salon/parlour?" : "New here?"}{" "}
          <Link
            to={isShopOwner ? "/signup?role=shop_owner" : "/signup"}
            className={`font-bold hover:underline ${isShopOwner ? 'text-teal-600 hover:text-teal-800' : 'text-purple-600 hover:text-purple-800'}`}
          >
            {isShopOwner ? "Register your business →" : "Create an account →"}
          </Link>
        </p>

        {!isShopOwner && (
          <p className="mt-2 text-sm text-slate-400">
            Are you a salon owner?{" "}
            <button onClick={() => setRoleType("shop_owner")} className="text-teal-600 font-semibold hover:underline">
              Switch to Partner Portal
            </button>
          </p>
        )}

        <div className="mt-auto pt-8 text-xs text-slate-400">© 2026 GlowAI. All rights reserved.</div>
      </div>

      {/* RIGHT SIDE */}
      <div className={`hidden md:flex flex-col items-center justify-center relative p-12 overflow-hidden transition-all duration-500 ${isShopOwner ? 'bg-gradient-to-br from-teal-50 to-emerald-50' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}>
        <div className={`absolute top-20 right-20 w-80 h-80 rounded-full blur-3xl animate-pulse-slow ${isShopOwner ? 'bg-teal-200/30' : 'bg-purple-200/30'}`} />
        <div className={`absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl animate-pulse-slow ${isShopOwner ? 'bg-emerald-200/30' : 'bg-pink-200/30'}`} />

        <div className="relative z-10 text-center max-w-md">
          {isShopOwner ? (
            <>
              <div className="text-8xl mb-6">🏪</div>
              <h3 className="text-3xl font-bold text-slate-800 mb-4">Grow Your Business</h3>
              <p className="text-slate-500 text-lg leading-relaxed">
                Join 500+ salons, parlours & spas on GlowAI. Manage bookings, track earnings, and build a loyal customer base — all in one place.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                {[['500+', 'Partner Salons'], ['10K+', 'Monthly Bookings'], ['4.8★', 'Avg Rating']].map(([val, label]) => (
                  <div key={label} className="bg-white/70 backdrop-blur rounded-2xl p-3">
                    <div className="font-black text-teal-700 text-xl">{val}</div>
                    <div className="text-xs text-gray-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <img src={illustration} alt="AI Beauty" className="w-full h-auto drop-shadow-2xl mb-8 hover:scale-[1.02] transition-transform duration-700" />
              <h3 className="text-3xl font-bold text-slate-800 mb-4">Smart Skin Analysis</h3>
              <p className="text-slate-500 text-lg leading-relaxed">
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
