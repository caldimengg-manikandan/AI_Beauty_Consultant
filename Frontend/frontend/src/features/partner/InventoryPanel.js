import { useState, useEffect, useCallback } from 'react';
import { FiBox, FiAlertCircle, FiPlus, FiEdit2, FiTrash2, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { getInventory, addProduct, adjustStock, removeProduct } from '../../services/partnerApi';
import { toast } from 'react-toastify';

export default function InventoryPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ item_name: '', sku: '', category: 'Consumable', quantity_in_stock: 0, min_threshold: 5, unit_price: 0, supplier_info: '' });
  
  const [showAdj, setShowAdj] = useState(false);
  const [adjForm, setAdjForm] = useState({ id: null, adjustment: 0, reason: 'restock' });

  const load = useCallback(async () => {
    try { setLoading(true); setItems(await getInventory()); }
    catch (e) { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.item_name || !form.sku) return toast.warning('Name and SKU required');
    try {
      await addProduct(form);
      toast.success('Item added');
      setShowAdd(false); load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to add item'); }
  };

  const handleAdjust = async () => {
    try {
      await adjustStock({ product_id: adjForm.id, quantity_change: adjForm.adjustment, reason: adjForm.reason });
      toast.success('Stock adjusted');
      setShowAdj(false); load();
    } catch (e) { toast.error('Failed to adjust stock'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item completely?')) return;
    try { await removeProduct(id); toast.success('Deleted'); load(); }
    catch (e) { toast.error('Failed to delete'); }
  };

  const filtered = items.filter(i => 
    i.item_name.toLowerCase().includes(search.toLowerCase()) || 
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = items.filter(i => i.quantity_in_stock <= i.min_threshold).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Inventory Management</h2>
          <p className="text-sm text-slate-500 mt-1">Track salon products, consumables, and retail items</p>
        </div>
        <button onClick={() => { setForm({ item_name: '', sku: '', category: 'Consumable', quantity_in_stock: 0, min_threshold: 5, unit_price: 0, supplier_info: '' }); setShowAdd(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25">
          <FiPlus /> Add Item
        </button>
      </div>

      {lowStock > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <FiAlertCircle className="text-amber-500 text-xl shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800">Low Stock Alert</h4>
            <p className="text-sm text-amber-700 mt-1">{lowStock} item(s) are at or below their minimum threshold. Please restock soon.</p>
          </div>
        </div>
      )}

      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by item name or SKU..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500">
             <FiBox className="mx-auto text-3xl mb-3 text-slate-300" />
             No inventory items found. Add some to get started.
          </div>
        ) : (
          filtered.map(i => {
            const isLow = i.quantity_in_stock <= i.min_threshold;
            return (
              <div key={i.id} className={`bg-white dark:bg-slate-800 rounded-2xl border ${isLow ? 'border-amber-200' : 'border-slate-100 dark:border-slate-700'} p-5 shadow-sm relative group`}>
                {isLow && <div className="absolute top-4 right-4 w-3 h-3 bg-amber-500 rounded-full animate-pulse" title="Low Stock" />}
                
                <div className="text-[10px] font-black tracking-widest uppercase text-indigo-500 mb-1">{i.category}</div>
                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{i.item_name}</h3>
                <div className="text-xs text-slate-400 font-mono mb-4">SKU: {i.sku}</div>
                
                <div className="flex items-end justify-between border-t border-slate-100 dark:border-slate-700 pt-4 mb-4">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">In Stock</div>
                    <div className={`text-3xl font-black ${isLow ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>{i.quantity_in_stock}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Value / Unit</div>
                    <div className="text-lg font-bold text-slate-700 dark:text-slate-300">₹{i.unit_price}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setAdjForm({ id: i.id, adjustment: 0, reason: 'usage' }); setShowAdj(true); }} className="flex-1 flex items-center justify-center gap-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                    <FiRefreshCw /> Adjust
                  </button>
                  <button onClick={() => handleDelete(i.id)} className="px-3 py-2 bg-slate-50 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Add Inventory Item</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">Item Name</label><input type="text" value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase">SKU / Code</label><input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full px-4 py-2 border rounded-xl font-mono uppercase" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase">Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-2 border rounded-xl"><option>Consumable</option><option>Retail</option><option>Equipment</option></select></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase">Initial Stock</label><input type="number" value={form.quantity_in_stock} onChange={e => setForm({...form, quantity_in_stock: +e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase">Min Alert Level</label><input type="number" value={form.min_threshold} onChange={e => setForm({...form, min_threshold: +e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">Unit Price (₹)</label><input type="number" value={form.unit_price} onChange={e => setForm({...form, unit_price: +e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
            </div>
            <div className="flex gap-3 pt-4"><button onClick={() => setShowAdd(false)} className="flex-1 py-2 border rounded-xl font-bold">Cancel</button><button onClick={handleSave} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold">Save Item</button></div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdj && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Adjust Stock</h3>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Amount (+/-)</label><input type="number" value={adjForm.adjustment} onChange={e => setAdjForm({...adjForm, adjustment: +e.target.value})} className="w-full px-4 py-2 border rounded-xl text-center text-xl font-black" placeholder="-5 or +10" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Reason</label><select value={adjForm.reason} onChange={e => setAdjForm({...adjForm, reason: e.target.value})} className="w-full px-4 py-2 border rounded-xl"><option value="usage">Internal Usage</option><option value="restock">Restock / Purchase</option><option value="wastage">Wastage / Expired</option><option value="correction">Count Correction</option></select></div>
            <div className="flex gap-3 pt-4"><button onClick={() => setShowAdj(false)} className="flex-1 py-2 border rounded-xl font-bold">Cancel</button><button onClick={handleAdjust} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold">Update Stock</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
