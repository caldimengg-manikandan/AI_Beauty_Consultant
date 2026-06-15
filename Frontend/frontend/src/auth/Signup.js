import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaUser, FaStore, FaPhone, FaBuilding, FaMapMarkerAlt
} from "react-icons/fa";
import illustration from "../assets/auth_illustration.png";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Field = ({ label, icon: Icon, type = "text", value, onChange, placeholder, required = true, isShopOwner, children }) => (
  <div>
    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      {children || (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-11 pr-5 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-slate-900 placeholder-slate-400 transition-all font-medium text-sm ${isShopOwner ? 'focus:ring-teal-500/50 focus:border-teal-500 border-slate-200' : 'focus:ring-purple-500/50 focus:border-purple-500 border-slate-200'}`}
        />
      )}
    </div>
  </div>
);

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [roleType, setRoleType] = useState(searchParams.get("role") || "customer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Customer fields
  const [customerForm, setCustomerForm] = useState({ email: "", password: "", confirmPassword: "", name: "", phone: "" });

  // Shop Owner fields
  const [ownerForm, setOwnerForm] = useState({
    email: "", password: "", confirmPassword: "",
    name: "", phone: "", business_name: "", business_city: "", business_type: "salon"
  });

  const isShopOwner = roleType === "shop_owner";

  const handleCustomerSignup = async (e) => {
    e.preventDefault();
    if (customerForm.password !== customerForm.confirmPassword) {
      setError("Passwords do not match"); return;
    }
    if (customerForm.password.length < 6) {
      setError("Password must be at least 6 characters"); return;
    }
    setLoading(true); setError(null);
    try {
      await axios.post(`${API_BASE}/api/auth/customer/signup`, {
        email: customerForm.email,
        password: customerForm.password,
        name: customerForm.name,
        phone: customerForm.phone,
      });
      setSuccess("Account created! Redirecting to verify your email...");
      setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(customerForm.email)}&role=customer`), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerSignup = async (e) => {
    e.preventDefault();
    if (ownerForm.password !== ownerForm.confirmPassword) {
      setError("Passwords do not match"); return;
    }
    if (ownerForm.password.length < 6) {
      setError("Password must be at least 6 characters"); return;
    }
    setLoading(true); setError(null);
    try {
      await axios.post(`${API_BASE}/api/auth/shop-owner/signup`, {
        email: ownerForm.email,
        password: ownerForm.password,
        name: ownerForm.name,
        phone: ownerForm.phone,
        business_name: ownerForm.business_name,
        business_city: ownerForm.business_city,
        business_type: ownerForm.business_type,
      });
      setSuccess("Partner account created! Redirecting to verify your email...");
      setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(ownerForm.email)}&role=shop_owner`), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white overflow-hidden">

      {/* LEFT SIDE - FORM */}
      <div className="flex flex-col justify-center px-8 sm:px-14 lg:px-18 py-8 relative z-10 overflow-y-auto">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${isShopOwner ? 'bg-gradient-to-tr from-teal-500 to-emerald-600' : 'bg-gradient-to-tr from-purple-600 to-pink-500'}`}>
            {isShopOwner ? <FaStore className="text-sm" /> : "AI"}
          </div>
          <span className="font-black text-xl text-gray-800">GlowAI</span>
        </Link>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
          {isShopOwner ? "Register Your Business" : "Create Your Account"}
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          {isShopOwner ? "Join 500+ salon partners on GlowAI" : "Join thousands improving their beauty & skin health"}
        </p>

        {/* Role Switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6 gap-1">
          <button type="button" onClick={() => { setRoleType("customer"); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${!isShopOwner ? "bg-white text-purple-700 shadow-md" : "text-gray-500"}`}>
            <FaUser className="text-xs" /> Customer
          </button>
          <button type="button" onClick={() => { setRoleType("shop_owner"); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${isShopOwner ? "bg-white text-teal-700 shadow-md" : "text-gray-500"}`}>
            <FaStore className="text-xs" /> Shop Owner
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">⚠️ {error}</div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-100 text-green-700 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">✅ {success}</div>
        )}

        {/* ── CUSTOMER FORM ── */}
        {!isShopOwner && (
          <form onSubmit={handleCustomerSignup} className="space-y-4 w-full max-w-md">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name" icon={FaUser} value={customerForm.name} onChange={e => setCustomerForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" isShopOwner={false} />
              <Field label="Phone Number" icon={FaPhone} type="tel" value={customerForm.phone} onChange={e => setCustomerForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765..." required={false} isShopOwner={false} />
            </div>
            <Field label="Email Address" icon={FaEnvelope} type="email" value={customerForm.email} onChange={e => setCustomerForm(f => ({ ...f, email: e.target.value }))} placeholder="name@example.com" isShopOwner={false} />
            <Field label="Password" icon={FaLock} isShopOwner={false}>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? "text" : "password"} value={customerForm.password} onChange={e => setCustomerForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" required className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm font-medium" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Field>
            <Field label="Confirm Password" icon={FaLock} isShopOwner={false}>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? "text" : "password"} value={customerForm.confirmPassword} onChange={e => setCustomerForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat password" required className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm font-medium" />
              </div>
            </Field>
            <button disabled={loading} className={`w-full py-3 rounded-xl font-bold text-white text-sm shadow-lg transform transition-all ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.01] shadow-purple-500/20'}`}>
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
          </form>
        )}

        {/* ── SHOP OWNER FORM ── */}
        {isShopOwner && (
          <form onSubmit={handleOwnerSignup} className="space-y-4 w-full max-w-md">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Owner Name *" icon={FaUser} value={ownerForm.name} onChange={e => setOwnerForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" isShopOwner={true} />
              <Field label="Phone Number *" icon={FaPhone} type="tel" value={ownerForm.phone} onChange={e => setOwnerForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765..." isShopOwner={true} />
            </div>
            <Field label="Email Address *" icon={FaEnvelope} type="email" value={ownerForm.email} onChange={e => setOwnerForm(f => ({ ...f, email: e.target.value }))} placeholder="salon@business.com" isShopOwner={true} />
            <Field label="Business Name *" icon={FaBuilding} value={ownerForm.business_name} onChange={e => setOwnerForm(f => ({ ...f, business_name: e.target.value }))} placeholder="e.g. Bliss Beauty Parlour" isShopOwner={true} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="City *" icon={FaMapMarkerAlt} value={ownerForm.business_city} onChange={e => setOwnerForm(f => ({ ...f, business_city: e.target.value }))} placeholder="Chennai" isShopOwner={true} />
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Business Type *</label>
                <select value={ownerForm.business_type} onChange={e => setOwnerForm(f => ({ ...f, business_type: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm font-medium text-slate-700">
                  <option value="salon">Salon</option>
                  <option value="parlour">Parlour</option>
                  <option value="spa">Spa</option>
                </select>
              </div>
            </div>
            <Field label="Password *" icon={FaLock} isShopOwner={true}>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? "text" : "password"} value={ownerForm.password} onChange={e => setOwnerForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" required className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-sm font-medium" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Field>
            <Field label="Confirm Password *" icon={FaLock} isShopOwner={true}>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? "text" : "password"} value={ownerForm.confirmPassword} onChange={e => setOwnerForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat password" required className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm font-medium" />
              </div>
            </Field>
            <button disabled={loading} className={`w-full py-3 rounded-xl font-bold text-white text-sm shadow-lg transform transition-all ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:scale-[1.01] shadow-teal-500/20'}`}>
              {loading ? "Registering Business..." : "Register My Business →"}
            </button>
          </form>
        )}

        <p className="mt-5 text-slate-500 text-sm">
          Already have an account?{" "}
          <Link to={isShopOwner ? "/login?role=shop_owner" : "/login"} className={`font-bold hover:underline ${isShopOwner ? 'text-teal-600' : 'text-purple-600'}`}>
            Log In →
          </Link>
        </p>

        <div className="mt-auto pt-6 text-xs text-slate-400">© 2026 GlowAI. All rights reserved.</div>
      </div>

      {/* RIGHT SIDE */}
      <div className={`hidden md:flex flex-col items-center justify-center relative p-12 overflow-hidden transition-all duration-500 ${isShopOwner ? 'bg-gradient-to-br from-teal-50 to-emerald-50' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}>
        <div className={`absolute top-20 right-20 w-80 h-80 rounded-full blur-3xl animate-pulse-slow ${isShopOwner ? 'bg-teal-200/30' : 'bg-purple-200/30'}`} />
        <div className={`absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl animate-pulse-slow ${isShopOwner ? 'bg-emerald-200/30' : 'bg-pink-200/30'}`} />

        <div className="relative z-10 text-center max-w-md">
          {isShopOwner ? (
            <>
              <div className="text-7xl mb-6">🏪</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Start Growing Today</h3>
              <p className="text-slate-500 leading-relaxed text-sm">List your salon and start receiving bookings from thousands of customers. Free to register.</p>
              <div className="mt-6 space-y-3 text-left">
                {['✅ Free listing on the marketplace', '📅 Real-time slot management', '📊 Customer analytics dashboard', '⭐ Build reviews & ratings', '💬 Direct customer connect'].map(b => (
                  <div key={b} className="bg-white/70 backdrop-blur rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium">{b}</div>
                ))}
              </div>
            </>
          ) : (
            <>
              <img src={illustration} alt="AI Beauty" className="w-full h-auto drop-shadow-2xl mb-6 hover:scale-[1.02] transition-transform duration-700" />
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Join the Community</h3>
              <p className="text-slate-500 leading-relaxed">Start your AI-powered skin health journey. Discover salons, book appointments, get personalised beauty advice.</p>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default Signup;
