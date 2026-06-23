import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaUser, FaPhone, FaBuilding, FaMapMarkerAlt, FaGlobe
} from "react-icons/fa";
import illustration from "../assets/auth_illustration.png";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ── Inline SVG Icons ── */
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
const IconCheckCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* ── Reusable form field ── */
const Field = ({ id, label, icon: Icon, type = "text", value, onChange, placeholder, required = true, isShopOwner, children }) => (
  <div>
    <label htmlFor={id} className="text-[13px] font-semibold text-slate-700 mb-1.5 block">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
      {children || (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-11 pr-5 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 text-slate-900 placeholder-slate-400 transition-all duration-150 text-[13px] font-medium shadow-xs ${
            isShopOwner
              ? "border-slate-200 focus:ring-amber-400/30 focus:border-amber-400/60"
              : "border-slate-200 focus:ring-[#5B4FF7]/25 focus:border-[#5B4FF7]/50"
          }`}
        />
      )}
    </div>
  </div>
);

/* ── Benefit list item (replaces emoji bullets) ── */
const BenefitItem = ({ text, color = "teal" }) => {
  const colorMap = {
    teal:   "bg-teal-50 text-teal-600 border-teal-100",
    amber:  "bg-amber-50 text-amber-600 border-amber-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
  };
  return (
    <div className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-xl px-4 py-2.5 border border-slate-100">
      <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <IconCheck />
      </span>
      <span className="text-[13px] text-slate-700 font-medium">{text}</span>
    </div>
  );
};

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [roleType, setRoleType] = useState(searchParams.get("role") || "customer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Customer fields
  const [customerForm, setCustomerForm] = useState({ email: "", password: "", confirmPassword: "", name: "", phone: "", country: "IN" });

  // Shop Owner fields
  const [ownerForm, setOwnerForm] = useState({
    email: "", password: "", confirmPassword: "",
    name: "", phone: "", country: "IN", business_name: "", business_city: "", business_type: "salon"
  });

  const isShopOwner = roleType === "shop_owner";

  const validatePhone = (phone, countryCode) => {
    if (!phone) return { isValid: false, error: "Phone number is required." };
    let num = phone.replace(/\D/g, '');

    if (countryCode === 'IN') {
      if (num.length === 12 && num.startsWith('91')) num = num.slice(2);
      else if (num.length === 11 && num.startsWith('0')) num = num.slice(1);
      
      if (num.length !== 10 || !/^[6-9]\d{9}$/.test(num)) {
        return { isValid: false, error: "Please enter a valid 10-digit Indian phone number." };
      }
    } else if (countryCode === 'US') {
      if (num.length === 11 && num.startsWith('1')) num = num.slice(1);
      if (num.length !== 10 || !/^[2-9]\d{2}[2-9]\d{6}$/.test(num)) {
        return { isValid: false, error: "Please enter a valid US phone number (Area & Exchange codes cannot start with 0 or 1)." };
      }
    } else if (countryCode === 'UK') {
      if (num.length >= 11 && num.startsWith('44')) num = num.slice(2);
      else if (num.startsWith('0')) num = num.slice(1); 
      if (num.length < 9 || num.length > 11 || !/^[1-9]\d{8,10}$/.test(num)) {
        return { isValid: false, error: "Please enter a valid UK phone number (9-11 digits after dropping leading 0)." };
      }
    }
    return { isValid: true, error: null };
  };

  const handleCustomerSignup = async (e) => {
    e.preventDefault();
    if (customerForm.password !== customerForm.confirmPassword) { setError("Passwords do not match"); return; }
    if (customerForm.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (customerForm.phone) {
      const { isValid, error: phoneErr } = validatePhone(customerForm.phone, customerForm.country);
      if (!isValid) {
        setError(phoneErr);
        return;
      }
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
    if (ownerForm.password !== ownerForm.confirmPassword) { setError("Passwords do not match"); return; }
    if (ownerForm.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!ownerForm.phone) {
      setError("Phone number is required.");
      return;
    }
    const { isValid, error: phoneErr } = validatePhone(ownerForm.phone, ownerForm.country);
    if (!isValid) {
      setError(phoneErr);
      return;
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

      {/* ── LEFT — Form ── */}
      <div className="flex flex-col justify-center px-8 sm:px-14 lg:px-18 py-8 relative z-10 overflow-y-auto">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 mb-6" aria-label="Go to homepage">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm"
            style={{ background: isShopOwner ? '#F59E0B' : '#5B4FF7' }}>
            G
          </div>
          <span className="font-black text-[17px] tracking-tight text-slate-800">GlowAI</span>
        </Link>

        <h1 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
          {isShopOwner ? "Register Your Business" : "Create Your Account"}
        </h1>
        <p className="text-slate-500 text-[13px] mb-5">
          {isShopOwner ? "Join 500+ salon partners on GlowAI" : "Join thousands improving their beauty and skin health"}
        </p>

        {/* Role Toggle */}
        <div className="flex mb-5">
          <div
            className="inline-flex bg-slate-100 rounded-xl p-1 gap-1"
            role="group"
            aria-label="Account type selector"
          >
            <button
              type="button"
              id="signup-toggle-customer"
              onClick={() => { setRoleType("customer"); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-[10px] text-[13px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4FF7] ${
                !isShopOwner ? "bg-white text-[#5B4FF7] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <IconUser /> Customer
            </button>
            <button
              type="button"
              id="signup-toggle-shopowner"
              onClick={() => { setRoleType("shop_owner"); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-[10px] text-[13px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isShopOwner ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <IconBuilding /> Shop Owner
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div role="alert" aria-live="polite" className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium text-red-700 bg-red-50 border border-red-100">
            <IconAlertCircle />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div role="status" aria-live="polite" className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100">
            <IconCheckCircle />
            <span>{success}</span>
          </div>
        )}

        {/* ── CUSTOMER FORM ── */}
        {!isShopOwner && (
          <form onSubmit={handleCustomerSignup} className="space-y-4 w-full max-w-md" noValidate>
            <Field id="c-name" label="Full Name" icon={FaUser} value={customerForm.name} onChange={e => setCustomerForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" isShopOwner={false} />
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <div>
                <label htmlFor="c-country" className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Country</label>
                <div className="relative">
                  <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <select id="c-country" value={customerForm.country} onChange={e => setCustomerForm(f => ({ ...f, country: e.target.value }))} className="w-full pl-9 pr-2 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B4FF7]/25 focus:border-[#5B4FF7]/50 text-[13px] font-medium shadow-xs cursor-pointer appearance-none">
                    <option value="IN">🇮🇳 IN</option>
                    <option value="US">🇺🇸 US</option>
                    <option value="UK">🇬🇧 UK</option>
                  </select>
                </div>
              </div>
              <Field id="c-phone" label="Phone Number" icon={FaPhone} type="tel" value={customerForm.phone} onChange={e => setCustomerForm(f => ({ ...f, phone: e.target.value }))} placeholder={customerForm.country === 'IN' ? "+91 9876543210" : customerForm.country === 'US' ? "+1 2025550123" : "+44 7911123456"} required={false} isShopOwner={false} />
            </div>
            <Field id="c-email" label="Email Address" icon={FaEnvelope} type="email" value={customerForm.email} onChange={e => setCustomerForm(f => ({ ...f, email: e.target.value }))} placeholder="name@example.com" isShopOwner={false} />
            <Field id="c-password" label="Password" icon={FaLock} isShopOwner={false}>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input id="c-password" type={showPassword ? "text" : "password"} value={customerForm.password} onChange={e => setCustomerForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" required autoComplete="new-password" className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B4FF7]/25 focus:border-[#5B4FF7]/50 text-[13px] font-medium shadow-xs" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B4FF7]/40 rounded">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Field>
            <Field id="c-confirm" label="Confirm Password" icon={FaLock} isShopOwner={false}>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input id="c-confirm" type={showPassword ? "text" : "password"} value={customerForm.confirmPassword} onChange={e => setCustomerForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat password" required autoComplete="new-password" className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B4FF7]/25 focus:border-[#5B4FF7]/50 text-[13px] font-medium shadow-xs" />
              </div>
            </Field>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-[14px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#5B4FF7] ${loading ? "bg-slate-300 cursor-not-allowed" : "bg-[#5B4FF7] hover:bg-[#4a41d4] shadow-sm hover:shadow-md hover:shadow-[#5B4FF7]/20"}`}
            >
              {loading ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Creating Account...</>
              ) : (
                <>Create Account <IconArrowRight /></>
              )}
            </button>
          </form>
        )}

        {/* ── SHOP OWNER FORM ── */}
        {isShopOwner && (
          <form onSubmit={handleOwnerSignup} className="space-y-4 w-full max-w-md" noValidate>
            <Field id="o-name" label="Owner Name *" icon={FaUser} value={ownerForm.name} onChange={e => setOwnerForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" isShopOwner={true} />
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <div>
                <label htmlFor="o-country" className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Country *</label>
                <div className="relative">
                  <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <select id="o-country" value={ownerForm.country} onChange={e => setOwnerForm(f => ({ ...f, country: e.target.value }))} className="w-full pl-9 pr-2 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/60 text-[13px] font-medium shadow-xs cursor-pointer appearance-none">
                    <option value="IN">🇮🇳 IN</option>
                    <option value="US">🇺🇸 US</option>
                    <option value="UK">🇬🇧 UK</option>
                  </select>
                </div>
              </div>
              <Field id="o-phone" label="Phone Number *" icon={FaPhone} type="tel" value={ownerForm.phone} onChange={e => setOwnerForm(f => ({ ...f, phone: e.target.value }))} placeholder={ownerForm.country === 'IN' ? "+91 9876543210" : ownerForm.country === 'US' ? "+1 2025550123" : "+44 7911123456"} isShopOwner={true} />
            </div>
            <Field id="o-email" label="Email Address *" icon={FaEnvelope} type="email" value={ownerForm.email} onChange={e => setOwnerForm(f => ({ ...f, email: e.target.value }))} placeholder="salon@business.com" isShopOwner={true} />
            <Field id="o-bname" label="Business Name *" icon={FaBuilding} value={ownerForm.business_name} onChange={e => setOwnerForm(f => ({ ...f, business_name: e.target.value }))} placeholder="e.g. Bliss Beauty Parlour" isShopOwner={true} />
            <div className="grid grid-cols-2 gap-3">
              <Field id="o-city" label="City *" icon={FaMapMarkerAlt} value={ownerForm.business_city} onChange={e => setOwnerForm(f => ({ ...f, business_city: e.target.value }))} placeholder="Chennai" isShopOwner={true} />
              <div>
                <label htmlFor="o-btype" className="text-[13px] font-semibold text-slate-700 mb-1.5 block">Business Type *</label>
                <select id="o-btype" value={ownerForm.business_type} onChange={e => setOwnerForm(f => ({ ...f, business_type: e.target.value }))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/60 text-[13px] font-medium text-slate-700 shadow-xs cursor-pointer">
                  <option value="salon">Salon</option>
                  <option value="parlour">Parlour</option>
                  <option value="spa">Spa</option>
                </select>
              </div>
            </div>
            <Field id="o-password" label="Password *" icon={FaLock} isShopOwner={true}>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input id="o-password" type={showPassword ? "text" : "password"} value={ownerForm.password} onChange={e => setOwnerForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" required autoComplete="new-password" className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/60 text-[13px] font-medium shadow-xs" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 rounded">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Field>
            <Field id="o-confirm" label="Confirm Password *" icon={FaLock} isShopOwner={true}>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input id="o-confirm" type={showPassword ? "text" : "password"} value={ownerForm.confirmPassword} onChange={e => setOwnerForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat password" required autoComplete="new-password" className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/60 text-[13px] font-medium shadow-xs" />
              </div>
            </Field>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-[14px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500 ${loading ? "bg-slate-300 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 shadow-sm hover:shadow-md hover:shadow-amber-500/20"}`}
            >
              {loading ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Registering Business...</>
              ) : (
                <>Register My Business <IconArrowRight /></>
              )}
            </button>
          </form>
        )}

        <p className="mt-5 text-slate-500 text-[13px]">
          Already have an account?{" "}
          <Link to={isShopOwner ? "/login?role=shop_owner" : "/login"} className="font-bold text-[#5B4FF7] hover:text-[#4a41d4] hover:underline transition-colors">
            Sign in
          </Link>
        </p>

        <div className="mt-auto pt-6 text-[11px] text-slate-400">
          © {new Date().getFullYear()} GlowAI. All rights reserved.
        </div>
      </div>

      {/* ── RIGHT — Visual panel ── */}
      <div
        className={`hidden md:flex flex-col items-center justify-center relative p-12 overflow-hidden transition-colors duration-500 ${
          isShopOwner ? "bg-[#FFFBEB]" : "bg-[#F5F3FF]"
        }`}
      >
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
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Start Growing Today</h3>
              <p className="text-slate-500 text-[13px] leading-relaxed mb-5">
                List your salon and start receiving bookings from thousands of customers. Free to register.
              </p>
              <div className="space-y-2.5 text-left">
                <BenefitItem text="Free listing on the marketplace" color="teal" />
                <BenefitItem text="Real-time slot management" color="amber" />
                <BenefitItem text="Customer analytics dashboard" color="violet" />
                <BenefitItem text="Build reviews and ratings" color="teal" />
                <BenefitItem text="Direct customer messaging" color="amber" />
              </div>
            </>
          ) : (
            <>
              <img
                src={illustration}
                alt="AI Beauty skin analysis illustration"
                className="w-full h-auto drop-shadow-xl mb-5"
              />
              <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Join the Community</h3>
              <p className="text-slate-500 text-[13px] leading-relaxed">
                Start your AI-powered skin health journey. Discover salons, book appointments, and get personalised beauty advice.
              </p>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default Signup;
