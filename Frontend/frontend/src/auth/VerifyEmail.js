import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaShieldAlt } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const role = searchParams.get("role") || "customer";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

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
    // Only allow numbers
    if (value && isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input if digit entered
    if (value !== "" && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace handles clearing and shifting focus left
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
    if (code.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/verify-email`, {
        email,
        code,
      });
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
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post(`${API_BASE}/api/auth/resend-otp`, { email });
      setSuccess("New verification code sent!");
      setResendTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0].focus();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const isShopOwner = role === "shop_owner";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 relative overflow-hidden">
        {/* Decorative Blob */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl ${isShopOwner ? 'bg-teal-200/40' : 'bg-purple-200/40'}`} />

        <div className="text-center relative z-10">
          <div className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-6 ${isShopOwner ? 'bg-gradient-to-tr from-teal-500 to-emerald-600' : 'bg-gradient-to-tr from-purple-600 to-pink-500'}`}>
            <FaShieldAlt />
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-2">Verify Your Email</h1>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            We sent a verification code to <br/>
            <span className="font-bold text-slate-800">{email}</span>
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">⚠️ {error}</div>
          )}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-100 text-green-700 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">✅ {success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => inputsRef.current[idx] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className={`w-12 h-14 text-center text-2xl font-black bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all ${isShopOwner ? 'focus:ring-teal-500/50' : 'focus:ring-purple-500/50'}`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-2xl font-bold text-white text-sm shadow-lg transform transition-all ${loading ? 'bg-slate-300 cursor-not-allowed' : isShopOwner ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:scale-[1.01]' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.01]'}`}
            >
              {loading ? "Verifying..." : "Verify Code →"}
            </button>
          </form>

          <div className="mt-8 text-sm text-slate-500">
            Didn't receive the code?{" "}
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={loading}
                className={`font-bold hover:underline ${isShopOwner ? 'text-teal-600 font-semibold' : 'text-purple-600 font-semibold'}`}
              >
                Resend Code
              </button>
            ) : (
              <span className="text-slate-400 font-medium">Resend in {resendTimer}s</span>
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-slate-600">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
