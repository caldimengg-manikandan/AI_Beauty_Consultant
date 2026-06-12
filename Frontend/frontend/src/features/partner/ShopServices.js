import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaConciergeBell, FaPlus, FaEdit, FaTrash, FaTimes, FaCheck,
  FaClock, FaDollarSign, FaTag, FaSearch, FaSpinner, FaSpa,
  FaCut, FaPaintBrush, FaUserCircle, FaStar,
} from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CATEGORIES = ["All", "Hair", "Skin", "Spa", "Makeup", "Nail", "General"];
const CATEGORY_COLORS = {
  Hair:    "bg-amber-100 text-amber-700",
  Skin:    "bg-green-100 text-green-700",
  Spa:     "bg-violet-100 text-violet-700",
  Makeup:  "bg-rose-100 text-rose-700",
  Nail:    "bg-pink-100 text-pink-700",
  General: "bg-slate-100 text-slate-600",
};
const CATEGORY_ICONS = {
  Hair:    <FaCut className="text-amber-500" />,
  Skin:    <FaStar className="text-green-500" />,
  Spa:     <FaSpa className="text-violet-500" />,
  Makeup:  <FaPaintBrush className="text-rose-500" />,
  Nail:    <FaPaintBrush className="text-pink-500" />,
  General: <FaConciergeBell className="text-slate-400" />,
};

const EMPTY_SERVICE = { name: "", price: "", duration_mins: "60", category: "General" };

function ServiceModal({ service, onSave, onClose, saving }) {
  const [form, setForm] = useState(service || EMPTY_SERVICE);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-800">
            {service ? "Edit Service" : "Add New Service"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <FaTimes size={12} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Service Name *</label>
            <input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g. Keratin Hair Treatment"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Price (₹) *</label>
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={e => set("price", e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Duration (mins)</label>
              <div className="relative">
                <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={form.duration_mins}
                  onChange={e => set("duration_mins", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={e => set("category", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
            >
              {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim() || form.price === ""}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />}
            {service ? "Save Changes" : "Add Service"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteConfirm({ name, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
      >
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <FaTrash className="text-rose-500" size={16} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Remove Service?</h3>
        <p className="text-sm text-slate-500 mb-5">
          <span className="font-semibold text-slate-700">{name}</span> will be removed from your salon listing.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600">Remove</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ShopServices() {
  const { token } = useAuth();
  const [services, setServices]   = useState([]);
  const [salon, setSalon]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [filter, setFilter]       = useState("All");
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState(null); // null | { mode: "add" | "edit", index: number|null }
  const [deleteIdx, setDeleteIdx] = useState(null);
  const [toast, setToast]         = useState(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSalon = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/salons/owner/my-salon`, { headers });
      if (!res.ok) throw new Error("Failed to load salon");
      const data = await res.json();
      setSalon(data);
      setServices(data.services_with_pricing || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSalon(); }, [fetchSalon]);

  const saveServices = async (updatedServices) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/salons/owner/update`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ services_with_pricing: updatedServices }),
      });
      if (!res.ok) throw new Error("Save failed");
      setServices(updatedServices);
      showToast("Services updated successfully");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (form) => {
    const svc = {
      name: form.name.trim(),
      price: parseFloat(form.price) || 0,
      duration_mins: parseInt(form.duration_mins) || 60,
      category: form.category,
    };
    let updated;
    if (modal.index !== null) {
      updated = services.map((s, i) => i === modal.index ? svc : s);
    } else {
      updated = [...services, svc];
    }
    await saveServices(updated);
    setModal(null);
  };

  const handleDelete = async () => {
    const updated = services.filter((_, i) => i !== deleteIdx);
    await saveServices(updated);
    setDeleteIdx(null);
  };

  const filtered = services.filter(s => {
    const matchCat = filter === "All" || s.category === filter;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const stats = {
    total: services.length,
    avgPrice: services.length ? Math.round(services.reduce((a, s) => a + (s.price || 0), 0) / services.length) : 0,
    categories: [...new Set(services.map(s => s.category))].length,
    avgDuration: services.length ? Math.round(services.reduce((a, s) => a + (s.duration_mins || 0), 0) / services.length) : 0,
  };

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6 text-center">
      <div className="text-rose-500 text-sm font-semibold">{error}</div>
      <button onClick={fetchSalon} className="mt-3 text-xs text-violet-600 font-semibold underline">Retry</button>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold ${
              toast.type === "error" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <FaConciergeBell className="text-violet-500" />
            Services Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{salon?.name} · Manage your service menu</p>
        </div>
        <button
          onClick={() => setModal({ mode: "add", index: null })}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-teal-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-200"
        >
          <FaPlus size={12} />
          Add Service
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Services", value: stats.total, icon: <FaConciergeBell />, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Avg Price", value: `₹${stats.avgPrice}`, icon: <FaDollarSign />, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Categories", value: stats.categories, icon: <FaTag />, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Avg Duration", value: `${stats.avgDuration}m`, icon: <FaClock />, color: "text-blue-600", bg: "bg-blue-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} text-sm`}>
              {s.icon}
            </div>
            <div>
              <div className="text-lg font-black text-slate-800">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === cat
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-violet-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-64">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
      </div>

      {/* Services Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <FaConciergeBell className="text-slate-300 text-4xl mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">
            {services.length === 0 ? "No services yet" : "No services match this filter"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {services.length === 0 ? "Add your first service to start attracting clients" : "Try a different category or search term"}
          </p>
          {services.length === 0 && (
            <button
              onClick={() => setModal({ mode: "add", index: null })}
              className="mt-4 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors"
            >
              Add First Service
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((svc, i) => {
              const realIdx = services.indexOf(svc);
              return (
                <motion.div
                  key={`${svc.name}-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-sm">
                        {CATEGORY_ICONS[svc.category] || CATEGORY_ICONS.General}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[svc.category] || CATEGORY_COLORS.General}`}>
                        {svc.category}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setModal({ mode: "edit", index: realIdx })}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors"
                      >
                        <FaEdit size={11} />
                      </button>
                      <button
                        onClick={() => setDeleteIdx(realIdx)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                      >
                        <FaTrash size={11} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug mb-3">{svc.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-emerald-600">
                      <FaDollarSign size={11} />
                      <span className="text-base font-black">₹{svc.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <FaClock size={10} />
                      <span>{svc.duration_mins} min</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <ServiceModal
            service={modal.index !== null ? services[modal.index] : null}
            onSave={handleSave}
            onClose={() => setModal(null)}
            saving={saving}
          />
        )}
        {deleteIdx !== null && (
          <DeleteConfirm
            name={services[deleteIdx]?.name}
            onConfirm={handleDelete}
            onClose={() => setDeleteIdx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
