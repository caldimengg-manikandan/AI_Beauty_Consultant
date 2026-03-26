import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { login as apiLogin } from "../services/api";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import illustration from "../assets/auth_illustration.png";
import LanguageSwitcher from "../components/LanguageSwitcher";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

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
      const res = await apiLogin({ email, password });
      // Backend returns { access_token, token_type }
      login(res.access_token);
      // Store email for navbar display
      localStorage.setItem('email', email);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white overflow-hidden">

      {/* LEFT SIDE - FORM */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10 animate-fade-in-left">

        {/* Global Action Bar */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center md:hidden lg:flex">
          <div>{/* Logo or back button */}</div>
          <LanguageSwitcher variant="minimal" />
        </div>

        {/* Logo Area */}
        <div className="mb-12">
          <div className="h-12 w-12 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg mb-6 text-white text-2xl font-bold transform rotate-3 hover:rotate-6 transition-transform">
            AI
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-slate-500 text-lg">
            Unlock real-time skin insights.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center shadow-sm animate-pulse">
            <span className="mr-2 text-lg">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaEnvelope className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              </div>
              <input
                type="email"
                className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-slate-900 placeholder-slate-400 transition-all font-medium"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaLock className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full pl-11 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-slate-900 placeholder-slate-400 transition-all font-medium"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors p-1"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <a href="#" className="text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors">
              Forgot Password?
            </a>
          </div>

          <button
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg tracking-wide shadow-lg shadow-teal-500/20 transform transition-all duration-300
                ${loading
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 hover:scale-[1.01] active:scale-[0.98]'
              }`}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <p className="mt-10 text-slate-500">
          Start your journey?{" "}
          <Link to="/signup" className="text-teal-600 font-bold hover:text-teal-800 transition-colors">
            Create an account
          </Link>
        </p>

        <div className="mt-auto pt-10 text-xs text-slate-400">
          © 2026 AI Beauty Consultant. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE - ILLUSTRATION */}
      <div className="hidden md:flex flex-col items-center justify-center relative bg-gradient-to-br from-teal-50 to-blue-50 p-12 overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-20 right-20 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>

        <div className="relative z-10 max-w-lg w-full flex justify-center">
          <img
            src={illustration}
            alt="AI Analysis Illustration"
            className="w-full h-auto drop-shadow-2xl animate-fade-in-up hover:scale-[1.02] transition-transform duration-700 cursor-pointer"
          />
        </div>

        <div className="mt-12 text-center max-w-md relative z-10">
          <h3 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">
            Smart Skin Analysis
          </h3>
          <p className="text-slate-500 text-lg leading-relaxed">
            Experience the future of dermatology with our advanced AI-powered diagnostics.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;
