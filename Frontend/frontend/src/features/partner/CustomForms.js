import React, { useState, useEffect } from 'react';
import { 
  FiFileText, FiPlus, FiTrash, FiSave, FiEye, FiCheckSquare, 
  FiList, FiHash, FiClock, FiUser, FiMail, FiTrash2 
} from 'react-icons/fi';
import { getMyTemplates, createTemplate, deleteTemplate, getMySubmissions } from '../../services/formApi';
import { toast } from 'react-toastify';

export default function CustomForms() {
  const [templates, setTemplates] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('templates'); // templates | submissions | create

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([
    { id: 'field_name', label: 'Customer Full Name', type: 'text', required: true, options: [] }
  ]);

  // Modal State for viewing submission
  const [activeSubmission, setActiveSubmission] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const tData = await getMyTemplates();
      setTemplates(tData);
      const sData = await getMySubmissions();
      setSubmissions(sData);
    } catch (e) {
      toast.error('Failed to load forms data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      label: type === 'text' ? 'New Text Field' : type === 'number' ? 'New Number Field' : type === 'select' ? 'New Dropdown Field' : 'New Checkbox Field',
      type: type,
      required: false,
      options: type === 'select' ? ['Option 1', 'Option 2'] : []
    };
    setFields([...fields, newField]);
  };

  const removeField = (index) => {
    if (fields.length <= 1) {
      return toast.warning("Waivers require at least one field!");
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    if (key === 'options') {
      updated[index][key] = value.split(',').map(s => s.trim());
    } else {
      updated[index][key] = value;
    }
    setFields(updated);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!title) return toast.warning("Please specify a form title");

    try {
      await createTemplate({ title, description, fields });
      toast.success("Custom Form Builder Template Created!");
      setTitle('');
      setDescription('');
      setFields([{ id: 'field_name', label: 'Customer Full Name', type: 'text', required: true, options: [] }]);
      setSubTab('templates');
      loadData();
    } catch (e) {
      toast.error("Failed to save template");
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteTemplate(id);
      toast.success("Template deleted");
      loadData();
    } catch (e) {
      toast.error("Failed to delete template");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mini Tabs */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-wrap gap-3">
        <div className="flex gap-2">
          <button 
            onClick={() => setSubTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${subTab === 'templates' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
          >
            Form Templates
          </button>
          <button 
            onClick={() => setSubTab('submissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${subTab === 'submissions' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
          >
            Intake Submissions
          </button>
        </div>
        
        {subTab !== 'create' && (
          <button 
            onClick={() => setSubTab('create')}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-purple-700 shadow-md transition-colors"
          >
            <FiPlus /> Build Custom Form
          </button>
        )}
      </div>

      {/* Templates List */}
      {subTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.length === 0 ? (
            <div className="md:col-span-2 text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
              <FiFileText size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-lg">No Custom Forms Built</h3>
              <p className="text-slate-400 text-xs mt-1">Create digital waivers, consult sheets, or intake questionnaires.</p>
              <button 
                onClick={() => setSubTab('create')}
                className="mt-4 bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-200 transition-colors"
              >
                Build Your First Form
              </button>
            </div>
          ) : (
            templates.map(t => (
              <div key={t.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <h3 className="font-black text-slate-800 text-lg">{t.title}</h3>
                  <p className="text-slate-500 text-xs mt-1">{t.description || "No description provided."}</p>
                  
                  <div className="mt-4 bg-slate-50 p-4 rounded-2xl space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Form Structure ({t.fields.length} Fields)</p>
                    {t.fields.map(f => (
                      <div key={f.id} className="flex justify-between items-center text-xs text-slate-600">
                        <span className="font-bold">{f.label} {f.required && <span className="text-red-500">*</span>}</span>
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold">{f.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono">ID: {t.id.slice(0, 8)}...</span>
                  <button 
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete Form Template"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Submissions List */}
      {subTab === 'submissions' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-black text-slate-800 text-lg">Waivers & Intakes Recieved</h3>
            <p className="text-slate-500 text-xs mt-1">Review filled documents from customers</p>
          </div>
          
          {submissions.length === 0 ? (
            <div className="text-center py-16">
              <FiCheckSquare size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-lg">No Submissions Yet</h3>
              <p className="text-slate-400 text-xs mt-1">Once a customer submits a waiver or intake sheet, it will show up here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6">Form Title</th>
                    <th className="py-3 px-6">Submitted At</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {submissions.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs"><FiUser /></div>
                          <div>
                            <p className="font-bold text-slate-900">{s.customer_name}</p>
                            <p className="text-xs text-slate-500">{s.customer_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-700">{s.form_title}</td>
                      <td className="py-4 px-6 text-xs text-slate-500">{new Date(s.submitted_at).toLocaleString()}</td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => setActiveSubmission(s)}
                          className="bg-purple-50 text-purple-700 font-bold px-3 py-1.5 rounded-xl hover:bg-purple-100 transition-colors inline-flex items-center gap-1 text-xs"
                        >
                          <FiEye /> View Responses
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Form Builder */}
      {subTab === 'create' && (
        <form onSubmit={handleSaveForm} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg">Build Custom Intake Form</h3>
              <p className="text-slate-500 text-xs mt-1">Design a waiver, allergy tracker, or routine questionnaire</p>
            </div>
            <button 
              type="button" 
              onClick={() => setSubTab('templates')}
              className="text-slate-500 font-bold hover:bg-slate-50 border px-3.5 py-1.5 rounded-xl text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Form Title *</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Skin Sensitivity Waiver"
                className="w-full mt-1 px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Description / Instruction</label>
              <input 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="e.g. Please fill this form honestly before your chemical peeling session"
                className="w-full mt-1 px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
              />
            </div>
          </div>

          {/* Fields Builder */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-700">Form Fields ({fields.length})</h4>
              
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={() => addField('text')} className="bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[10px] hover:bg-slate-200 transition-colors inline-flex items-center gap-1">
                  <FiFileText /> + Text Box
                </button>
                <button type="button" onClick={() => addField('number')} className="bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[10px] hover:bg-slate-200 transition-colors inline-flex items-center gap-1">
                  <FiHash /> + Number
                </button>
                <button type="button" onClick={() => addField('select')} className="bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[10px] hover:bg-slate-200 transition-colors inline-flex items-center gap-1">
                  <FiList /> + Dropdown
                </button>
                <button type="button" onClick={() => addField('checkbox')} className="bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[10px] hover:bg-slate-200 transition-colors inline-flex items-center gap-1">
                  <FiCheckSquare /> + Checkbox
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-4 items-start flex-wrap md:flex-nowrap">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Field Label</label>
                        <input 
                          type="text" 
                          value={field.label} 
                          onChange={e => updateField(index, 'label', e.target.value)} 
                          className="w-full mt-0.5 px-3 py-2 bg-white border rounded-lg text-xs focus:ring-1 focus:ring-purple-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Type</label>
                        <div className="w-full mt-0.5 px-3 py-2 bg-slate-200 border rounded-lg text-xs font-bold text-slate-600 capitalize">
                          {field.type}
                        </div>
                      </div>
                    </div>

                    {field.type === 'select' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Options (Comma separated)</label>
                        <input 
                          type="text" 
                          defaultValue={field.options.join(', ')} 
                          onBlur={e => updateField(index, 'options', e.target.value)} 
                          placeholder="e.g. Yes, No, Maybe"
                          className="w-full mt-0.5 px-3 py-2 bg-white border rounded-lg text-xs focus:ring-1 focus:ring-purple-400 outline-none"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id={`req_${field.id}`}
                        checked={field.required} 
                        onChange={e => updateField(index, 'required', e.target.checked)} 
                        className="rounded text-purple-600 focus:ring-purple-400"
                      />
                      <label htmlFor={`req_${field.id}`} className="text-xs font-bold text-slate-600 select-none">Required Field</label>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => removeField(index)} 
                    className="mt-6 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-all"
                  >
                    <FiTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <button 
              type="submit" 
              className="bg-purple-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-purple-700 shadow-md transition-colors inline-flex items-center gap-2 text-xs"
            >
              <FiSave /> Save Form Template
            </button>
          </div>
        </form>
      )}

      {/* View Responses Modal */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">{activeSubmission.form_title}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span><FiUser className="inline" /> {activeSubmission.customer_name}</span>
                  <span><FiMail className="inline" /> {activeSubmission.customer_email}</span>
                </p>
              </div>
              <button 
                onClick={() => setActiveSubmission(null)} 
                className="text-slate-500 font-bold hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <FiX />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Responses</p>
              
              <div className="space-y-3">
                {Object.entries(activeSubmission.responses).map(([label, val]) => (
                  <div key={label} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500">{label}</p>
                    <p className="font-semibold text-slate-800 mt-1 text-sm">
                      {typeof val === 'boolean' ? (val ? "Yes" : "No") : String(val)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 mt-6 flex justify-between items-center text-xs text-slate-400">
              <span>Submitted: {new Date(activeSubmission.submitted_at).toLocaleString()}</span>
              <button 
                onClick={() => setActiveSubmission(null)} 
                className="bg-purple-600 text-white font-bold px-5 py-2 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple FiX component fallback
function FiX({ size = 18 }) {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
