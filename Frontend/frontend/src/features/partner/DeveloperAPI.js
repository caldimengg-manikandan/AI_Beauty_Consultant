import React, { useState, useEffect, useCallback } from 'react';
import { FiCode, FiKey, FiLink, FiPlus, FiTrash2, FiPlay, FiCopy, FiCheck } from 'react-icons/fi';
import { getApiKeys, generateApiKey, deleteApiKey, getWebhooks, registerWebhook, deleteWebhook, testWebhook } from '../../services/developerApi';
import { toast } from 'react-toastify';

export default function DeveloperAPI() {
  const [keys, setKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Webhook Form
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ url: '', events: ['booking.created'] });
  const availableEvents = ['booking.created', 'booking.cancelled', 'payment.success', 'customer.registered'];

  const [copiedKey, setCopiedKey] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [keysRes, hooksRes] = await Promise.all([getApiKeys(), getWebhooks()]);
      setKeys(keysRes);
      setWebhooks(hooksRes);
    } catch (e) {
      toast.error('Failed to load Developer settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGenerateKey = async () => {
    if (!window.confirm("Generate a new Production API Key?")) return;
    try {
      const res = await generateApiKey();
      toast.success(res.message, { autoClose: 10000 }); // Show longer so they can copy
      // Replace the obfuscated key in the list with the full one temporarily so they can copy it
      setKeys([res.data, ...keys]);
    } catch (e) { toast.error("Failed to generate key"); }
  };

  const handleRevokeKey = async (id) => {
    if (!window.confirm("Revoke this API Key? Any integrations using it will immediately fail.")) return;
    try {
      await deleteApiKey(id);
      toast.success("API Key revoked");
      loadData();
    } catch (e) { toast.error("Failed to revoke key"); }
  };

  const handleRegisterWebhook = async () => {
    if (!webhookForm.url.startsWith('http')) return toast.warning("URL must start with http/https");
    try {
      await registerWebhook(webhookForm);
      toast.success("Webhook registered");
      setShowWebhookModal(false);
      setWebhookForm({ url: '', events: ['booking.created'] });
      loadData();
    } catch (e) { toast.error("Failed to register webhook"); }
  };

  const handleTestWebhook = async (id) => {
    try {
      await testWebhook(id);
      toast.success("Test payload dispatched! Check your server.");
      loadData();
    } catch (e) { toast.error("Failed to trigger webhook"); }
  };

  const handleDeleteWebhook = async (id) => {
    if (!window.confirm("Remove this webhook?")) return;
    try {
      await deleteWebhook(id);
      toast.success("Webhook removed");
      loadData();
    } catch (e) { toast.error("Failed to delete webhook"); }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) return (
    <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up p-2">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <FiCode className="text-indigo-500" /> Developer API & Webhooks
        </h2>
        <p className="text-slate-500 text-sm mt-1">Integrate your salon with external CRMs, POS systems, and custom apps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* API Keys */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FiKey className="text-slate-400" /> API Keys</h3>
            <button onClick={handleGenerateKey} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-800 transition-colors">
              + Generate Key
            </button>
          </div>
          
          <div className="space-y-4">
            {keys.map(key => (
              <div key={key.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">{key.name}</div>
                  <div className="font-mono text-sm text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 flex items-center gap-2">
                    {key.secret_key}
                    <button onClick={() => copyToClipboard(key.secret_key, key.id)} className="text-slate-400 hover:text-indigo-500 transition-colors">
                      {copiedKey === key.id ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2">Created: {new Date(key.created_at).toLocaleDateString()}</div>
                </div>
                <button onClick={() => handleRevokeKey(key.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Revoke Key">
                  <FiTrash2 />
                </button>
              </div>
            ))}
            {keys.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                No API keys generated.
              </div>
            )}
          </div>
        </div>

        {/* Webhooks */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FiLink className="text-slate-400" /> Webhooks</h3>
            <button onClick={() => setShowWebhookModal(true)} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-indigo-100 transition-colors">
              + Add Endpoint
            </button>
          </div>

          <div className="space-y-4">
            {webhooks.map(hook => (
              <div key={hook.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-sm font-bold text-slate-700 truncate max-w-[250px]">{hook.url}</div>
                  <div className="flex gap-2">
                    <button onClick={() => handleTestWebhook(hook.id)} className="p-1.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition-colors" title="Send Test Payload">
                      <FiPlay size={14} />
                    </button>
                    <button onClick={() => handleDeleteWebhook(hook.id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors" title="Delete Webhook">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {hook.events.map(evt => (
                    <span key={evt} className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{evt}</span>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Secret: {hook.secret}</span>
                  <span>Last Triggered: {hook.last_triggered ? new Date(hook.last_triggered).toLocaleString() : 'Never'}</span>
                </div>
              </div>
            ))}
            {webhooks.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                No webhooks configured.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Register Webhook</h3>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Endpoint URL</label>
              <input type="text" value={webhookForm.url} onChange={e => setWebhookForm({...webhookForm, url: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-mono text-sm" placeholder="https://your-server.com/webhook" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Events to Listen For</label>
              <div className="space-y-2">
                {availableEvents.map(evt => (
                  <label key={evt} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={webhookForm.events.includes(evt)}
                      onChange={(e) => {
                        if (e.target.checked) setWebhookForm({...webhookForm, events: [...webhookForm.events, evt]});
                        else setWebhookForm({...webhookForm, events: webhookForm.events.filter(x => x !== evt)});
                      }}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700 font-mono">{evt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowWebhookModal(false)} className="flex-1 py-2 font-bold text-slate-500 bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleRegisterWebhook} disabled={webhookForm.events.length === 0} className="flex-1 py-2 font-bold text-white bg-indigo-600 rounded-xl disabled:opacity-50">Register endpoint</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
