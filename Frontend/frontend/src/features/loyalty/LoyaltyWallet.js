import { useState, useEffect, useCallback } from 'react';
import { FiGift, FiAward, FiStar, FiClock, FiCopy, FiChevronRight } from 'react-icons/fi';
import { getWallet, getLoyaltyTransactions, getTierInfo, applyReferral } from '../../services/loyaltyApi';
import { toast } from 'react-toastify';

export default function LoyaltyWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tierInfo, setTierInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [w, tx, t] = await Promise.all([
        getWallet(),
        getLoyaltyTransactions(),
        getTierInfo()
      ]);
      setWallet(w);
      setTransactions(tx.transactions);
      setTierInfo(t);
    } catch (e) { toast.error('Failed to load loyalty data'); }
    finally { setLoading(false); }
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
      toast.error(e?.response?.data?.detail || 'Invalid referral code');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const TIER_COLORS = {
    Bronze: 'from-amber-600 to-amber-800 text-amber-100',
    Silver: 'from-slate-400 to-slate-600 text-slate-100',
    Gold: 'from-yellow-400 to-amber-500 text-yellow-900',
    Platinum: 'from-slate-800 to-black text-slate-200'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Beauty Rewards</h2>
        <p className="text-slate-500 mt-2">Earn points on every booking and unlock exclusive perks</p>
      </div>

      {/* Wallet Card */}
      {wallet && (
        <div className={`relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br ${TIER_COLORS[wallet.tier] || TIER_COLORS.Bronze} shadow-xl`}>
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <FiAward className="text-9xl" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">{wallet.tier} Member</div>
              <div className="text-5xl font-black mb-2">{wallet.points.toLocaleString()} <span className="text-2xl font-bold opacity-80">pts</span></div>
              <div className="text-sm font-medium opacity-90">Wallet Balance: ₹{wallet.wallet_balance_inr}</div>
            </div>
            
            {wallet.next_tier && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[250px]">
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span>{wallet.tier}</span>
                  <span>{wallet.next_tier.name}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${wallet.tier_progress_pct}%` }} />
                </div>
                <div className="text-xs font-medium opacity-80 text-center">
                  {wallet.points_to_next_tier} points away from {wallet.next_tier.name}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Tiers & Perks */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Membership Tiers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tierInfo?.tiers.map((t, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border-2 transition-all ${wallet?.tier === t.name ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-700'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-900 dark:text-white">{t.name}</span>
                    {wallet?.tier === t.name && <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">Current</span>}
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    {t.min_points === 0 ? 'Entry Level' : `${t.min_points}+ points`}
                  </div>
                  <ul className="space-y-2">
                    {t.perks.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <FiCheck className="text-emerald-500 mt-0.5 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Referral & History */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
            <h3 className="font-black text-lg mb-2 flex items-center gap-2"><FiGift /> Got a Referral Code?</h3>
            <p className="text-sm text-indigo-100 mb-4">Apply a code to get an instant 200 pts bonus!</p>
            {wallet?.referral_applied ? (
              <div className="bg-white/20 backdrop-blur text-sm font-bold p-3 rounded-xl text-center border border-white/30">
                Referral bonus already claimed ✅
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 uppercase font-mono"
                />
                <button onClick={handleApplyReferral} disabled={applying} className="px-4 py-2.5 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-70">
                  {applying ? '...' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500">No transactions yet. Start booking to earn points!</div>
              ) : (
                transactions.map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tx.points > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                        {tx.points > 0 ? <FiStar /> : <FiClock />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{tx.description}</div>
                        <div className="text-xs text-slate-500">{new Date(tx.timestamp).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-black ${tx.points > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
