import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiKey, FiCode, FiZap, FiCopy, FiTrash2, FiPlus, FiEye, FiEyeOff,
  FiCheckCircle, FiXCircle, FiClock, FiSend, FiFileText, FiChevronDown, FiChevronUp,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  getApiKeys, generateApiKey, deleteApiKey,
  getWebhooks, registerWebhook, deleteWebhook, testWebhook,
} from '../../services/developerApi';
import {
  getMyTemplates, createTemplate, deleteTemplate, getMySubmissions,
} from '../../services/formApi';

// Sample illustrative data only — the backend doesn't yet persist a delivery-log
// collection for webhook dispatch attempts, so this tab stays informational.
const DELIVERY_LOGS = [
  { id: 'l1', event: 'booking.created',   url: 'https://mysite.com/hooks/booking', status: 200, time: '2026-06-09 14:32', latency: '142ms' },
  { id: 'l2', event: 'payment.success',   url: 'https://mysite.com/hooks/payment', status: 200, time: '2026-06-09 12:10', latency: '98ms'  },
  { id: 'l3', event: 'booking.cancelled', url: 'https://mysite.com/hooks/booking', status: 502, time: '2026-06-08 18:45', latency: '3010ms' },
  { id: 'l4', event: 'payment.failed',    url: 'https://mysite.com/hooks/payment', status: 200, time: '2026-06-08 11:02', latency: '120ms' },
];

const CODE_SNIPPET = `curl -X POST https://api.beautyai.app/v1/bookings \\
  -H "Authorization: Bearer bty_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "service_id": "svc_haircut",
    "slot": "2026-06-15T10:00:00Z",
    "client_name": "Priya Sharma"
  }'`;

const FIELD_TYPES = ['text', 'number', 'select', 'checkbox'];

const normalizeKey = (k) => ({
  id: k.id,
  name: k.name,
  key: k.secret_key,
  created: (k.created_at || '').slice(0, 10),
  calls: k.calls || 0,
  status: k.is_active === false ? 'revoked' : 'active',
});

const normalizeHook = (h) => ({
  id: h.id,
  url: h.url,
  events: h.events || [],
  status: h.is_active === false ? 'inactive' : 'active',
  last_triggered: h.last_triggered,
});

const emptyField = () => ({ id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, label: '', type: 'text', required: false, options: [] });

export default function DeveloperAPI({ section } = {}) {
  const [tab, setTab] = useState(section === 'webhooks' ? 'webhooks' : section === 'forms' ? 'forms' : 'keys');

  // Sync tab when the parent navigates between /forms and /webhooks routes
  // (component isn't remounted because it stays in the same ShopOwnerDashboard tree)
  useEffect(() => {
    if (section !== undefined) {
      setTab(section === 'webhooks' ? 'webhooks' : section === 'forms' ? 'forms' : 'keys');
    }
  }, [section]);

  // ── API Keys ────────────────────────────────────────────────────────────
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [reveal, setReveal] = useState({});
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [showNewKey, setShowNewKey] = useState(null);

  const fetchKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      const data = await getApiKeys();
      setKeys(Array.isArray(data) ? data.map(normalizeKey) : []);
    } catch (e) {
      toast.error('Could not load API keys');
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  // ── Webhooks ────────────────────────────────────────────────────────────
  const [hooks, setHooks] = useState([]);
  const [loadingHooks, setLoadingHooks] = useState(true);
  const [newHookUrl, setNewHookUrl] = useState('');
  const [newHookEvents, setNewHookEvents] = useState('booking.created');
  const [creatingHook, setCreatingHook] = useState(false);

  const fetchHooks = useCallback(async () => {
    setLoadingHooks(true);
    try {
      const data = await getWebhooks();
      setHooks(Array.isArray(data) ? data.map(normalizeHook) : []);
    } catch (e) {
      toast.error('Could not load webhooks');
    } finally {
      setLoadingHooks(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); fetchHooks(); }, [fetchKeys, fetchHooks]);

  // ── Custom Forms ────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [formsLoaded, setFormsLoaded] = useState(false);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const [newFormFields, setNewFormFields] = useState([emptyField()]);
  const [creatingForm, setCreatingForm] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState(null);

  const fetchForms = useCallback(async () => {
    setLoadingForms(true);
    try {
      const [tpls, subs] = await Promise.all([getMyTemplates(), getMySubmissions()]);
      setTemplates(Array.isArray(tpls) ? tpls : []);
      setSubmissions(Array.isArray(subs) ? subs : []);
      setFormsLoaded(true);
    } catch (e) {
      toast.error('Could not load forms');
    } finally {
      setLoadingForms(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'forms' && !formsLoaded) fetchForms();
  }, [tab, formsLoaded, fetchForms]);

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  const createKey = async () => {
    if (!newKeyName.trim()) return toast.error('Enter a key name');
    setCreatingKey(true);
    try {
      const res = await generateApiKey();
      const fullSecret = res?.data?.secret_key;
      setShowNewKey(fullSecret || null);
      setNewKeyName('');
      await fetchKeys();
      toast.success('API key generated');
    } catch (e) {
      toast.error('Failed to generate key');
    } finally {
      setCreatingKey(false);
    }
  };

  const revokeKey = async (id) => {
    try {
      await deleteApiKey(id);
      setKeys(prev => prev.filter(k => k.id !== id));
      toast.success('Key revoked');
    } catch (e) {
      toast.error('Failed to revoke key');
    }
  };

  const createHook = async () => {
    if (!newHookUrl.trim().startsWith('http')) return toast.error('Enter a valid http/https URL');
    const events = newHookEvents.split(',').map(s => s.trim()).filter(Boolean);
    if (events.length === 0) return toast.error('Add at least one event');
    setCreatingHook(true);
    try {
      await registerWebhook({ url: newHookUrl.trim(), events });
      setNewHookUrl('');
      await fetchHooks();
      toast.success('Webhook registered');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to register webhook');
    } finally {
      setCreatingHook(false);
    }
  };

  const sendTestPing = async (id) => {
    try {
      await testWebhook(id);
      toast.success('Test payload dispatched');
    } catch (e) {
      toast.error('Failed to send test payload');
    }
  };

  const removeHook = async (id) => {
    try {
      await deleteWebhook(id);
      setHooks(prev => prev.filter(h => h.id !== id));
      toast.success('Webhook deleted');
    } catch (e) {
      toast.error('Failed to delete webhook');
    }
  };

  const updateField = (idx, patch) => {
    setNewFormFields(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));
  };
  const addField = () => setNewFormFields(prev => [...prev, emptyField()]);
  const removeField = (idx) => setNewFormFields(prev => prev.filter((_, i) => i !== idx));

  const resetFormBuilder = () => {
    setNewFormTitle('');
    setNewFormDescription('');
    setNewFormFields([emptyField()]);
    setShowFormBuilder(false);
  };

  const submitNewTemplate = async () => {
    if (!newFormTitle.trim()) return toast.error('Enter a form title');
    const cleanFields = newFormFields.filter(f => f.label.trim());
    if (cleanFields.length === 0) return toast.error('Add at least one field with a label');
    setCreatingForm(true);
    try {
      await createTemplate({
        title: newFormTitle.trim(),
        description: newFormDescription.trim(),
        fields: cleanFields.map(f => ({
          id: f.id,
          label: f.label.trim(),
          type: f.type,
          required: f.required,
          options: f.type === 'select' ? f.options : [],
        })),
      });
      toast.success('Form template created');
      resetFormBuilder();
      setFormsLoaded(false); // trigger refetch
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to create form');
    } finally {
      setCreatingForm(false);
    }
  };

  const removeTemplate = async (id) => {
    try {
      await deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
    } catch (e) {
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'API Keys',     value: keys.filter(k=>k.status==='active').length,  color: 'from-violet-500 to-purple-600', icon: <FiKey/> },
          { label: 'Webhooks',     value: hooks.filter(h=>h.status==='active').length, color: 'from-teal-500 to-emerald-600',  icon: <FiZap/> },
          { label: 'Form Templates', value: templates.length, color: 'from-blue-500 to-indigo-600', icon: <FiFileText/> },
          { label: 'API Calls',    value: `${(keys.reduce((s,k)=>s+k.calls,0)/1000).toFixed(1)}k`, color: 'from-amber-500 to-orange-600', icon: <FiCode/> },
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
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {[['keys','🔑 API Keys'], ['webhooks','⚡ Webhooks'], ['forms','📝 Custom Forms'], ['logs','📋 Delivery Logs'], ['docs','📖 Quick Docs']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${tab===k ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* API KEYS */}
      {tab === 'keys' && (
        <div className="space-y-4">
          {/* New key revealed */}
          <AnimatePresence>
            {showNewKey && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiCheckCircle className="text-emerald-600"/>
                  <span className="text-sm font-black text-emerald-800">API Key Created — Copy now, it won't be shown again</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-emerald-200 px-3 py-2">
                  <code className="flex-1 text-xs font-mono text-emerald-700 break-all">{showNewKey}</code>
                  <button onClick={() => copy(showNewKey)} className="text-emerald-600 hover:text-emerald-800"><FiCopy size={14}/></button>
                </div>
                <button onClick={() => setShowNewKey(null)} className="mt-2 text-xs text-emerald-600 hover:underline">Dismiss</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create key */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3">
            <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. My Integration)"
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"/>
            <motion.button whileTap={{ scale: 0.97 }} onClick={createKey} disabled={creatingKey}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-xs font-black rounded-xl hover:bg-violet-700 disabled:opacity-60 shrink-0">
              {creatingKey ? <><div className="w-3.5 h-3.5 border-2 border-violet-300 border-t-white rounded-full animate-spin"/>Generating…</> : <><FiPlus size={13}/>Generate Key</>}
            </motion.button>
          </div>

          {/* Keys list */}
          {loadingKeys ? (
            <p className="text-xs text-slate-400 text-center py-6">Loading keys…</p>
          ) : keys.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No API keys yet. Generate one above.</p>
          ) : keys.map((k, idx) => (
            <motion.div key={k.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
              className={`bg-white rounded-2xl border shadow-sm p-4 ${k.status === 'revoked' ? 'border-slate-100 opacity-60' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FiKey className={k.status === 'active' ? 'text-violet-500' : 'text-slate-400'} size={13}/>
                    <span className="text-sm font-black text-slate-800">{k.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${k.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {k.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5">
                    <code className="flex-1 text-[11px] font-mono text-slate-600 truncate">
                      {reveal[k.id] ? k.key : (k.key || '').replace(/^(.{6}).+(.{4})$/, (m, a, b) => `${a}●●●●●●●●●●●●${b}`)}
                    </code>
                    <button onClick={() => setReveal(prev => ({ ...prev, [k.id]: !prev[k.id] }))} className="text-slate-400 hover:text-slate-600">
                      {reveal[k.id] ? <FiEyeOff size={12}/> : <FiEye size={12}/>}
                    </button>
                    {k.status !== 'revoked' && <button onClick={() => copy(k.key)} className="text-slate-400 hover:text-violet-600"><FiCopy size={12}/></button>}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Created {k.created} · {k.calls.toLocaleString()} calls</p>
                </div>
                {k.status === 'active' && (
                  <button onClick={() => revokeKey(k.id)} className="text-red-400 hover:text-red-600 shrink-0 mt-1">
                    <FiTrash2 size={14}/>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* WEBHOOKS */}
      {tab === 'webhooks' && (
        <div className="space-y-4">
          {/* Register webhook */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
            <div className="flex gap-3">
              <input value={newHookUrl} onChange={e => setNewHookUrl(e.target.value)}
                placeholder="https://your-app.com/hooks/booking"
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"/>
              <motion.button whileTap={{ scale: 0.97 }} onClick={createHook} disabled={creatingHook}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-xs font-black rounded-xl hover:bg-violet-700 disabled:opacity-60 shrink-0">
                {creatingHook ? 'Registering…' : <><FiPlus size={13}/>Register</>}
              </motion.button>
            </div>
            <input value={newHookEvents} onChange={e => setNewHookEvents(e.target.value)}
              placeholder="Events, comma-separated (e.g. booking.created, payment.success)"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"/>
          </div>

          {loadingHooks ? (
            <p className="text-xs text-slate-400 text-center py-6">Loading webhooks…</p>
          ) : hooks.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No webhooks registered yet.</p>
          ) : hooks.map((h, idx) => (
            <motion.div key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FiZap className={h.status === 'active' ? 'text-amber-500' : 'text-slate-400'} size={13}/>
                    <code className="text-xs font-mono text-slate-700 truncate">{h.url}</code>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${h.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {h.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {h.events.map(e => (
                      <span key={e} className="text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => sendTestPing(h.id)} title="Send test ping"
                    className="flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700 transition-all">
                    <FiSend size={11}/>Test
                  </button>
                  <button onClick={() => removeHook(h.id)} className="text-red-400 hover:text-red-600">
                    <FiTrash2 size={14}/>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CUSTOM FORMS */}
      {tab === 'forms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800">Form Templates</h3>
            <button onClick={() => setShowFormBuilder(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-black rounded-xl hover:bg-violet-700">
              <FiPlus size={12}/>{showFormBuilder ? 'Close' : 'New Form'}
            </button>
          </div>

          <AnimatePresence>
            {showFormBuilder && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 overflow-hidden">
                <input value={newFormTitle} onChange={e => setNewFormTitle(e.target.value)}
                  placeholder="Form title (e.g. New Client Intake)"
                  className="w-full text-sm font-bold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"/>
                <input value={newFormDescription} onChange={e => setNewFormDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"/>

                <div className="space-y-2">
                  {newFormFields.map((f, idx) => (
                    <div key={f.id} className="flex flex-wrap items-center gap-2 bg-slate-50 rounded-xl p-2.5">
                      <input value={f.label} onChange={e => updateField(idx, { label: e.target.value })}
                        placeholder="Field label" className="flex-1 min-w-[120px] text-xs border border-slate-200 rounded-lg px-2 py-1.5"/>
                      <select value={f.type} onChange={e => updateField(idx, { type: e.target.value })}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5">
                        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {f.type === 'select' && (
                        <input value={(f.options || []).join(', ')}
                          onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          placeholder="Options, comma-separated" className="flex-1 min-w-[140px] text-xs border border-slate-200 rounded-lg px-2 py-1.5"/>
                      )}
                      <label className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                        <input type="checkbox" checked={f.required} onChange={e => updateField(idx, { required: e.target.checked })}/>
                        Required
                      </label>
                      <button onClick={() => removeField(idx)} className="text-red-400 hover:text-red-600"><FiTrash2 size={13}/></button>
                    </div>
                  ))}
                  <button onClick={addField} className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1">
                    <FiPlus size={11}/>Add field
                  </button>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={submitNewTemplate} disabled={creatingForm}
                  className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-xs font-black rounded-xl hover:bg-violet-700 disabled:opacity-60">
                  {creatingForm ? 'Saving…' : <><FiCheckCircle size={13}/>Save Form Template</>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingForms ? (
            <p className="text-xs text-slate-400 text-center py-6">Loading forms…</p>
          ) : templates.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No form templates yet. Click "New Form" to create your first intake form.</p>
          ) : templates.map((t, idx) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FiFileText className="text-violet-500" size={13}/>
                    <span className="text-sm font-black text-slate-800">{t.title}</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{(t.fields || []).length} fields</span>
                  </div>
                  {t.description && <p className="text-[11px] text-slate-500">{t.description}</p>}
                </div>
                <button onClick={() => removeTemplate(t.id)} className="text-red-400 hover:text-red-600 shrink-0">
                  <FiTrash2 size={14}/>
                </button>
              </div>
            </motion.div>
          ))}

          {submissions.length > 0 && (
            <div className="pt-2">
              <h3 className="text-sm font-black text-slate-800 mb-2">Recent Submissions</h3>
              <div className="space-y-2">
                {submissions.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5">
                    <button onClick={() => setExpandedSubmission(prev => prev === s.id ? null : s.id)}
                      className="w-full flex items-center justify-between gap-3 text-left">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">{s.form_title} — {s.customer_name}</p>
                        <p className="text-[10px] text-slate-400">{s.customer_email} · {(s.submitted_at || '').slice(0, 10)}</p>
                      </div>
                      {expandedSubmission === s.id ? <FiChevronUp className="text-slate-400 shrink-0"/> : <FiChevronDown className="text-slate-400 shrink-0"/>}
                    </button>
                    {expandedSubmission === s.id && (
                      <div className="mt-2 bg-slate-50 rounded-xl p-3 space-y-1">
                        {Object.entries(s.responses || {}).map(([k, v]) => (
                          <p key={k} className="text-[11px] text-slate-600"><span className="font-bold text-slate-700">{k}:</span> {String(v)}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DELIVERY LOGS */}
      {tab === 'logs' && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400 px-1">Sample data shown below — full delivery-log history is on the roadmap.</p>
          {DELIVERY_LOGS.map((log, idx) => (
            <motion.div key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 flex flex-wrap items-center gap-3">
              <div className={`text-xs font-black px-2 py-1 rounded-lg ${log.status === 200 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {log.status === 200 ? <FiCheckCircle className="inline mr-1" size={10}/> : <FiXCircle className="inline mr-1" size={10}/>}
                {log.status}
              </div>
              <span className="text-[11px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">{log.event}</span>
              <code className="text-[10px] text-slate-500 font-mono flex-1 truncate">{log.url}</code>
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1"><FiClock size={10}/>{log.latency}</p>
                <p className="text-[10px] text-slate-400">{log.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* QUICK DOCS */}
      {tab === 'docs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-black text-slate-800 mb-1">Base URL</h3>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 mt-2">
              <code className="flex-1 text-xs font-mono text-slate-700">https://api.beautyai.app/v1</code>
              <button onClick={() => copy('https://api.beautyai.app/v1')} className="text-slate-400 hover:text-violet-600"><FiCopy size={13}/></button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-800">Create Booking</h3>
              <button onClick={() => copy(CODE_SNIPPET)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600"><FiCopy size={11}/>Copy</button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 text-[11px] font-mono rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">{CODE_SNIPPET}</pre>
          </div>
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
            <p className="text-xs font-black text-violet-800">📖 Full API Documentation</p>
            <p className="text-[11px] text-violet-600 mt-0.5">Visit <span className="font-mono underline">docs.beautyai.app</span> for complete endpoint reference, SDKs, and code samples.</p>
          </div>
        </div>
      )}
    </div>
  );
}
