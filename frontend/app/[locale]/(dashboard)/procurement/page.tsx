'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingBag, Truck, CheckCircle2, AlertCircle, Plus, Eye, FileCheck, Layers, DollarSign,
  X, Calendar, Building2, User, Phone, Mail, FileText, Settings, Trash2, CheckCircle, RefreshCw, Layers3
} from 'lucide-react';
import { procurementService } from '@/services/procurement.service';
import type { Vendor, PurchaseRequisition, PurchaseOrder } from '@/types/enterprise.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

// ─── Helpers & Constants ──────────────────────────────────────────────────────

const VENDOR_CATEGORIES = [
  'IT & Stationery',
  'STEM & Medical Supplies',
  'Construction & Facility Repairs',
  'Catering & Kitchen Foodstuff',
  'Transportation & Fuel',
  'General Supplies',
];

function vendorCategoryColor(cat: string) {
  const map: Record<string, string> = {
    'IT & Stationery': 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    'STEM & Medical Supplies': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    'Construction & Facility Repairs': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    'Catering & Kitchen Foodstuff': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
    'Transportation & Fuel': 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  };
  return map[cat] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

// ─── Add Vendor Modal ─────────────────────────────────────────────────────────

function AddVendorModal({
  onClose, onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    category: 'General Supplies',
    taxRegistrationNumber: '',
    bankAccountDetails: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await procurementService.addVendor(form);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to add vendor.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" /> Register Approved Vendor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Add verified supplier with tax & bank details to register.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Company / Business Name *</label>
            <input type="text" required value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} placeholder="e.g. Monrovia Office & IT Supplies Ltd." className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Contact Person</label>
              <input type="text" value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} placeholder="e.g. Koli S. Fahnbulleh" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Vendor Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inp}>
                {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="sales@vendor.com" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Phone Number</label>
              <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+231 886 100 200" className={inp} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Tax Identification Number (TIN)</label>
            <input type="text" value={form.taxRegistrationNumber} onChange={e => setForm(p => ({ ...p, taxRegistrationNumber: e.target.value }))} placeholder="e.g. TIN-908123-LIB" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Bank Account Details</label>
            <textarea rows={2} value={form.bankAccountDetails} onChange={e => setForm(p => ({ ...p, bankAccountDetails: e.target.value }))} placeholder="Bank Name, Account Number, SWIFT/IBAN..." className={`${inp} resize-none`} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {loading ? 'Registering...' : 'Register Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create Purchase Order Modal ──────────────────────────────────────────────

function CreatePOModal({
  vendors, currency, onClose, onSuccess, onOpenAddVendor
}: {
  vendors: Vendor[];
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
  onOpenAddVendor?: () => void;
}) {
  const [vendorId, setVendorId] = useState('');
  const [requisitionNumber, setRequisitionNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [items, setItems] = useState<Array<{ itemDescription: string; quantity: number; unitPriceUSD: number }>>([
    { itemDescription: '', quantity: 1, unitPriceUSD: 0 }
  ]);
  const [taxUSD, setTaxUSD] = useState('0');
  const [loading, setLoading] = useState(false);

  const selectedVendor = useMemo(() => vendors.find(v => v.id === vendorId), [vendors, vendorId]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPriceUSD || 0), 0);
  }, [items]);

  const totalAmount = subtotal + (parseFloat(taxUSD) || 0);

  const handleAddItem = () => {
    setItems(prev => [...prev, { itemDescription: '', quantity: 1, unitPriceUSD: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, [field]: value };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || !selectedVendor) {
      toast.error('Please select a vendor.');
      return;
    }
    const validItems = items.filter(i => i.itemDescription.trim() && i.quantity > 0 && i.unitPriceUSD >= 0);
    if (validItems.length === 0) {
      toast.error('Please enter at least one valid line item.');
      return;
    }

    setLoading(true);
    try {
      await procurementService.createPurchaseOrder({
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.companyName,
        orderDate,
        expectedDeliveryDate,
        requisitionNumber,
        taxUSD: parseFloat(taxUSD) || 0,
        items: validItems,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create Purchase Order.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" /> Create Purchase Order (PO)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Issue formal purchase order to vendor with itemized pricing.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Vendor Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Approved Vendor / Supplier *</label>
              {onOpenAddVendor && (
                <button type="button" onClick={() => { onClose(); onOpenAddVendor(); }} className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer border-none bg-transparent">
                  + Add New Vendor
                </button>
              )}
            </div>
            <select value={vendorId} onChange={e => setVendorId(e.target.value)} required className={inp}>
              <option value="">{vendors.length === 0 ? 'No vendors found — click + Add New Vendor' : 'Select vendor...'}</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.companyName} ({v.category})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">PR / Ref Number</label>
              <input type="text" value={requisitionNumber} onChange={e => setRequisitionNumber(e.target.value)} placeholder="e.g. PR-2026-00881" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Order Date *</label>
              <input type="date" required value={orderDate} onChange={e => setOrderDate(e.target.value)} className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Expected Delivery *</label>
              <input type="date" required value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} className={inp} />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">PO Line Items *</label>
              <button type="button" onClick={handleAddItem} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer border-none bg-transparent">
                + Add Line Item
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 w-24">Qty</th>
                    <th className="p-2.5 w-32">Unit Price ({currency})</th>
                    <th className="p-2.5 w-32">Line Total</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {items.map((item, idx) => {
                    const lineTotal = (item.quantity || 0) * (item.unitPriceUSD || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2">
                          <input type="text" required value={item.itemDescription} onChange={e => handleItemChange(idx, 'itemDescription', e.target.value)} placeholder="e.g. Dell Monitors or Exam Paper Reams" className={inp} />
                        </td>
                        <td className="p-2">
                          <input type="number" min="1" required value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)} className={inp} />
                        </td>
                        <td className="p-2">
                          <input type="number" min="0" step="0.01" required value={item.unitPriceUSD} onChange={e => handleItemChange(idx, 'unitPriceUSD', parseFloat(e.target.value) || 0)} className={inp} />
                        </td>
                        <td className="p-2 font-mono font-bold text-slate-900 dark:text-white">
                          {currency} {lineTotal.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          {items.length > 1 && (
                            <button type="button" onClick={() => handleRemoveItem(idx)} className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer border-none bg-transparent">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500 font-semibold">
              <span>Subtotal:</span>
              <span className="font-mono">{currency} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Estimated Tax / Shipping ({currency}):</span>
              <input type="number" min="0" step="0.01" value={taxUSD} onChange={e => setTaxUSD(e.target.value)} className="w-32 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-right text-xs" />
            </div>
            <div className="flex justify-between text-slate-900 dark:text-white font-extrabold text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Total PO Value:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{currency} {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              {loading ? 'Creating...' : 'Issue Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 3-Way Match Modal ────────────────────────────────────────────────────────

function ThreeWayMatchModal({
  po, currency, onClose, onSuccess
}: {
  po: PurchaseOrder;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState(`INV-${po.vendorName.substring(0, 3).toUpperCase()}-2026-01`);
  const [grnNumber, setGrnNumber] = useState(`GRN-2026-0045`);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await procurementService.performThreeWayMatch(po, grnNumber, vendorInvoiceNumber);
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to post 3-way match.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 3-Way Match Verification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Reconcile PO ↔ GRN ↔ Vendor Invoice & Post AP Liability.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">PO: {po.poNumber}</p>
            <p className="text-slate-500">Vendor: {po.vendorName}</p>
            <p className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">Total: {currency} {po.totalAmountUSD.toFixed(2)}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Vendor Invoice Number *</label>
            <input type="text" required value={vendorInvoiceNumber} onChange={e => setVendorInvoiceNumber(e.target.value)} placeholder="e.g. INV-VND-2026-88" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Goods Receipt (GRN) Reference *</label>
            <input type="text" required value={grnNumber} onChange={e => setGrnNumber(e.target.value)} placeholder="e.g. GRN-2026-0045" className={inp} />
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
            <span>Verified 3-way match automatically posts Accounts Payable Vendor Liability ({currency} {po.totalAmountUSD.toFixed(2)}) to General Ledger account 2010.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {loading ? 'Matching...' : 'Confirm 3-Way Match & Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Inspect PO Drawer ────────────────────────────────────────────────────────

function InspectPODrawer({
  po, currency, onClose, onMatch, onDelete
}: {
  po: PurchaseOrder;
  currency: string;
  onClose: () => void;
  onMatch: (po: PurchaseOrder) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="space-y-1">
            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{po.poNumber}</span>
            <h3 className="font-black text-slate-900 dark:text-white text-sm leading-snug">{po.vendorName}</h3>
            <p className="text-xs text-slate-500">Requisition Ref: {po.requisitionNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Badges */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Approval</p>
              <StatusBadge status={po.approvalStatus} size="sm" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Fulfillment</p>
              <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{po.fulfillmentStatus.replace('_', ' ')}</span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">3-Way Match</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${po.threeWayMatchStatus === 'matched' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {po.threeWayMatchStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wide">Order Line Items</h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 w-16">Qty</th>
                    <th className="p-2.5 w-24">Unit Price</th>
                    <th className="p-2.5 w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {(po.items || []).map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{item.itemDescription}</td>
                      <td className="p-2.5 font-mono">{item.quantity}</td>
                      <td className="p-2.5 font-mono">{currency} {item.unitPriceUSD.toFixed(2)}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">{currency} {item.totalPriceUSD.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">{currency} {po.subtotalUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax / Shipping:</span>
              <span className="font-mono font-bold">{currency} {po.taxUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-sm text-indigo-600 dark:text-indigo-400 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Total PO Value:</span>
              <span className="font-mono">{currency} {po.totalAmountUSD.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            {po.threeWayMatchStatus !== 'matched' && (
              <button
                onClick={() => { onClose(); onMatch(po); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> 3-Way Match & Post AP
              </button>
            )}
            <button
              onClick={() => { onClose(); onDelete(po.id); }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Modal ──────────────────────────────────────────────────────────

function SettingsModal({
  settings, onClose, onSave
}: {
  settings: { currency: string };
  onClose: () => void;
  onSave: (newSettings: { currency: string }) => void;
}) {
  const [form, setForm] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    localStorage.setItem('procurementSettings', JSON.stringify(form));
    toast.success('Procurement ERP settings saved.');
    onClose();
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" /> Procurement Settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure display currency for Purchase Orders & Accounts Payable.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Display Currency</label>
            <input
              type="text"
              required
              list="procurement-currencies"
              value={form.currency}
              onChange={e => setForm(p => ({ ...p, currency: e.target.value.toUpperCase() }))}
              placeholder="e.g. USD, GNF, LD, NGN"
              className={inp}
            />
            <datalist id="procurement-currencies">
              <option value="USD" />
              <option value="LD" />
              <option value="GNF" />
              <option value="NGN" />
              <option value="EUR" />
            </datalist>
            <p className="text-[11px] text-slate-400">Select or type any custom currency symbol or code.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer">Save Settings</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProcurementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [activeTab, setActiveTab] = useState<'pos' | 'vendors'>('pos');

  // Modals
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [matchPO, setMatchPO] = useState<PurchaseOrder | null>(null);
  const [inspectPO, setInspectPO] = useState<PurchaseOrder | null>(null);

  // Currency Settings
  const [procurementSettings, setProcurementSettings] = useState({ currency: 'USD' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [v, pr, po] = await Promise.all([
        procurementService.getVendors(),
        procurementService.getRequisitions(),
        procurementService.getPurchaseOrders()
      ]);
      setVendors(v);
      setRequisitions(pr);
      setPurchaseOrders(po);
    } catch {
      toast.error('Failed to load procurement & PO data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    try {
      const stored = localStorage.getItem('procurementSettings');
      if (stored) {
        setProcurementSettings(JSON.parse(stored));
      }
    } catch { }
  }, [loadData]);

  const filteredOrders = useMemo(() => {
    if (!query) return purchaseOrders;
    const q = query.toLowerCase();
    return purchaseOrders.filter(po =>
      po.poNumber.toLowerCase().includes(q) ||
      po.vendorName.toLowerCase().includes(q) ||
      po.fulfillmentStatus.toLowerCase().includes(q)
    );
  }, [purchaseOrders, query]);

  const filteredVendors = useMemo(() => {
    if (!query) return vendors;
    const q = query.toLowerCase();
    return vendors.filter(v =>
      v.companyName.toLowerCase().includes(q) ||
      v.vendorCode.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      (v.contactPerson || '').toLowerCase().includes(q)
    );
  }, [vendors, query]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    const totalPOs = purchaseOrders.length;
    const totalPOAmount = purchaseOrders.reduce((sum, po) => sum + po.totalAmountUSD, 0);
    const matchedCount = purchaseOrders.filter(po => po.threeWayMatchStatus === 'matched').length;
    const cur = procurementSettings.currency;

    return [
      {
        id: 'approved_vendors',
        title: 'Approved Vendors & Suppliers',
        value: `${vendors.length} Vendors`,
        subtitle: 'Verified Tax & Bank Registration',
        trendDirection: 'up',
        icon: <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        id: 'purchase_orders',
        title: 'Active Purchase Orders (PO)',
        value: `${totalPOs} Orders`,
        subtitle: `${cur} ${totalPOAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} Total Value`,
        trendDirection: 'up',
        icon: <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      },
      {
        id: 'three_way_match',
        title: '3-Way Match Verified (PO ↔ GRN)',
        value: `${matchedCount} Matched`,
        subtitle: 'AP Liabilities Posted to GL 2010',
        trendDirection: 'up',
        icon: <CheckCircle2 className="w-5 h-5 text-sky-500" />
      },
      {
        id: 'requisitions',
        title: 'Purchase Requisitions (PR)',
        value: `${requisitions.length} Requests`,
        subtitle: 'Department budget checks verified',
        trendDirection: 'neutral',
        icon: <FileCheck className="w-5 h-5 text-amber-500" />
      }
    ];
  }, [vendors, purchaseOrders, requisitions, procurementSettings]);

  const poColumns = useMemo<ColumnDef<PurchaseOrder, any>[]>(() => {
    const cur = procurementSettings.currency;
    return [
      {
        accessorKey: 'poNumber',
        header: 'PO Number & Vendor',
        cell: ({ row }) => {
          const po = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{po.poNumber}</span>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors text-xs sm:text-sm max-w-sm truncate">
                {po.vendorName}
              </p>
              <span className="text-xs text-slate-500">Requisition: {po.requisitionNumber || 'Direct PO'}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'orderDate',
        header: 'Order / Delivery Date',
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold block">{row.original.orderDate}</span>
            <span className="font-mono text-[11px] text-slate-500">Exp: {row.original.expectedDeliveryDate}</span>
          </div>
        )
      },
      {
        accessorKey: 'totalAmountUSD',
        header: `Total Order Value (${cur})`,
        cell: ({ row }) => (
          <span className="font-mono text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block">
            {cur} {row.original.totalAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )
      },
      {
        accessorKey: 'threeWayMatchStatus',
        header: '3-Way Match & AP',
        cell: ({ row }) => (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${row.original.threeWayMatchStatus === 'matched' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <CheckCircle2 className="w-3 h-3" />
            {row.original.threeWayMatchStatus.toUpperCase()}
          </span>
        )
      },
      {
        accessorKey: 'approvalStatus',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.approvalStatus} size="sm" />
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const po = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectPO(po);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                Inspect
              </button>
              {po.threeWayMatchStatus !== 'matched' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMatchPO(po);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs cursor-pointer border-none"
                >
                  3-Way Match
                </button>
              )}
            </div>
          );
        }
      }
    ];
  }, [procurementSettings]);

  const vendorColumns = useMemo<ColumnDef<Vendor, any>[]>(() => [
    {
      accessorKey: 'vendorCode',
      header: 'Vendor Code & Company',
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{v.vendorCode}</span>
            <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{v.companyName}</p>
            <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold ${vendorCategoryColor(v.category)}`}>{v.category}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'contactPerson',
      header: 'Contact Info',
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="space-y-0.5 text-xs">
            <p className="font-semibold text-slate-900 dark:text-white">{v.contactPerson || '—'}</p>
            {v.email && <p className="text-[11px] text-slate-500">{v.email}</p>}
            {v.phone && <p className="text-[11px] text-slate-500">{v.phone}</p>}
          </div>
        );
      }
    },
    {
      accessorKey: 'taxRegistrationNumber',
      header: 'Tax Reg (TIN) & Bank',
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="space-y-0.5 text-xs">
            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 block">{v.taxRegistrationNumber || 'N/A'}</span>
            <p className="text-[10px] text-slate-400 truncate max-w-xs">{v.bankAccountDetails || 'No bank on file'}</p>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    }
  ], []);

  const handleDeletePO = async (id: string) => {
    try {
      await procurementService.deletePurchaseOrder(id);
      loadData();
    } catch {
      toast.error('Failed to delete Purchase Order.');
    }
  };

  return (
    <>
      <EnterpriseModuleShell
        title="Procurement & Accounts Payable ERP"
        description="Vendor relationship portal, Purchase Orders (PO), Requisitions, 3-Way Matching (PO ↔ GRN ↔ Vendor Invoice), and automatic Accounts Payable (GL 2010) posting."
        breadcrumbs={[{ label: 'School ERP' }, { label: 'Procurement' }]}
        icon={<ShoppingBag className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
        recordCount={activeTab === 'pos' ? filteredOrders.length : filteredVendors.length}
        recordLabel={activeTab === 'pos' ? 'Purchase Orders' : 'Vendors'}
        onClearFilters={() => setQuery('')}
        headerActions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border-none cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" /> Settings
            </button>
            <button
              onClick={() => setShowAddVendorModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border-none cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" /> + Vendor
            </button>
            <button
              onClick={() => setShowCreatePOModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm border-none cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Create Purchase Order</span>
            </button>
          </div>
        }
      >
        <EnterpriseKPIDeck cards={kpiCards} />

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl self-start w-fit">
          {(['pos', 'vendors'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none capitalize ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'pos' ? 'Purchase Orders' : 'Approved Vendors'}
            </button>
          ))}
        </div>

        <EnterpriseToolbar
          searchQuery={query}
          onSearchChange={setQuery}
          searchPlaceholder={activeTab === 'pos' ? 'Search POs by PO number, vendor name, fulfillment status...' : 'Search vendors by company name, category, contact...'}
          density={density}
          onDensityChange={setDensity}
          onRefresh={loadData}
        />

        {activeTab === 'pos' ? (
          <EnterpriseDataGrid
            data={filteredOrders}
            columns={poColumns}
            isLoading={loading}
            density={density}
            onRowInspect={(row) => setInspectPO(row)}
          />
        ) : (
          <EnterpriseDataGrid
            data={filteredVendors}
            columns={vendorColumns}
            isLoading={loading}
            density={density}
          />
        )}
      </EnterpriseModuleShell>

      {/* Modals */}
      {showCreatePOModal && (
        <CreatePOModal
          vendors={vendors}
          currency={procurementSettings.currency}
          onClose={() => setShowCreatePOModal(false)}
          onSuccess={loadData}
          onOpenAddVendor={() => setShowAddVendorModal(true)}
        />
      )}
      {showAddVendorModal && (
        <AddVendorModal
          onClose={() => setShowAddVendorModal(false)}
          onSuccess={loadData}
        />
      )}
      {showSettingsModal && (
        <SettingsModal
          settings={procurementSettings}
          onClose={() => setShowSettingsModal(false)}
          onSave={(newSettings) => setProcurementSettings(newSettings)}
        />
      )}
      {matchPO && (
        <ThreeWayMatchModal
          po={matchPO}
          currency={procurementSettings.currency}
          onClose={() => setMatchPO(null)}
          onSuccess={loadData}
        />
      )}
      {inspectPO && (
        <InspectPODrawer
          po={inspectPO}
          currency={procurementSettings.currency}
          onClose={() => setInspectPO(null)}
          onMatch={(po) => setMatchPO(po)}
          onDelete={handleDeletePO}
        />
      )}
    </>
  );
}
