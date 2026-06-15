import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBoxOpen, FaPlus, FaEdit, FaTrash, FaTimes, FaCheck,
  FaSearch, FaSpinner, FaExclamationTriangle, FaFilter,
  FaBoxes, FaDollarSign, FaTag, FaBarcode,
} from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CATEGORIES = ["All", "Hair Care", "Skin Care", "Makeup", "Nail Care", "Fragrance", "Tools", "Supplements", "Other"];
const STATUS_CONFIG = {
  ok:          { label: "In Stock",    bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  low:         { label: "Low Stock",   bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  out_of_stock:{ label: "Out of Stock",bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500" },
};

const EMPTY_PRODUCT = {
  name: "", brand: "", category: "Hair Care", sku: "", price: "", cost_price: "",
  quantity: "0", low_stock_threshold: "10", unit: "pcs", description: "",
};

function ProductModal({ product, onSave, onClose, saving }) {
  const [form, setForm] = useState(product
    ? { ...product, price: String(product.price || ""), cost_price: String(product.cost_price || ""), quantity: String(product.quantity || "0"), low_stock_threshold: String(product.low_stock_threshold || "10") }
    : EMPTY_PRODUCT
  );
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!product;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 overflow-y-auto py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-800">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
            <FaTimes size={12} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Product Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Argan Oil Serum 100ml"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Brand</label>
              <input value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="e.g. L'Oreal"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Category</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
                {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Sale Price (₹) *</label>
              <input type="number" min="0" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Cost Price (₹)</label>
              <input type="number" min="0" value={form.cost_price} onChange={e => set("cost_price", e.target.value)} placeholder="0"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            {!isEdit && (
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Initial Stock Qty</label>
                <input type="number" min="0" value={form.quantity} onChange={e => set("quantity", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Low Stock Alert at</label>
              <input type="number" min="1" value={form.low_stock_threshold} onChange={e => set("low_stock_threshold", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Unit</label>
              <select value={form.unit} onChange={e => set("unit", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
                {["pcs", "ml", "g", "L", "kg", "bottle", "box"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">SKU</label>
              <input value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="Auto-generated if blank"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim() || form.price === ""}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />}
            {isEdit ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AdjustStockModal({ product, onClose, onAdjusted, token }) {
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("restock");
  const [saving, setSaving] = useState(false);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/inventory/adjust`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          product_id: product.id,
          quantity: parseFloat(qty),
          reason,
          notes: `Manual ${reason}`,
        }),
      });
      if (!res.ok) throw new Error("Adjustment failed");
      onAdjusted();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800">Adjust Stock</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><FaTimes size={12} /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Current stock: <span className="font-bold text-slate-800">{product.quantity} {product.unit}</span></p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Adjustment Quantity</label>
            <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="Enter amount"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Reason</label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
              <option value="restock">Restock / Purchase</option>
              <option value="used">Used in Service</option>
              <option value="sold">Sold to Client</option>
              <option value="damaged">Damaged / Expired</option>
              <option value="correction">Manual Correction</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={saving || !qty}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <FaSpinner className="animate-spin" size={12} /> : null}
            Apply
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ShopProducts() {
  const { token } = useAuth();
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [filter, setFilter]       = useState("All");
  const [search, setSearch]       = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [modal, setModal]         = useState(null); // null | { mode: "add" | "edit", product: null | obj }
  const [adjustModal, setAdjustModal] = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [toast, setToast]         = useState(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== "All") params.set("category", filter);
      if (search) params.set("search", search);
      const res = await fetch(`${API}/api/inventory/?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, filter, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSave = async (form) => {
    setSaving(true);
    const isEdit = !!modal.product;
    try {
      const body = {
        name: form.name.trim(),
        brand: form.brand?.trim() || "",
        category: form.category,
        price: parseFloat(form.price) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
        quantity: isEdit ? parseInt(form.quantity) : parseInt(form.quantity) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 10,
        unit: form.unit || "pcs",
        sku: form.sku?.trim() || "",
        description: form.description?.trim() || "",
      };
      const url = isEdit ? `${API}/api/inventory/${modal.product.id}` : `${API}/api/inventory/`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Save failed");
      showToast(isEdit ? "Product updated" : "Product added");
      setModal(null);
      fetchProducts();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/api/inventory/${deleteId}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Product removed");
      setDeleteId(null);
      fetchProducts();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const displayed = products.filter(p => {
    if (stockFilter === "low")      return p.stock_status === "low";
    if (stockFilter === "out")      return p.stock_status === "out_of_stock";
    if (stockFilter === "ok")       return p.stock_status === "ok";
    return true;
  });

  const stats = {
    total:    products.length,
    inStock:  products.filter(p => p.stock_status === "ok").length,
    low:      products.filter(p => p.stock_status === "low").length,
    out:      products.filter(p => p.stock_status === "out_of_stock").length,
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold ${toast.type === "error" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <FaBoxOpen className="text-violet-500" />
            Products & Retail
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your retail products and stock levels</p>
        </div>
        <button
          onClick={() => setModal({ mode: "add", product: null })}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-teal-500 text-white text-sm font-bold rounded-xl hover:opacity-90 shadow-lg shadow-violet-200"
        >
          <FaPlus size={12} />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: stats.total,   icon: <FaBoxes />, color: "text-violet-600", bg: "bg-violet-50", filter: "all" },
          { label: "In Stock",       value: stats.inStock, icon: <FaCheck />, color: "text-emerald-600", bg: "bg-emerald-50", filter: "ok" },
          { label: "Low Stock",      value: stats.low,     icon: <FaExclamationTriangle />, color: "text-amber-600", bg: "bg-amber-50", filter: "low" },
          { label: "Out of Stock",   value: stats.out,     icon: <FaTimes />, color: "text-rose-600", bg: "bg-rose-50", filter: "out" },
        ].map(s => (
          <button key={s.label} onClick={() => setStockFilter(s.filter)}
            className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 text-left transition-all hover:shadow-md ${stockFilter === s.filter ? "border-violet-300 ring-2 ring-violet-100" : "border-slate-100"}`}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} text-sm`}>{s.icon}</div>
            <div>
              <div className="text-lg font-black text-slate-800">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", "Hair Care", "Skin Care", "Makeup", "Nail Care", "Tools"].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filter === cat ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "bg-white text-slate-500 border border-slate-200 hover:border-violet-300"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-rose-500 text-sm font-semibold">{error}</p>
          <button onClick={fetchProducts} className="mt-2 text-xs text-violet-600 underline font-semibold">Retry</button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <FaBoxOpen className="text-slate-300 text-4xl mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">{products.length === 0 ? "No products yet" : "No products match your filter"}</p>
          {products.length === 0 && (
            <button onClick={() => setModal({ mode: "add", product: null })}
              className="mt-4 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700">
              Add First Product
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Product", "Brand", "Category", "Price", "Stock", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {displayed.map((p, i) => {
                    const sc = STATUS_CONFIG[p.stock_status] || STATUS_CONFIG.ok;
                    return (
                      <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800 leading-snug">{p.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <FaBarcode size={8} /> {p.sku || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{p.brand || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-full">{p.category}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">₹{(p.price || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setAdjustModal(p)} className="font-semibold text-slate-700 hover:text-violet-600 transition-colors underline decoration-dotted">
                            {p.quantity} {p.unit}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setModal({ mode: "edit", product: p })}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100">
                              <FaEdit size={11} />
                            </button>
                            <button onClick={() => setDeleteId(p.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100">
                              <FaTrash size={11} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modal && <ProductModal product={modal.product} onSave={handleSave} onClose={() => setModal(null)} saving={saving} />}
        {adjustModal && <AdjustStockModal product={adjustModal} token={token} onClose={() => setAdjustModal(null)} onAdjusted={fetchProducts} />}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaTrash className="text-rose-500" size={16} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Remove Product?</h3>
              <p className="text-sm text-slate-500 mb-5">This product will be removed from your inventory.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600">Remove</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
