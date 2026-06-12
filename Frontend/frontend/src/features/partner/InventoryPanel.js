import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
  FiBox, FiAlertTriangle, FiPlus, FiSearch, FiX, FiEdit2,
  FiTrendingDown, FiPackage, FiRefreshCw, FiDownload,
} from 'react-icons/fi';
import { getInventory, addProduct, adjustStock } from '../../services/partnerApi';
import { toast } from 'react-toastify';

/* ── Mock data (swap getInventory() result shape when API ready) ── */
const MOCK_ITEMS = [
  { id: 1, item_name: 'Kerastase Shampoo 500ml', sku: 'KER-SH-500', category: 'Hair Care', quantity_in_stock: 48, min_threshold: 10, unit_price: 1450, supplier_info: 'L\'Oréal Dist.' },
  { id: 2, item_name: 'OPI Nail Lacquer Set', sku: 'OPI-NL-SET12', category: 'Nail', quantity_in_stock: 7, min_threshold: 10, unit_price: 3200, supplier_info: 'BeautyWholesale IN' },
  { id: 3, item_name: 'Dermalogica Moisturiser', sku: 'DRM-MOI-100', category: 'Skin Care', quantity_in_stock: 0, min_threshold: 5, unit_price: 2800, supplier_info: 'Dermalogica India' },
  { id: 4, item_name: 'Wella Koleston Hair Colour', sku: 'WEL-KC-60', category: 'Hair Colour', quantity_in_stock: 22, min_threshold: 15, unit_price: 540, supplier_info: 'Wella Professional' },
  { id: 5, item_name: 'Mamaearth Vitamin C Serum', sku: 'MME-VCS-30', category: 'Skin Care', quantity_in_stock: 3, min_threshold: 8, unit_price: 699, supplier_info: 'Mamaearth Direct' },
  { id: 6, item_name: 'GHD Straightener', sku: 'GHD-STR-GOLD', category: 'Tools', quantity_in_stock: 5, min_threshold: 3, unit_price: 14500, supplier_info: 'GHD Authorised' },
  { id: 7, item_name: 'Biotique Facial Kit', sku: 'BIO-FAC-KIT', category: 'Skin Care', quantity_in_stock: 30, min_threshold: 10, unit_price: 399, supplier_info: 'Biotique Wholesale' },
  { id: 8, item_name: 'Loreal Elvive Conditioner', sku: 'LOR-ELV-400', category: 'Hair Care', quantity_in_stock: 19, min_threshold: 12, unit_price: 380, supplier_info: 'L\'Oréal Dist.' },
];

const BURN_DATA = [
  { day: 'Mon', used: 12 }, { day: 'Tue', used: 18 }, { day: 'Wed', used: 9 },
  { day: 'Thu', used: 22 }, { day: 'Fri', used: 31 }, { day: 'Sat', used: 45 },
  { day: 'Sun', used: 28 },
];

const CATEGORIES = ['All', 'Hair Care', 'Hair Colour', 'Skin Care', 'Nail', 'Tools'];

const STATUS = (qty, min) => {
  if (qty === 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-700 border-red-200' };
  if (qty <= min) return { label: 'Low Stock', cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'In Stock', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
};

const EMPTY_FORM = { item_name: '', sku: '', category: 'Hair Care', quantity_in_stock: '', min_threshold: '', unit_price: '', supplier_info: '' };

export default function InventoryPanel() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [catFilter, setCat]     = useState('All');
  const [sortCol, setSortCol]   = useState('item_name');
  const [sortAsc, setSortAsc]   = useState(true);
  const [showModal, setModal]   = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getInventory();
        setItems(data?.length ? data : MOCK_ITEMS);
      } catch { setItems(MOCK_ITEMS); }
      finally { setLoading(false); }
    })();
  }, []);

  const sort = (col) => { if (sortCol === col) setSortAsc(a => !a); else { setSortCol(col); setSortAsc(true); } };

  const displayed = items
    .filter(i => (catFilter === 'All' || i.category === catFilter) &&
      (i.item_name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'string') av = av.toLowerCase(), bv = bv.toLowerCase();
      return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const stats = {
    total: items.length,
    inStock: items.filter(i => i.quantity_in_stock > i.min_threshold).length,
    low: items.filter(i => i.quantity_in_stock > 0 && i.quantity_in_stock <= i.min_threshold).length,
    out: items.filter(i => i.quantity_in_stock === 0).length,
    value: items.reduce((s, i) => s + i.quantity_in_stock * i.unit_price, 0),
  };

  const handleSave = async () => {
    if (!form.item_name || !form.sku) return toast.error('Name and SKU required');
    setSaving(true);
    try {
      await addProduct(form);
      toast.success('Product added!');
      setItems(prev => [...prev, { ...form, id: Date.now(), quantity_in_stock: +form.quantity_in_stock, min_threshold: +form.min_threshold, unit_price: +form.unit_price }]);
      setModal(false); setForm(EMPTY_FORM);
    } catch { toast.error('Failed to add product'); }
    finally { setSaving(false); }
  };

  const SortArrow = ({ col }) => (
    <span className={`ml-1 text-[10px] ${sortCol === col ? 'text-violet-600' : 'text-slate-300'}`}>
      {sortCol === col ? (sortAsc ? '▲' : '▼') : '⇅'}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total SKUs',  value: stats.total,   icon: <FiBox />,          color: 'from-violet-500 to-purple-600' },
          { label: 'In Stock',    value: stats.inStock,  icon: <FiPackage />,      color: 'from-emerald-400 to-teal-500' },
          { label: 'Low Stock',   value: stats.low,      icon: <FiAlertTriangle />,color: 'from-amber-400 to-orange-500' },
          { label: 'Out of Stock',value: stats.out,      icon: <FiX />,            color: 'from-red-400 to-rose-600' },
          { label: 'Stock Value', value: `₹${(stats.value/1000).toFixed(1)}k`, icon: <FiTrendingDown />, color: 'from-blue-500 to-indigo-600' },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y: -3 }}
            className={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-4 shadow-lg`}>
            <div className="text-xl mb-2 opacity-80">{s.icon}</div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-[11px] font-semibold opacity-75 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Burn-rate chart */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-800">Stock Burn Rate</h3>
            <p className="text-[11px] text-slate-400">Units consumed daily this week</p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-600">This Week</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={BURN_DATA}>
            <defs>
              <linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="used" stroke="#7c3aed" strokeWidth={2.5} fill="url(#burnGrad)" dot={{ r: 4, fill: '#7c3aed' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 w-52" />
          </div>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${catFilter === c ? 'bg-violet-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {c}
            </button>
          ))}
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-teal-500 text-white text-xs font-black rounded-xl shadow-lg">
          <FiPlus /> Add Product
        </motion.button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[['item_name','Product'], ['sku','SKU'], ['category','Category'], ['quantity_in_stock','Stock'], ['min_threshold','Reorder At'], ['unit_price','Unit Price'], ['','Status']].map(([col, label]) => (
                  <th key={label} onClick={() => col && sort(col)}
                    className={`text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 ${col ? 'cursor-pointer hover:text-violet-600' : ''}`}>
                    {label}{col && <SortArrow col={col} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-5 bg-slate-100 rounded animate-pulse" /></td></tr>
              )) : displayed.map((item, idx) => {
                const st = STATUS(item.quantity_in_stock, item.min_threshold);
                return (
                  <motion.tr key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-violet-50/40 transition-colors group">
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.item_name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{item.sku}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{item.category}</td>
                    <td className="px-4 py-3">
                      <span className={`font-black text-sm ${item.quantity_in_stock === 0 ? 'text-red-600' : item.quantity_in_stock <= item.min_threshold ? 'text-amber-600' : 'text-slate-800'}`}>
                        {item.quantity_in_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{item.min_threshold}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">₹{item.unit_price.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {!loading && displayed.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <FiBox size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No products match your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(false)} />
            <motion.div className="relative z-10 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-6"
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-black text-slate-800">Add New Product</h2>
                <button onClick={() => setModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"><FiX /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'item_name', label: 'Product Name', span: 2 },
                  { key: 'sku', label: 'SKU' },
                  { key: 'supplier_info', label: 'Supplier' },
                  { key: 'quantity_in_stock', label: 'Current Stock', type: 'number' },
                  { key: 'min_threshold', label: 'Reorder Level', type: 'number' },
                  { key: 'unit_price', label: 'Unit Price (₹)', type: 'number' },
                ].map(({ key, label, span, type }) => (
                  <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">{label}</label>
                    <input type={type || 'text'} value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                className="mt-5 w-full py-3 bg-gradient-to-r from-violet-600 to-teal-500 text-white font-black rounded-2xl text-sm shadow-lg disabled:opacity-50">
                {saving ? 'Saving…' : 'Add to Inventory'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
