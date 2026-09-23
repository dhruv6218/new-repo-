import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { processInvoicesCsv } from '../../lib/csvParser';
import { useToast } from '../../contexts/ToastContext';
import { api, triggerUpdate } from '../../lib/api';

type TabType = 'csv' | 'manual';

export const CsvUploadModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('csv');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual form state
  const [form, setForm] = useState({
    client_name: '', client_email: '', amount: '', currency: 'USD', due_date: '', payment_link: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleOpen = () => { setIsOpen(true); setResult(null); setError(null); };
    const handleClose = () => setIsOpen(false);
    window.addEventListener('open-upload-modal', handleOpen);
    window.addEventListener('close-modals', handleClose);
    return () => {
      window.removeEventListener('open-upload-modal', handleOpen);
      window.removeEventListener('close-modals', handleClose);
    };
  }, []);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspace) return;
    setIsUploading(true); setResult(null); setError(null);
    try {
      const count = await processInvoicesCsv(file, activeWorkspace.id);
      setResult({ count });
      addToast(`Successfully imported ${count} invoices`, 'success');
      triggerUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setIsSaving(true); setError(null);
    try {
      if (!form.client_name || !form.amount || !form.due_date) throw new Error('Please fill all required fields.');
      const amount = parseFloat(form.amount);
      if (isNaN(amount) || amount <= 0) throw new Error('Amount must be a positive number.');
      await api.invoices.create({
        workspace_id: activeWorkspace.id,
        client_name: form.client_name.trim(),
        client_email: form.client_email.trim() || `${form.client_name.trim().toLowerCase().replace(/\s+/g, '.')}@client.com`,
        amount,
        currency: form.currency,
        due_date: form.due_date,
        status: 'pending',
      });
      setResult({ count: 1 });
      addToast('Invoice added successfully', 'success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  const close = () => { if (!isUploading && !isSaving) setIsOpen(false); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={close}></div>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 id="modal-title" className="font-heading text-xl font-bold text-gray-900">Add Invoice</h2>
            <button onClick={close} className="text-gray-400 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-md" aria-label="Close modal">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6" role="tablist">
              <button role="tab" aria-selected={activeTab === 'csv'} onClick={() => { setActiveTab('csv'); setResult(null); setError(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'csv' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <UploadCloud className="w-4 h-4" /> Upload CSV
              </button>
              <button role="tab" aria-selected={activeTab === 'manual'} onClick={() => { setActiveTab('manual'); setResult(null); setError(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Plus className="w-4 h-4" /> Manual Entry
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 font-medium" role="alert">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}

            {result ? (
              <div className="text-center py-8 animate-[fadeIn_0.3s_ease-out]">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                  {result.count === 1 ? 'Invoice Added!' : `${result.count} Invoices Imported!`}
                </h3>
                <p className="text-gray-500 font-medium mb-6">
                  {result.count === 1 ? 'Your invoice is now in the Action Center.' : `${result.count} invoices are now in the Action Center.`}
                </p>
                <button onClick={() => setIsOpen(false)} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue transition-colors">Done</button>
              </div>
            ) : activeTab === 'csv' ? (
              <div>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors">
                  <FileSpreadsheet className="w-12 h-12 text-brand-blue mx-auto mb-4 opacity-80" />
                  <h3 className="font-bold text-gray-900 mb-1">Upload Invoice CSV</h3>
                  <p className="text-xs text-gray-500 mb-1">Required: <code className="bg-gray-100 px-1 rounded">client_name</code>, <code className="bg-gray-100 px-1 rounded">amount</code>, <code className="bg-gray-100 px-1 rounded">due_date</code></p>
                  <p className="text-xs text-gray-400 mb-6">Optional: client_email, currency (default USD)</p>
                  <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} aria-label="Upload invoice CSV file" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                    className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto">
                    {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : 'Select CSV File'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-1">Client Name <span className="text-red-500">*</span></label>
                    <input type="text" required value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                      placeholder="Acme Corp" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-blue" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-1">Client Email</label>
                    <input type="email" value={form.client_email} onChange={e => setForm(p => ({ ...p, client_email: e.target.value }))}
                      placeholder="billing@acme.com" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Amount <span className="text-red-500">*</span></label>
                    <input type="number" required min="1" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      placeholder="2400" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Currency</label>
                    <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-blue">
                      <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>AUD</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-1">Due Date <span className="text-red-500">*</span></label>
                    <input type="date" required value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-blue" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-1">Manual Payment Link <span className="text-gray-400 font-normal text-xs">(Optional)</span></label>
                    <input type="url" value={form.payment_link} onChange={e => setForm(p => ({ ...p, payment_link: e.target.value }))}
                      placeholder="e.g. https://paypal.me/yourbusiness/2400" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-blue" />
                  </div>
                </div>
                <button type="submit" disabled={isSaving}
                  className="w-full bg-brand-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Plus className="w-5 h-5" /> Add Invoice</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
  );
};
