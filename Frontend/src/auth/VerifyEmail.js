import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ── Inline SVG Icons ── */
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
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
const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const role  = searchParams.get("role") || "customer";

  const [otp, setOtp]               = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend]   = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (value && isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== "" && index < 5) inputsRef.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").trim();
    if (text.length === 6 && !isNaN(text)) {
      const digits = text.split("");
      setOtp(digits);
      inputsRef.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/verify-email`, { email, code });
      setSuccess(res.data.message || "Email verified! Redirecting to login...");
      setTimeout(() => {
        navigate(role === "shop_owner" ? "/login?role=shop_owner" : "/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      await axios.post(`${API_BASE}/api/auth/resend-otp`, { email });
      setSuccess("New verification code sent!");
      setResendTimer(60); setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0].focus();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const isShopOwner = role === "shop_owner";
  const brandColor  = isShopOwner ? "#F59E0B" : "#5B4FF7";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 shadow-md p-8">

        {/* Icon */}
        <div
          className="w-14 h-14 mx-auto mb-6 rounded-2xl flex items-center justify-center text-white"
          style={{ background: brandColor }}
        >
          <IconShield />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Verify Your Email</h1>
          <p className="text-slate-500 text-[14px] leading-relaxed">
            We sent a 6-digit verification code to<br />
            <span className="font-semibold text-slate-700">{email}</span>
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div role="alert" aria-live="polite" className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium text-red-700 bg-red-50 border border-red-100">
            <IconAlertCircle />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div role="status" aria-live="polite" className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100">
            <IconCheckCircle />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* OTP Inputs */}
          <fieldset>
            <legend className="sr-only">Enter 6-digit verification code</legend>
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => inputsRef.current[idx] = el}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  aria-label={`Digit ${idx + 1} of 6`}
                  className="w-11 h-13 text-center text-xl font-black bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none transition-all duration-150"
                  style={{
                    height: "52px",
                    focusBorderColor: brandColor,
                  }}
                  onFocus={e => { e.target.style.borderColor = brandColor; e.target.style.boxShadow = `0 0 0 3px ${brandColor}22`; }}
                  onBlur={e => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
                />
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-[14px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: loading ? "#CBD5E1" : brandColor,
              cursor: loading ? "not-allowed" : "pointer",
              // eslint-disable-next-line no-dupe-keys
              ...(loading ? {} : {}),
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            {loading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Verifying...</>
            ) : (
              <>Verify Code <IconArrowRight /></>
            )}
          </button>
        </form>

        {/* Resend */}
        <p className="mt-6 text-center text-[13px] text-slate-500">
          Didn't receive the code?{" "}
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={loading}
              className="font-semibold hover:underline focus:outline-none focus-visible:ring-2 rounded transition-colors"
              style={{ color: brandColor }}
            >
              Resend Code
            </button>
          ) : (
            <span className="text-slate-400 font-medium">Resend in {resendTimer}s</span>
          )}
        </p>

        {/* Back to login */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center">
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 rounded"
          >
            <IconArrowLeft /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
