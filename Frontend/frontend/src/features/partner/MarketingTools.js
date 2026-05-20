import { useState, useEffect, useCallback } from 'react';
import { FiTag, FiSend, FiPlus, FiMessageCircle, FiTrash2, FiSearch, FiCheck, FiPieChart, FiX, FiZap, FiSettings } from 'react-icons/fi';
import { getOwnerCoupons, createCoupon, toggleCoupon, deleteCoupon, getCampaigns, createCampaign, sendCampaign, generateCampaignCopy, getAutomations, toggleAutomation } from '../../services/partnerApi';
import { toast } from 'react-toastify';

export default function MarketingTools() {
  const [activeTab, setActiveTab] = useState('coupons'); // coupons | campaigns
  const [coupons, setCoupons] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Coupon Modal
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '', discount_type: 'percentage', discount_value: 0,
    min_booking_amount: 0, valid_from: new Date().toISOString().slice(0, 10),
    valid_until: '', max_uses: 100, description: ''
  });

  // Campaign Modal
  const [showCampModal, setShowCampModal] = useState(false);
  const [campForm, setCampForm] = useState({
    title: '', message: '', target_audience: 'all', campaign_type: 'promotional'
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [coupRes, campRes, autoRes] = await Promise.all([getOwnerCoupons(), getCampaigns(), getAutomations()]);
      setCoupons(coupRes);
      setCampaigns(campRes);
      setAutomations(autoRes);
    } catch (e) { toast.error('Failed to load marketing data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveCoupon = async () => {
    if (!couponForm.code || couponForm.discount_value <= 0) return toast.warning('Code and discount value required');
    try {
      await createCoupon(couponForm);
      toast.success('Coupon created');
      setShowCouponModal(false); load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to create coupon'); }
  };

  const handleToggleCoupon = async (id) => {
    try { await toggleCoupon(id); load(); }
    catch { toast.error('Failed to update coupon'); }
  };

  const handleSaveCampaign = async () => {
    if (!campForm.title || !campForm.message) return toast.warning('Title and message required');
    try {
      await createCampaign(campForm);
      toast.success('Campaign drafted');
      setShowCampModal(false); load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to create campaign'); }
  };

  const handleSendCampaign = async (id) => {
    if (!window.confirm('Send this campaign now? This cannot be undone.')) return;
    try {
      await sendCampaign(id);
      toast.success('Campaign sent successfully');
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to send'); }
  };

  const handleAIGenerate = async () => {
    if (!campForm.target_audience) return toast.warning('Select audience first');
    setGeneratingAi(true);
    try {
      const intentMap = {
        'all': 'discount', 'new': 'discount', 'returning': 'festival', 'vip': 'festival', 'inactive': 'reactivation'
      };
      const res = await generateCampaignCopy({
        intent: intentMap[campForm.target_audience],
        audience: campForm.target_audience,
        tone: 'luxury',
        discount_amount: '20%'
      });
      setCampForm({ ...campForm, message: res.generated_message, title: res.suggested_title });
      toast.success('AI generated high-converting copy!');
    } catch (e) { toast.error('Failed to generate AI copy'); }
    finally { setGeneratingAi(false); }
  };

  const handleToggleAutomation = async (id) => {
    try {
      await toggleAutomation(id);
      load();
    } catch (e) { toast.error('Failed to toggle automation'); }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Marketing & Promotions</h2>
          <p className="text-sm text-slate-500 mt-1">Drive bookings with coupons and targeted campaigns</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('coupons')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'coupons' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>Coupons</button>
          <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'campaigns' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>Campaigns</button>
          <button onClick={() => setActiveTab('automations')} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'automations' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 flex items-center gap-1'} `}><FiZap className={activeTab === 'automations' ? 'text-white' : 'text-amber-500'}/> Automations</button>
        </div>
      </div>

      {activeTab === 'coupons' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Coupons</h3>
            <button onClick={() => setShowCouponModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">
              <FiPlus /> New Coupon
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map(c => (
              <div key={c.id} className={`p-5 rounded-2xl border-2 transition-all ${c.is_active ? 'bg-white border-indigo-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="font-mono text-xl font-black text-indigo-600 tracking-wider bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100/50">{c.code}</div>
                  <button onClick={() => handleToggleCoupon(c.id)} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {c.is_active ? 'Active' : 'Paused'}
                  </button>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-1">
                  {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">{c.description || 'No description provided'}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
                  <div>Uses: <span className="text-slate-900 font-bold">{c.used_count}</span> / {c.max_uses}</div>
                  <div>Min Bill: ₹{c.min_booking_amount}</div>
                </div>
              </div>
            ))}
            {coupons.length === 0 && !loading && (
              <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500">
                <FiTag className="mx-auto text-3xl mb-3 text-slate-300" />
                No coupons created yet. Offer a discount to attract more customers!
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Push Campaigns</h3>
            <button onClick={() => setShowCampModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">
              <FiSend /> New Campaign
            </button>
          </div>

          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${c.status === 'sent' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                    {c.status === 'sent' ? <FiCheck /> : <FiMessageCircle />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{c.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1 max-w-xl">{c.message}</p>
                    <div className="flex gap-3 mt-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <span>Target: {c.target_audience}</span>
                      <span>•</span>
                      <span>Reach: {c.status === 'sent' ? c.sent_count : c.estimated_reach}</span>
                      <span>•</span>
                      <span className={c.status === 'sent' ? 'text-emerald-500' : 'text-amber-500'}>{c.status}</span>
                    </div>
                  </div>
                </div>
                {c.status === 'draft' && (
                  <button onClick={() => handleSendCampaign(c.id)} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
                    Send Now
                  </button>
                )}
              </div>
            ))}
            {campaigns.length === 0 && !loading && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500">
                <FiSend className="mx-auto text-3xl mb-3 text-slate-300" />
                Draft a campaign to engage your audience.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'automations' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Marketing Automations</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automations.map(auto => (
              <div key={auto.id} className={`p-6 rounded-3xl border-2 transition-all flex flex-col ${auto.is_active ? 'bg-white border-indigo-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${auto.is_active ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-200 text-slate-400'}`}>
                      <FiSettings size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{auto.name}</h4>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Trigger: {auto.trigger_type.replace(/_/g, ' ')}</div>
                    </div>
                  </div>
                  <div onClick={() => handleToggleAutomation(auto.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${auto.is_active ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${auto.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1 block">AI Message Template</span>
                  <p className="text-sm text-slate-600">{auto.message_template}</p>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span className="bg-slate-100 px-3 py-1 rounded-lg">Triggered: {auto.metrics.triggered}</span>
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg">Converted: {auto.metrics.converted}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Create Coupon</h3>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Code</label><input type="text" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="w-full px-4 py-2 border rounded-xl font-mono uppercase" placeholder="e.g. SUMMER20" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-slate-500 uppercase">Type</label><select value={couponForm.discount_type} onChange={e => setCouponForm({...couponForm, discount_type: e.target.value})} className="w-full px-4 py-2 border rounded-xl"><option value="percentage">Percentage (%)</option><option value="flat">Flat Amount (₹)</option></select></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase">Value</label><input type="number" value={couponForm.discount_value} onChange={e => setCouponForm({...couponForm, discount_value: +e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
            </div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Min Booking Amt (₹)</label><input type="number" value={couponForm.min_booking_amount} onChange={e => setCouponForm({...couponForm, min_booking_amount: +e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Description</label><input type="text" value={couponForm.description} onChange={e => setCouponForm({...couponForm, description: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
            <div className="flex gap-3 pt-4"><button onClick={() => setShowCouponModal(false)} className="flex-1 py-2 border rounded-xl font-bold">Cancel</button><button onClick={handleSaveCoupon} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold">Save</button></div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Draft Campaign</h3>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Title</label><input type="text" value={campForm.title} onChange={e => setCampForm({...campForm, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="e.g. Weekend Flash Sale" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Target Audience</label><select value={campForm.target_audience} onChange={e => setCampForm({...campForm, target_audience: e.target.value})} className="w-full px-4 py-2 border rounded-xl"><option value="all">All Customers</option><option value="new">New Customers (1 visit)</option><option value="returning">Returning (2+ visits)</option><option value="vip">VIP (5+ visits)</option><option value="inactive">Inactive (30+ days)</option></select></div>
            <div className="relative">
              <label className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase mb-1">
                Message 
                <button onClick={handleAIGenerate} disabled={generatingAi} className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded transition-colors disabled:opacity-50">
                  <FiZap size={12} className={generatingAi ? "animate-pulse" : ""} /> {generatingAi ? 'Generating...' : 'AI Magic Write'}
                </button>
              </label>
              <textarea rows="3" value={campForm.message} onChange={e => setCampForm({...campForm, message: e.target.value})} className="w-full px-4 py-2 border rounded-xl resize-none" placeholder="Get 20% off all haircuts this weekend..." />
            </div>
            <div className="flex gap-3 pt-4"><button onClick={() => setShowCampModal(false)} className="flex-1 py-2 border rounded-xl font-bold">Cancel</button><button onClick={handleSaveCampaign} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold">Save Draft</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
