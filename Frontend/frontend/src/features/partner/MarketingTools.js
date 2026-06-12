import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  FiTag, FiSend, FiPlus, FiMessageCircle, FiTrash2, FiX,
  FiZap, FiUsers, FiMail, FiToggleLeft, FiToggleRight, FiCopy,
} from 'react-icons/fi';
import { toast } from 'react-toastify';

/* ── Mock data ── */
const MOCK_COUPONS = [
  { id: 1, code: 'SUMMER30', type: 'percentage', value: 30, uses: 47, max_uses: 100, expiry: '2026-07-31', active: true, min_amount: 500 },
  { id: 2, code: 'NEWCLIENT', type: 'percentage', value: 20, uses: 12, max_uses: 50,  expiry: '2026-08-31', active: true, min_amount: 0 },
  { id: 3, code: 'FLAT500',   type: 'flat',       value: 500, uses: 8,  max_uses: 30,  expiry: '2026-06-30', active: false, min_amount: 2000 },
  { id: 4, code: 'BRIDE2026', type: 'percentage', value: 15, uses: 3,  max_uses: 20,  expiry: '2026-12-31', active: true, min_amount: 5000 },
];

const MOCK_CAMPAIGNS = [
  { id: 1, title: 'Monsoon Glow Special', type: 'email',   audience: 'All Clients',        sent: 384, opened: 212, status: 'sent',    date: '2026-06-05' },
  { id: 2, title: 'Re-engage Inactive',   type: 'sms',    audience: 'Inactive 30+ days',  sent: 91,  opened: 67,  status: 'sent',    date: '2026-06-01' },
  { id: 3, title: 'Summer Bridal Offers', type: 'email',  audience: 'Premium Clients',    sent: 0,   opened: 0,   status: 'draft',   date: '2026-06-10' },
  { id: 4, title: 'Weekend Nail Flash',   type: 'sms',    audience: 'Nail Clients',        sent: 0,   opened: 0,   status: 'draft',   date: '2026-06-10' },
];

const AUDIENCE_OPTIONS = [
  'All Clients', 'Inactive 30+ days', 'Inactive 60+ days', 'Premium Clients', 'New This Month', 'Birthday This Month',
];

const PIE_DATA = [
  { name: 'Email Opened', value: 212, color: '#7c3aed' },
  { name: 'Not Opened',   value: 172, color: '#e2e8f0' },
];

const EMPTY_COUPON = { code: '', type: 'percentage', value: '', max_uses: 100, expiry: '', min_amount: 0, description: '' };
const EMPTY_CAMPAIGN = { title: '', message: '', audience: 'All Clients', type: 'email' };

export default function MarketingTools() {
  const [tab, setTab]               = useState('campaigns');
  const [coupons, setCoupons]       = useState(MOCK_COUPONS);
  const [campaigns, setCampaigns]   = useState(MOCK_CAMPAIGNS);
  const [showCoupon, setShowCoupon] = useState(false);
  const [showCamp, setShowCamp]     = useState(false);
  const [couponForm, setCouponForm] = useState(EMPTY_COUPON);
  const [campForm, setCampForm]     = useState(EMPTY_CAMPAIGN);
  const [generatingAI, setGenAI]   = useState(false);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code = Array(8).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    setCouponForm(f => ({ ...f, code }));
  };

  const handleAIMessage = async () => {
    setGenAI(true);
    setTimeout(() => {
      const templates = [
        `Hey {{name}}! ✨ Exclusive ${campForm.audience === 'Inactive 30+ days' ? 'come-back' : 'summer'} offer just for you — book this week and save big. Limited slots!`,
        `Hi {{name}}, we miss you at [Salon Name]! 💅 Book your next appointment today and enjoy a special treat from us.`,
        `{{name}}, glow season is HERE! Book your Monsoon Glow Facial + get a complimentary eyebrow shaping. Tap to book now!`,
      ];
      setCampForm(f => ({ ...f, message: templates[Math.floor(Math.random() * templates.length)] }));
      setGenAI(false);
      toast.success('AI message generated!');
    }, 1800);
  };

  const toggleCoupon = (id) => setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));

  const saveCoupon = () => {
    if (!couponForm.code || !couponForm.value || !couponForm.expiry) return toast.error('Fill all required fields');
    setCoupons(prev => [...prev, { ...couponForm, id: Date.now(), uses: 0, active: true, value: +couponForm.value, max_uses: +couponForm.max_uses, min_amount: +couponForm.min_amount }]);
    setShowCoupon(false); setCouponForm(EMPTY_COUPON);
    toast.success('Coupon created!');
  };

  const sendCampaign = (id) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'sent', sent: Math.floor(Math.random()*400)+50 } : c));
    toast.success('Campaign sent!');
  };

  const saveCampaign = () => {
    if (!campForm.title || !campForm.message) return toast.error('Title and message required');
    setCampaigns(prev => [...prev, { ...campForm, id: Date.now(), sent: 0, opened: 0, status: 'draft', date: new Date().toISOString().slice(0,10) }]);
    setShowCamp(false); setCampForm(EMPTY_CAMPAIGN);
    toast.success('Campaign saved as draft!');
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Coupons',   value: coupons.filter(c=>c.active).length,                  color: 'from-violet-500 to-purple-600', icon: <FiTag /> },
          { label: 'Total Campaigns',  value: campaigns.length,                                      color: 'from-teal-500 to-emerald-600',  icon: <FiMail /> },
          { label: 'Clients Reached',  value: campaigns.reduce((s,c)=>s+c.sent,0),                  color: 'from-blue-500 to-indigo-600',   icon: <FiUsers /> },
          { label: 'Avg Open Rate',    value: `${Math.round(campaigns.filter(c=>c.sent>0).reduce((s,c)=>s+(c.opened/c.sent)*100,0)/Math.max(1,campaigns.filter(c=>c.sent>0).length))}%`, color: 'from-amber-500 to-orange-600', icon: <FiZap /> },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y: -3 }}
            className={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-4 shadow-lg`}>
            <div className="text-xl mb-2 opacity-80">{s.icon}</div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-[11px] font-semibold opacity-75 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[['campaigns','📣 Campaigns'], ['coupons','🏷️ Coupons']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2 rounded-lg text-xs font-black transition-all ${tab===k ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* CAMPAIGNS TAB */}
      {tab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowCamp(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-teal-500 text-white text-xs font-black rounded-xl shadow-lg">
              <FiPlus /> New Campaign
            </motion.button>
          </div>
          <div className="grid gap-3">
            {campaigns.map((camp, idx) => (
              <motion.div key={camp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm ${camp.type === 'email' ? 'bg-violet-500' : 'bg-teal-500'}`}>
                    {camp.type === 'email' ? <FiMail /> : <FiMessageCircle />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{camp.title}</p>
                    <p className="text-[11px] text-slate-400">{camp.audience} · {camp.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {camp.status === 'sent' && (
                    <div className="text-center">
                      <p className="text-base font-black text-slate-800">{camp.sent}</p>
                      <p className="text-[10px] text-slate-400">Sent</p>
                    </div>
                  )}
                  {camp.status === 'sent' && (
                    <div className="text-center">
                      <p className="text-base font-black text-violet-600">{camp.sent > 0 ? Math.round(camp.opened/camp.sent*100) : 0}%</p>
                      <p className="text-[10px] text-slate-400">Open Rate</p>
                    </div>
                  )}
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${camp.status === 'sent' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                    {camp.status === 'sent' ? 'Sent' : 'Draft'}
                  </span>
                  {camp.status === 'draft' && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => sendCampaign(camp.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700">
                      <FiSend size={11}/> Send Now
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* COUPONS TAB */}
      {tab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowCoupon(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-teal-500 text-white text-xs font-black rounded-xl shadow-lg">
              <FiPlus /> Create Coupon
            </motion.button>
          </div>
          <div className="grid gap-3">
            {coupons.map((coupon, idx) => (
              <motion.div key={coupon.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-wrap items-center justify-between gap-3 ${!coupon.active ? 'opacity-60' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-violet-100 rounded-xl">
                    <span className="font-mono text-sm font-black text-violet-700">{coupon.code}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {coupon.type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}
                      {coupon.min_amount > 0 && <span className="text-xs font-normal text-slate-400 ml-1">· min ₹{coupon.min_amount}</span>}
                    </p>
                    <p className="text-[11px] text-slate-400">{coupon.uses}/{coupon.max_uses} uses · Expires {coupon.expiry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(coupon.uses/coupon.max_uses)*100}%` }}/>
                  </div>
                  <button onClick={() => toggleCoupon(coupon.id)}
                    className={`text-xl transition-colors ${coupon.active ? 'text-violet-500' : 'text-slate-300'}`}>
                    {coupon.active ? <FiToggleRight/> : <FiToggleLeft/>}
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success('Code copied!'); }}
                    className="text-slate-300 hover:text-violet-500 transition-colors"><FiCopy size={14}/></button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      <AnimatePresence>
        {showCamp && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCamp(false)}/>
            <motion.div className="relative z-10 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-6"
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-black text-slate-800">New Campaign</h2>
                <button onClick={() => setShowCamp(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><FiX/></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Campaign Title</label>
                  <input value={campForm.title} onChange={e => setCampForm(f=>({...f, title: e.target.value}))} placeholder="e.g. Monsoon Glow Special"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Channel</label>
                    <select value={campForm.type} onChange={e => setCampForm(f=>({...f, type: e.target.value}))}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300">
                      <option value="email">📧 Email</option>
                      <option value="sms">💬 SMS</option>
                      <option value="whatsapp">💚 WhatsApp</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Target Audience</label>
                    <select value={campForm.audience} onChange={e => setCampForm(f=>({...f, audience: e.target.value}))}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300">
                      {AUDIENCE_OPTIONS.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Message</label>
                    <button onClick={handleAIMessage} disabled={generatingAI}
                      className="flex items-center gap-1 text-[10px] font-black text-violet-600 hover:opacity-70 disabled:opacity-50">
                      <FiZap size={10}/> {generatingAI ? 'Generating…' : 'AI Generate'}
                    </button>
                  </div>
                  <textarea value={campForm.message} onChange={e => setCampForm(f=>({...f, message: e.target.value}))}
                    placeholder="Write your message or use AI Generate…" rows={4}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none leading-relaxed"/>
                  <p className="text-[10px] text-slate-400 mt-1">Use {'{{name}}'} for personalisation</p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={saveCampaign}
                className="mt-5 w-full py-3 bg-gradient-to-r from-violet-600 to-teal-500 text-white font-black rounded-2xl text-sm shadow-lg">
                Save as Draft
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE COUPON MODAL */}
      <AnimatePresence>
        {showCoupon && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCoupon(false)}/>
            <motion.div className="relative z-10 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md p-6"
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-black text-slate-800">Create Coupon</h2>
                <button onClick={() => setShowCoupon(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><FiX/></button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Coupon Code</label>
                    <input value={couponForm.code} onChange={e => setCouponForm(f=>({...f, code: e.target.value.toUpperCase()}))} placeholder="e.g. SUMMER30"
                      className="w-full font-mono text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"/>
                  </div>
                  <div className="flex items-end">
                    <button onClick={generateCode} className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 mb-0.5">Auto</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Discount Type</label>
                    <select value={couponForm.type} onChange={e => setCouponForm(f=>({...f, type: e.target.value}))}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300">
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Value</label>
                    <input type="number" value={couponForm.value} onChange={e => setCouponForm(f=>({...f, value: e.target.value}))}
                      placeholder={couponForm.type === 'percentage' ? '30' : '500'}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Max Uses</label>
                    <input type="number" value={couponForm.max_uses} onChange={e => setCouponForm(f=>({...f, max_uses: e.target.value}))}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Expiry Date</label>
                    <input type="date" value={couponForm.expiry} onChange={e => setCouponForm(f=>({...f, expiry: e.target.value}))}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Min. Booking Amount (₹)</label>
                  <input type="number" value={couponForm.min_amount} onChange={e => setCouponForm(f=>({...f, min_amount: e.target.value}))}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"/>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={saveCoupon}
                className="mt-5 w-full py-3 bg-gradient-to-r from-violet-600 to-teal-500 text-white font-black rounded-2xl text-sm shadow-lg">
                Create Coupon
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
