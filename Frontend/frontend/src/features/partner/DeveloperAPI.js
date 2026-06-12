import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiKey, FiCode, FiZap, FiCopy, FiTrash2, FiPlus, FiEye, FiEyeOff, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';

const MOCK_KEYS = [
  { id: 'k1', name: 'Production API Key',  key: 'bty_live_9xKp2mRqNv8dYfTzWs', created: '2026-05-01', calls: 18420, status: 'active'   },
  { id: 'k2', name: 'Staging API Key',     key: 'bty_test_4aLc7hJbXw3eTyUqPr', created: '2026-04-15', calls: 3201,  status: 'active'   },
  { id: 'k3', name: 'Legacy Key (Revoked)',key: 'bty_live_XXXXXXXXXXXXXXXXXXXXXXX', created: '2025-11-10', calls: 0, status: 'revoked' },
];

const MOCK_WEBHOOKS = [
  { id: 'w1', url: 'https://mysite.com/hooks/booking',   events: ['booking.created','booking.cancelled'], status: 'active'   },
  { id: 'w2', url: 'https://mysite.com/hooks/payment',   events: ['payment.success','payment.failed'],    status: 'active'   },
  { id: 'w3', url: 'https://staging.mysite.com/hooks',   events: ['booking.created'],                     status: 'inactive' },
];

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

export default function DeveloperAPI() {
  const [tab, setTab]         = useState('keys');
  const [keys, setKeys]       = useState(MOCK_KEYS);
  const [hooks, setHooks]     = useState(MOCK_WEBHOOKS);
  const [reveal, setReveal]   = useState({});
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating]     = useState(false);
  const [showNewKey, setShowNewKey] = useState(null);

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  const createKey = () => {
    if (!newKeyName.trim()) return toast.error('Enter a key name');
    setCreating(true);
    setTimeout(() => {
      const generatedKey = `bty_live_${Math.random().toString(36).substring(2,18)}`;
      const nk = { id: `k${Date.now()}`, name: newKeyName, key: generatedKey, created: new Date().toISOString().slice(0,10), calls: 0, status: 'active' };
      setKeys(prev => [nk, ...prev]);
      setShowNewKey(generatedKey);
      setNewKeyName('');
      setCreating(false);
    }, 1200);
  };

  const revokeKey = (id) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
    toast.success('Key revoked');
  };

  const toggleHook = (id) => {
    setHooks(prev => prev.map(h => h.id === id ? { ...h, status: h.status === 'active' ? 'inactive' : 'active' } : h));
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'API Keys',     value: keys.filter(k=>k.status==='active').length,  color: 'from-violet-500 to-purple-600', icon: <FiKey/> },
          { label: 'Webhooks',     value: hooks.filter(h=>h.status==='active').length, color: 'from-teal-500 to-emerald-600',  icon: <FiZap/> },
          { label: 'API Calls',    value: `${(keys.reduce((s,k)=>s+k.calls,0)/1000).toFixed(1)}k`, color: 'from-blue-500 to-indigo-600', icon: <FiCode/> },
          { label: 'Success Rate', value: '98.7%', color: 'from-amber-500 to-orange-600', icon: <FiCheckCircle/> },
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
        {[['keys','🔑 API Keys'], ['webhooks','⚡ Webhooks'], ['logs','📋 Delivery Logs'], ['docs','📖 Quick Docs']].map(([k,l]) => (
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
            <motion.button whileTap={{ scale: 0.97 }} onClick={createKey} disabled={creating}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-xs font-black rounded-xl hover:bg-violet-700 disabled:opacity-60 shrink-0">
              {creating ? <><div className="w-3.5 h-3.5 border-2 border-violet-300 border-t-white rounded-full animate-spin"/>Generating…</> : <><FiPlus size={13}/>Generate Key</>}
            </motion.button>
          </div>

          {/* Keys list */}
          {keys.map((k, idx) => (
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
                      {reveal[k.id] ? k.key : k.key.replace(/bty_(live|test)_.+/, (m) => m.slice(0,12) + '●●●●●●●●●●●●')}
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
        <div className="space-y-3">
          {hooks.map((h, idx) => (
            <motion.div key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FiZap className={h.status === 'active' ? 'text-amber-500' : 'text-slate-400'} size={13}/>
                    <code className="text-xs font-mono text-slate-700 truncate">{h.url}</code>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {h.events.map(e => (
                      <span key={e} className="text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full">{e}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => toggleHook(h.id)}
                  className={`shrink-0 text-xs font-black px-3 py-1.5 rounded-xl transition-all ${h.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700' : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'}`}>
                  {h.status === 'active' ? 'Active' : 'Disabled'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* DELIVERY LOGS */}
      {tab === 'logs' && (
        <div className="space-y-2">
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
