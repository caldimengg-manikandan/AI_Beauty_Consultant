import { useState, useEffect, useCallback } from 'react';
import { FiFileText, FiPlus, FiDollarSign, FiSearch, FiCheck, FiClock, FiX, FiPrinter } from 'react-icons/fi';
import { getInvoices, createInvoice, updatePaymentStatus, getRevenueAnalytics } from '../../services/partnerApi';
import { toast } from 'react-toastify';

const initialForm = {
  customer_name: '',
  customer_phone: '',
  items: [{ description: '', quantity: 1, unit_price: 0, discount_pct: 0 }],
  apply_gst: true,
  gst_rate: 0.18,
  payment_method: 'cash',
  notes: ''
};

export default function BillingPOS() {
  const [invoices, setInvoices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [invRes, statRes] = await Promise.all([getInvoices(), getRevenueAnalytics('month')]);
      setInvoices(invRes.invoices);
      setAnalytics(statRes);
    } catch (e) { toast.error('Failed to load billing data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(initialForm); setShowModal(true); };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unit_price: 0, discount_pct: 0 }] }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    setForm({ ...form, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  const handleSave = async () => {
    if (!form.customer_name) return toast.warning('Customer name is required');
    if (form.items.some(i => !i.description || i.unit_price <= 0)) return toast.warning('All items must have description and price');
    
    setSaving(true);
    try {
      await createInvoice(form);
      toast.success('Invoice generated');
      setShowModal(false);
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to create invoice'); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updatePaymentStatus(id, status);
      toast.success('Status updated');
      load();
    } catch (e) { toast.error('Failed to update status'); }
  };

  const filtered = invoices.filter(i =>
    i.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.invoice_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Billing & POS</h2>
          <p className="text-sm text-slate-500 mt-1">Generate invoices and track revenue</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25">
          <FiPlus /> New Invoice
        </button>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="text-emerald-600 mb-2"><FiDollarSign size={24}/></div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">₹{analytics.total_revenue.toLocaleString()}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Total Revenue (Month)</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="text-indigo-600 mb-2"><FiFileText size={24}/></div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{analytics.total_invoices}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Invoices Generated</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="text-purple-600 mb-2"><FiDollarSign size={24}/></div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">₹{analytics.total_gst_collected.toLocaleString()}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">GST Collected</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="text-amber-500 mb-2"><FiClock size={24}/></div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">₹{analytics.pending_amount.toLocaleString()}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Pending Payments</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by customer name or invoice number..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Invoices List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading invoices...</td></tr>
              ) : filtered.length === 0 ? (
                 <tr><td colSpan="6" className="p-8 text-center text-slate-400">No invoices found.</td></tr>
              ) : (
                filtered.map(inv => (
                  <tr key={inv.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="p-4 font-mono text-sm text-indigo-600 dark:text-indigo-400">{inv.invoice_number}</td>
                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">
                      {inv.customer_name}
                      <div className="text-xs text-slate-400 font-normal">{inv.customer_phone || 'N/A'}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">₹{inv.grand_total}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inv.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                        inv.payment_status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                        'bg-red-50 text-red-600 dark:bg-red-900/20'
                      }`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {inv.payment_status === 'pending' && (
                         <button onClick={() => handleStatusUpdate(inv.id, 'paid')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Mark Paid"><FiCheck size={14}/></button>
                      )}
                      <button className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100" title="Print/View"><FiPrinter size={14}/></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Generate Invoice</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><FiX /></button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Customer Name *</label>
                  <input type="text" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Phone</label>
                  <input type="text" value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700" />
                </div>
              </div>

              {/* Items */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Line Items</label>
                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                      <input type="text" placeholder="Service/Product" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600" />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', +e.target.value)} className="w-16 px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600" min="1" />
                      <input type="number" placeholder="Price" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', +e.target.value)} className="w-24 px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600" min="0" />
                      <input type="number" placeholder="Disc %" value={item.discount_pct} onChange={e => updateItem(idx, 'discount_pct', +e.target.value)} className="w-20 px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600" min="0" max="100" />
                      <button onClick={() => removeItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiX /></button>
                    </div>
                  ))}
                </div>
                <button onClick={addItem} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><FiPlus /> Add Item</button>
              </div>

              {/* Totals & Settings */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                     <input type="checkbox" checked={form.apply_gst} onChange={e => setForm({...form, apply_gst: e.target.checked})} id="gst" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                     <label htmlFor="gst" className="text-sm font-bold text-slate-700 dark:text-slate-300">Apply GST (18%)</label>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Payment Method</label>
                     <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600">
                       <option value="cash">Cash</option>
                       <option value="card">Card</option>
                       <option value="upi">UPI</option>
                       <option value="pending">Pending (Unpaid)</option>
                     </select>
                   </div>
                </div>
                
                <div className="text-right space-y-2">
                  <div className="text-sm text-slate-500">Subtotal: <span className="font-bold text-slate-900 dark:text-white">₹{form.items.reduce((acc, it) => acc + (it.unit_price * it.quantity * (1 - it.discount_pct/100)), 0).toFixed(2)}</span></div>
                  {form.apply_gst && <div className="text-sm text-slate-500">GST (18%): <span className="font-bold text-slate-900 dark:text-white">₹{(form.items.reduce((acc, it) => acc + (it.unit_price * it.quantity * (1 - it.discount_pct/100)), 0) * 0.18).toFixed(2)}</span></div>}
                  <div className="text-lg font-black text-indigo-600 pt-2 border-t border-slate-200 dark:border-slate-600">
                    Total: ₹{(form.items.reduce((acc, it) => acc + (it.unit_price * it.quantity * (1 - it.discount_pct/100)), 0) * (form.apply_gst ? 1.18 : 1)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-60">
                {saving ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
