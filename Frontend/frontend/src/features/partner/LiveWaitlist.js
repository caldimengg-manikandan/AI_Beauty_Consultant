import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiClock, FiCheckCircle, FiUserPlus, FiMonitor, FiUserCheck, FiX } from 'react-icons/fi';
import { getWaitlist, addWalkIn, updateWaitlistStatus } from '../../services/waitlistApi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function LiveWaitlist({ salonId }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customer_name: '', service_name: '', estimated_duration: 30 });

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWaitlist();
      setEntries(data);
    } catch (e) {
      toast.error('Failed to load live waitlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
 
    const activeSalonId = salonId;
    if (!activeSalonId) return; // Don't connect if salon not loaded yet
 
    // Establish WebSocket Connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use Vite env variable (not CRA's process.env.REACT_APP_*)
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsHost = apiBase.replace('https://', '').replace('http://', '');
    
    wsRef.current = new WebSocket(`${wsProtocol}//${wsHost}/api/waitlist/ws/${activeSalonId}`);


    wsRef.current.onopen = () => console.log('WebSocket connected for Live Waitlist');
    
    wsRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'NEW_ENTRY') {
          setEntries(prev => [...prev, msg.data]);
          toast.info(`${msg.data.customer_name} added to waitlist!`);
        } else if (msg.type === 'UPDATE_STATUS') {
          setEntries(prev => prev.map(e => e.id === msg.data.id ? msg.data : e));
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [loadInitialData, user, salonId]);

  const handleAdd = async () => {
    if (!form.customer_name || !form.service_name) return toast.warning("Name and Service required");
    try {
      await addWalkIn(form);
      setShowModal(false);
      setForm({ customer_name: '', service_name: '', estimated_duration: 30 });
      // WS will push the new entry to our list automatically
    } catch (e) { toast.error("Failed to add walk-in"); }
  };

  const updateStatus = async (id, status) => {
    try {
      // Optistic UI update optional, but backend WS will broadcast it instantly anyway.
      await updateWaitlistStatus(id, status);
    } catch (e) { toast.error("Failed to update status"); }
  };

  const waiting = entries.filter(e => e.status === 'waiting');
  const seated = entries.filter(e => e.status === 'seated');
  const completed = entries.filter(e => e.status === 'completed');

  if (loading) return (
    <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center bg-indigo-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <FiMonitor className="animate-pulse" /> Live Waitlist
          </h2>
          <p className="text-indigo-200 text-sm mt-1">Real-time WebSocket Operations</p>
        </div>
        <button onClick={() => setShowModal(true)} className="relative z-10 bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 shadow-md">
          <FiUserPlus /> Add Walk-in
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Waiting Column */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 min-h-[400px]">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex justify-between items-center">
            Waiting <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{waiting.length}</span>
          </h3>
          <div className="space-y-3">
            {waiting.map(e => (
              <div key={e.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group">
                <div>
                  <h4 className="font-bold text-slate-900">{e.customer_name}</h4>
                  <p className="text-xs text-slate-500">{e.service_name} • ~{e.estimated_duration}m</p>
                </div>
                <button onClick={() => updateStatus(e.id, 'seated')} className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center transition-all hover:bg-amber-200" title="Mark as Seated">
                  <FiUserCheck size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Seated Column */}
        <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100 min-h-[400px]">
          <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-4 flex justify-between items-center">
            Seated & In-Progress <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{seated.length}</span>
          </h3>
          <div className="space-y-3">
            {seated.map(e => (
              <div key={e.id} className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 flex justify-between items-center group">
                <div>
                  <h4 className="font-bold text-slate-900">{e.customer_name}</h4>
                  <p className="text-xs text-amber-600 flex items-center gap-1"><FiClock size={10}/> In Progress</p>
                </div>
                <button onClick={() => updateStatus(e.id, 'completed')} className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center transition-all hover:bg-emerald-200" title="Mark as Completed">
                  <FiCheckCircle size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100 min-h-[400px]">
          <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4 flex justify-between items-center">
            Completed <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{completed.length}</span>
          </h3>
          <div className="space-y-3">
            {completed.map(e => (
              <div key={e.id} className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 opacity-60 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-900 line-through">{e.customer_name}</h4>
                  <p className="text-xs text-emerald-600">Done</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Walk-in Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-4">Add Walk-in</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Customer Name</label>
                <input type="text" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" autoFocus />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Service</label>
                <input type="text" value={form.service_name} onChange={e => setForm({...form, service_name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="e.g. Haircut" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 font-bold text-slate-500 bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={handleAdd} className="flex-1 py-2 font-bold text-white bg-indigo-600 rounded-xl">Add to Queue</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
