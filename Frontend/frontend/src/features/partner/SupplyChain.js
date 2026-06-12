import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiTruck, FiShoppingCart, FiPackage, FiCheckCircle, FiClock, FiX, FiPlus, FiMinus } from 'react-icons/fi';
import { toast } from 'react-toastify';

const CATALOG = [
  { id: 1, name: 'Kerastase Shampoo 1L',        sku: 'KER-SH-1L',   price: 2400, unit: 'bottle', category: 'Hair Care',  img_color: 'from-violet-500 to-purple-600', moq: 6 },
  { id: 2, name: 'Wella Colour Developer',        sku: 'WEL-DEV-1L',  price: 680,  unit: 'bottle', category: 'Hair Colour',img_color: 'from-amber-500 to-orange-600',  moq: 12 },
  { id: 3, name: 'Dermalogica Cleanser',          sku: 'DRM-CL-250',  price: 1800, unit: 'tube',   category: 'Skin Care',  img_color: 'from-teal-500 to-emerald-600',  moq: 6 },
  { id: 4, name: 'OPI Base Coat',                 sku: 'OPI-BC-15',   price: 420,  unit: 'bottle', category: 'Nail',       img_color: 'from-rose-500 to-pink-600',     moq: 12 },
  { id: 5, name: 'GHD Heat Protect Spray',        sku: 'GHD-HP-120',  price: 1650, unit: 'spray',  category: 'Tools',      img_color: 'from-blue-500 to-indigo-600',   moq: 6 },
  { id: 6, name: 'L\'Oréal Pro-Keratin',          sku: 'LOR-PK-500',  price: 3200, unit: 'pack',   category: 'Hair Care',  img_color: 'from-fuchsia-500 to-violet-600',moq: 3 },
];

const MOCK_ORDERS = [
  { id: 'PO-2041', date: '2026-06-07', items: 'Kerastase Shampoo × 12, Wella Developer × 24', total: 44520, status: 'delivered' },
  { id: 'PO-2040', date: '2026-06-02', items: 'OPI Base Coat × 24', total: 10080, status: 'in_transit' },
  { id: 'PO-2039', date: '2026-05-25', items: 'Dermalogica Cleanser × 6, GHD Spray × 6', total: 20700, status: 'delivered' },
  { id: 'PO-2038', date: '2026-05-18', items: 'L\'Oréal Keratin × 3', total: 9600, status: 'delivered' },
];

const SPEND_TREND = [
  { month: 'Jan', spend: 28000 }, { month: 'Feb', spend: 32000 }, { month: 'Mar', spend: 41000 },
  { month: 'Apr', spend: 38000 }, { month: 'May', spend: 45000 }, { month: 'Jun', spend: 52000 },
];

const STATUS_CFG = {
  delivered:  { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <FiCheckCircle size={11}/>, label: 'Delivered' },
  in_transit: { cls: 'bg-blue-100 text-blue-700 border-blue-200',         icon: <FiTruck size={11}/>,       label: 'In Transit' },
  pending:    { cls: 'bg-amber-100 text-amber-700 border-amber-200',       icon: <FiClock size={11}/>,       label: 'Pending' },
};

export default function SupplyChain() {
  const [tab, setTab]       = useState('catalog');
  const [cart, setCart]     = useState({});
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [placing, setPlacing] = useState(false);

  const cartTotal = Object.entries(cart).reduce((s, [id, qty]) => {
    const item = CATALOG.find(c => c.id === +id);
    return s + (item ? item.price * qty : 0);
  }, 0);
  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const add = (id) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const sub = (id) => setCart(prev => { const q = (prev[id] || 1) - 1; if (q <= 0) { const n = {...prev}; delete n[id]; return n; } return { ...prev, [id]: q }; });

  const placeOrder = () => {
    if (cartCount === 0) return toast.error('Add items to your order');
    setPlacing(true);
    setTimeout(() => {
      const items = Object.entries(cart).map(([id, qty]) => {
        const it = CATALOG.find(c => c.id === +id);
        return `${it?.name} × ${qty}`;
      }).join(', ');
      const newOrder = { id: `PO-${2042 + orders.length}`, date: new Date().toISOString().slice(0,10), items, total: cartTotal, status: 'pending' };
      setOrders(prev => [newOrder, ...prev]);
      setCart({});
      setPlacing(false);
      setTab('orders');
      toast.success(`Order ${newOrder.id} placed!`);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders', value: orders.length, color: 'from-violet-500 to-purple-600', icon: <FiPackage /> },
          { label: 'In Transit',   value: orders.filter(o=>o.status==='in_transit').length, color: 'from-blue-500 to-indigo-600', icon: <FiTruck /> },
          { label: 'Spend (Jun)',  value: '₹52k', color: 'from-teal-500 to-emerald-600', icon: <FiShoppingCart /> },
          { label: 'Cart Items',   value: cartCount, color: 'from-amber-500 to-orange-600', icon: <FiShoppingCart /> },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y: -3 }}
            className={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-4 shadow-lg`}>
            <div className="text-xl mb-2 opacity-80">{s.icon}</div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-[11px] font-semibold opacity-75 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Spend Trend */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-black text-slate-800 mb-1">Supply Spend Trend</h3>
        <p className="text-[11px] text-slate-400 mb-4">Monthly procurement cost</p>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={SPEND_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
            <Tooltip formatter={v=>[`₹${v.toLocaleString()}`, 'Spend']} contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}/>
            <Line type="monotone" dataKey="spend" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[['catalog','🛒 B2B Catalog'], ['orders','📦 My Orders']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2 rounded-lg text-xs font-black transition-all ${tab===k ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* CATALOG */}
      {tab === 'catalog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATALOG.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                whileHover={{ y: -3 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className={`h-20 bg-gradient-to-br ${item.img_color} flex items-center justify-center`}>
                  <FiPackage className="text-white text-3xl opacity-60"/>
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                  <h4 className="text-sm font-bold text-slate-800 mt-0.5 leading-tight">{item.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{item.sku}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-base font-black text-slate-800">₹{item.price.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">MOQ: {item.moq} {item.unit}s</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {cart[item.id] ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => sub(item.id)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-700"><FiMinus size={12}/></button>
                          <span className="text-sm font-black text-violet-600 w-5 text-center">{cart[item.id]}</span>
                          <button onClick={() => add(item.id)} className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center hover:bg-violet-700 text-white"><FiPlus size={12}/></button>
                        </div>
                      ) : (
                        <button onClick={() => add(item.id)} className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700">
                          <FiPlus size={11}/> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {cartCount > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="sticky bottom-4 bg-gradient-to-r from-violet-600 to-teal-500 rounded-2xl p-4 shadow-xl flex items-center justify-between">
              <div className="text-white">
                <p className="text-xs opacity-75">{cartCount} item{cartCount > 1 ? 's' : ''} in cart</p>
                <p className="text-lg font-black">₹{cartTotal.toLocaleString()}</p>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={placeOrder} disabled={placing}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-violet-700 font-black rounded-xl text-sm shadow-md disabled:opacity-60">
                {placing ? <><div className="w-4 h-4 border-2 border-violet-300 border-t-violet-700 rounded-full animate-spin"/> Placing…</> : <><FiShoppingCart/> Place Order</>}
              </motion.button>
            </motion.div>
          )}
        </div>
      )}

      {/* ORDERS */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.map((order, idx) => {
            const st = STATUS_CFG[order.status] || STATUS_CFG.pending;
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-black text-violet-600">{order.id}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${st.cls}`}>{st.icon}{st.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs truncate">{order.items}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{order.date}</p>
                </div>
                <p className="text-lg font-black text-slate-800">₹{order.total.toLocaleString()}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
