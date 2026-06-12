import { useState, useEffect, useCallback } from "react";
import { FaGift, FaAward, FaStar, FaClock, FaCopy, FaCheck, FaChevronRight } from "react-icons/fa";
import { getWallet, getLoyaltyTransactions, getTierInfo, applyReferral } from "../../services/loyaltyApi";
import { toast } from "react-toastify";

const TIER_GRADIENTS = {
  Bronze:   "from-amber-500 to-amber-700",
  Silver:   "from-slate-400 to-slate-600",
  Gold:     "from-yellow-400 to-amber-500",
  Platinum: "from-violet-600 to-slate-800",
};

const SkeletonBlock = ({ h = "h-10", w = "w-full" }) => (
  <div className={`${h} ${w} bg-slate-100 rounded-xl animate-pulse`} />
);

export default function LoyaltyWallet() {
  const [wallet,       setWallet]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tierInfo,     setTierInfo]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [applying,     setApplying]     = useState(false);
  const [copied,       setCopied]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, tx, t] = await Promise.all([
        getWallet(),
        getLoyaltyTransactions(),
        getTierInfo(),
      ]);
      setWallet(w);
      setTransactions(tx.transactions || []);
      setTierInfo(t);
    } catch {
      toast.error("Failed to load loyalty data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApplyReferral = async () => {
    if (!referralCode.trim()) return;
    setApplying(true);
    try {
      const res = await applyReferral(referralCode);
      toast.success(res.message);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Invalid referral code");
    } finally {
      setApplying(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const gradient = wallet ? (TIER_GRADIENTS[wallet.tier] || TIER_GRADIENTS.Bronze) : "from-violet-600 to-teal-500";

  return (
    <div className="min-h-screen bg-[#fafaf9] p-5 lg:p-10 font-sans selection:bg-violet-100">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* hero */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="px-3 py-1 bg-violet-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">Loyalty Program</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse inline-block" /> Beauty Rewards
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-1">
            My <span className="text-teal-600">Rewards</span>
          </h1>
          <p className="text-sm text-slate-500">Earn points on every booking and unlock exclusive perks.</p>
        </div>

        {/* wallet card */}
        {loading ? (
          <div className="rounded-3xl overflow-hidden animate-pulse bg-slate-200 h-48" />
        ) : wallet && (
          <div className={`relative overflow-hidden rounded-3xl p-7 bg-gradient-to-br ${gradient} text-white shadow-xl`}>
            {/* decorative circle */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/5 rounded-full blur-xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaAward className="text-white/70 text-sm" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{wallet.tier} Member</span>
                </div>
                <div className="text-5xl font-black mb-1 tracking-tight">
                  {wallet.points.toLocaleString()}
                  <span className="text-2xl font-bold opacity-60 ml-2">pts</span>
                </div>
                <div className="text-sm font-medium opacity-80">Wallet Balance: ₹{wallet.wallet_balance_inr}</div>
              </div>

              {wallet.next_tier && (
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 min-w-[240px] border border-white/20">
                  <div className="flex justify-between text-xs font-black mb-2.5">
                    <span>{wallet.tier}</span>
                    <span>{wallet.next_tier.name}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${wallet.tier_progress_pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-medium opacity-80 text-center">
                    {wallet.points_to_next_tier} pts to {wallet.next_tier.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* tiers */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Membership Tiers</p>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => <SkeletonBlock key={i} h="h-28" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tierInfo?.tiers.map((t, idx) => {
                  const isCurrent = wallet?.tier === t.name;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isCurrent
                          ? "border-violet-400 bg-violet-50"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-black text-slate-900">{t.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-black px-2 py-0.5 bg-violet-600 text-white rounded-full uppercase tracking-wide">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                        {t.min_points === 0 ? "Entry Level" : `${t.min_points}+ pts`}
                      </div>
                      <ul className="space-y-1.5">
                        {t.perks.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <FaCheck className="text-emerald-500 mt-0.5 flex-shrink-0 text-[10px]" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* right col */}
          <div className="space-y-5">
            {/* referral */}
            <div className="bg-gradient-to-br from-violet-600 to-teal-500 rounded-2xl p-5 text-white shadow-lg shadow-violet-100">
              <div className="flex items-center gap-2 mb-1">
                <FaGift className="text-white/80" />
                <h3 className="font-black text-sm">Got a Referral Code?</h3>
              </div>
              <p className="text-xs text-white/70 mb-4">Apply a code to get an instant 200 pts bonus!</p>

              {loading ? (
                <div className="h-10 bg-white/20 rounded-xl animate-pulse" />
              ) : wallet?.referral_applied ? (
                <div className="bg-white/20 text-xs font-bold p-3 rounded-xl text-center border border-white/30">
                  Referral bonus already claimed ✅
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={e => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-white/15 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 uppercase font-mono text-sm"
                  />
                  <button
                    onClick={handleApplyReferral}
                    disabled={applying}
                    className="px-4 py-2.5 bg-white text-violet-700 font-black rounded-xl hover:bg-white/90 transition-colors disabled:opacity-60 text-xs uppercase tracking-wide"
                  >
                    {applying ? "…" : "Apply"}
                  </button>
                </div>
              )}
            </div>

            {/* recent activity */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Recent Activity</p>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <SkeletonBlock key={i} h="h-12" />)}
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  No transactions yet. Start booking to earn points!
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.points > 0 ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-400"}`}>
                          {tx.points > 0 ? <FaStar className="text-xs" /> : <FaClock className="text-xs" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{tx.description}</p>
                          <p className="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-black flex-shrink-0 ${tx.points > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {tx.points > 0 ? "+" : ""}{tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
