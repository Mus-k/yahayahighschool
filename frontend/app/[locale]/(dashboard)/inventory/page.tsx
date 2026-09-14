'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, Warehouse, Plus, AlertCircle, RefreshCw, FileText,
  X, ChevronDown, ClipboardList, ArrowDownToLine, ArrowUpFromLine,
  Barcode, Tag, MapPin, User, Hash, DollarSign, TriangleAlert,
  CheckCircle2, Clock, TrendingDown, Building2, ShieldCheck, Info,
  Settings, Pencil, Trash2
} from 'lucide-react';
import { inventoryService } from '@/services/inventory.service';
import type { InventoryWarehouse, InventoryItem, InventoryMovement } from '@/types/enterprise.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Stationery & Books', 'Lab Consumables', 'IT Hardware', 'Cleaning Supplies',
  'Maintenance Parts', 'Uniforms', 'Sports Equipment', 'Medical Supplies',
  'Kitchen & Catering', 'Other'
];
const UNITS = ['pcs', 'boxes', 'kg', 'liters', 'sets', 'reams', 'pairs', 'meters', 'units'];
const VALUATION_METHODS = ['FIFO', 'Weighted Average'];

function categoryColor(cat: string) {
  const map: Record<string, string> = {
    'Stationery & Books': 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    'Lab Consumables': 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    'IT Hardware': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    'Cleaning Supplies': 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
    'Maintenance Parts': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    'Uniforms': 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    'Sports Equipment': 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
    'Medical Supplies': 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    'Kitchen & Catering': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
  };
  return map[cat] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

function movementTypeLabel(type: string) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    goods_receipt: { label: 'GRN — Goods Receipt', color: 'text-emerald-600 dark:text-emerald-400', icon: <ArrowDownToLine className="w-3.5 h-3.5" /> },
    goods_issue: { label: 'ISS — Stock Issue', color: 'text-rose-600 dark:text-rose-400', icon: <ArrowUpFromLine className="w-3.5 h-3.5" /> },
    stock_transfer: { label: 'TRF — Transfer', color: 'text-sky-600 dark:text-sky-400', icon: <RefreshCw className="w-3.5 h-3.5" /> },
    adjustment: { label: 'ADJ — Adjustment', color: 'text-amber-600 dark:text-amber-400', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    cycle_count: { label: 'CYC — Cycle Count', color: 'text-violet-600 dark:text-violet-400', icon: <Hash className="w-3.5 h-3.5" /> },
  };
  return map[type] || { label: type, color: 'text-slate-500', icon: null };
}

// ─── GRN Modal ────────────────────────────────────────────────────────────────

function GRNModal({
  items, warehouses, onClose, onSuccess, onOpenAddSKU, currency
}: {
  items: InventoryItem[];
  warehouses: InventoryWarehouse[];
  onClose: () => void;
  onSuccess: () => void;
  onOpenAddSKU?: () => void;
  currency: string;
}) {
  const [form, setForm] = useState({
    itemId: '',
    quantity: '',
    unitCost: '',
    vendorSupplier: '',
    referenceDocNumber: '',
    performedBy: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const selectedItem = useMemo(() => items.find(i => i.id === form.itemId), [items, form.itemId]);

  const totalCost = useMemo(() => {
    const q = parseFloat(form.quantity);
    const c = parseFloat(form.unitCost);
    if (!q || !c) return 0;
    return q * c;
  }, [form.quantity, form.unitCost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const qty = parseFloat(form.quantity);
    const cost = parseFloat(form.unitCost);
    if (qty <= 0 || cost < 0) { toast.error('Enter valid quantity and cost.'); return; }
    setLoading(true);
    try {
      await inventoryService.recordGoodsReceipt({
        itemId: selectedItem.id,
        itemCode: selectedItem.itemCode,
        itemName: selectedItem.name,
        quantity: qty,
        unitCost: cost,
        warehouseName: selectedItem.warehouseName,
        vendorSupplier: form.vendorSupplier,
        referenceDocNumber: form.referenceDocNumber,
        performedBy: form.performedBy,
        notes: form.notes,
        currentQty: selectedItem.quantityOnHand,
        currentUnitCost: selectedItem.unitCostUSD,
        valuationMethod: selectedItem.valuationMethod,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to post GRN.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-emerald-600" /> Goods Receipt Note (GRN)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Receive stock from supplier. Auto-posts to Finance GL (Dr. 1050 / Cr. 2010).</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Item Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Select Inventory Item *</label>
              {onOpenAddSKU && (
                <button type="button" onClick={() => { onClose(); onOpenAddSKU(); }} className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer border-none bg-transparent">
                  + Add New SKU
                </button>
              )}
            </div>
            <select value={form.itemId} onChange={e => setForm(p => ({ ...p, itemId: e.target.value, unitCost: items.find(i => i.id === e.target.value)?.unitCostUSD?.toString() || '' }))} required className={inp}>
              <option value="">{items.length === 0 ? 'No SKUs found — click + Add New SKU' : 'Choose item from catalog...'}</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.itemCode} — {i.name} ({i.warehouseName})</option>
              ))}
            </select>
            {selectedItem && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-slate-400 font-bold uppercase text-[10px]">On Hand</p><p className="font-extrabold text-slate-900 dark:text-white">{selectedItem.quantityOnHand} {selectedItem.unitOfMeasure}</p></div>
                <div><p className="text-slate-400 font-bold uppercase text-[10px]">Unit Cost</p><p className="font-extrabold text-emerald-600 dark:text-emerald-400">{currency} {selectedItem.unitCostUSD.toFixed(2)}</p></div>
                <div><p className="text-slate-400 font-bold uppercase text-[10px]">Valuation</p><p className="font-extrabold text-slate-900 dark:text-white">{selectedItem.valuationMethod}</p></div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Quantity Received *</label>
              <input type="number" min="0.01" step="0.01" required value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="e.g. 100" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Unit Cost ({currency}) *</label>
              <input type="number" min="0" step="0.01" required value={form.unitCost} onChange={e => setForm(p => ({ ...p, unitCost: e.target.value }))} placeholder="e.g. 18.50" className={inp} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Vendor / Supplier</label>
              <input type="text" value={form.vendorSupplier} onChange={e => setForm(p => ({ ...p, vendorSupplier: e.target.value }))} placeholder="e.g. Al-Amin Stationery Ltd" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">PO / Reference No.</label>
              <input type="text" value={form.referenceDocNumber} onChange={e => setForm(p => ({ ...p, referenceDocNumber: e.target.value }))} placeholder="e.g. PO-2026-00941" className={inp} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Received By *</label>
            <input type="text" required value={form.performedBy} onChange={e => setForm(p => ({ ...p, performedBy: e.target.value }))} placeholder="e.g. Brother Musa Kamara" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Condition notes, partial delivery remarks..." className={`${inp} resize-none`} />
          </div>

          {totalCost > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Total GRN Value — Finance GL (Dr. 1050)</span>
              </div>
              <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">{currency} {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5">
              <ArrowDownToLine className="w-3.5 h-3.5" />
              {loading ? 'Posting GRN...' : 'Confirm GRN & Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Issue Stock Modal ────────────────────────────────────────────────────────

function IssueStockModal({
  item, onClose, onSuccess, currency
}: {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
  currency: string;
}) {
  const [form, setForm] = useState({
    quantity: '',
    issuedTo: '',
    purpose: '',
    performedBy: '',
  });
  const [loading, setLoading] = useState(false);

  const qty = parseFloat(form.quantity) || 0;
  const totalCost = qty * item.unitCostUSD;
  const afterQty = item.quantityOnHand - qty;
  const isOverQty = qty > item.quantityOnHand;
  const willBeLow = afterQty >= 0 && afterQty <= item.minimumReorderLevel;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverQty) { toast.error('Cannot issue more than available quantity.'); return; }
    if (qty <= 0) { toast.error('Enter a valid quantity.'); return; }
    setLoading(true);
    try {
      await inventoryService.recordStockIssue({
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        quantity: qty,
        unitCost: item.unitCostUSD,
        warehouseName: item.warehouseName,
        issuedTo: form.issuedTo,
        purpose: form.purpose,
        performedBy: form.performedBy,
        currentQty: item.quantityOnHand,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to issue stock.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <ArrowUpFromLine className="w-4 h-4 text-amber-500" /> Issue Stock
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Auto-posts COGS expense journal (Dr. 5040 / Cr. 1050).</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Item Info */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">{item.name}</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div><p className="text-slate-400 font-bold uppercase text-[10px]">SKU</p><p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.itemCode}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[10px]">Available</p><p className="font-extrabold text-slate-900 dark:text-white">{item.quantityOnHand} {item.unitOfMeasure}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[10px]">Reorder At</p><p className="font-extrabold text-amber-600">{item.minimumReorderLevel} {item.unitOfMeasure}</p></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Quantity to Issue *</label>
            <input type="number" min="0.01" step="0.01" required value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder={`Max: ${item.quantityOnHand}`} className={`${inp} ${isOverQty ? 'border-rose-500 focus:border-rose-500' : ''}`} />
            {isOverQty && <p className="text-xs text-rose-600 font-bold">⚠ Exceeds available stock ({item.quantityOnHand} {item.unitOfMeasure})</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Issued To (Dept / Person) *</label>
            <input type="text" required value={form.issuedTo} onChange={e => setForm(p => ({ ...p, issuedTo: e.target.value }))} placeholder="e.g. Science Department, Block A" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Issued By *</label>
            <input type="text" required value={form.performedBy} onChange={e => setForm(p => ({ ...p, performedBy: e.target.value }))} placeholder="e.g. Brother Musa Kamara" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Purpose / Notes</label>
            <textarea rows={2} value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} placeholder="e.g. End-of-semester exam stationery distribution" className={`${inp} resize-none`} />
          </div>

          {qty > 0 && (
            <div className="space-y-2">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <DollarSign className="w-4 h-4" />
                  <span>COGS Value — Finance GL (Dr. 5040)</span>
                </div>
                <span className="font-mono font-extrabold text-amber-700 dark:text-amber-400">{currency} {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              {willBeLow && !isOverQty && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-400">
                  <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>Reorder Alert:</strong> After this issue, stock will be at {afterQty} {item.unitOfMeasure} — below the reorder level of {item.minimumReorderLevel}. Consider placing a purchase order.</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading || isOverQty} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5">
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              {loading ? 'Issuing...' : 'Confirm Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add SKU Modal ────────────────────────────────────────────────────────────

function AddSKUModal({
  warehouses, onClose, onSuccess, onOpenWarehouseModal, currency
}: {
  warehouses: InventoryWarehouse[];
  onClose: () => void;
  onSuccess: () => void;
  onOpenWarehouseModal?: () => void;
  currency: string;
}) {
  const [form, setForm] = useState({
    itemCode: '',
    name: '',
    description: '',
    category: 'Stationery & Books',
    unitOfMeasure: 'pcs',
    warehouseId: '',
    minimumReorderLevel: '',
    unitCost: '',
    valuationMethod: 'FIFO',
    barcode: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inventoryService.addItem({
        ...form,
        minimumReorderLevel: parseFloat(form.minimumReorderLevel) || 0,
        unitCost: parseFloat(form.unitCost) || 0,
      });
      toast.success(`SKU "${form.name}" added to catalog.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to add SKU.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" /> Add New SKU to Catalog
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Define a new stock item. Actual stock is added via Goods Receipt (GRN).</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Item / Product Name *</label>
            <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. A4 High-Grade Examination Paper Reams" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">SKU / Item Code *</label>
            <input type="text" required value={form.itemCode} onChange={e => setForm(p => ({ ...p, itemCode: e.target.value }))} placeholder="e.g. INV-SKU-1001" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Barcode</label>
            <input type="text" value={form.barcode} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))} placeholder="e.g. 8901234567891" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Category *</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inp}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Unit of Measure *</label>
            <select value={form.unitOfMeasure} onChange={e => setForm(p => ({ ...p, unitOfMeasure: e.target.value }))} className={inp}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Warehouse *</label>
              {onOpenWarehouseModal && (
                <button type="button" onClick={() => { onClose(); onOpenWarehouseModal(); }} className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer border-none bg-transparent">
                  + Add Warehouse
                </button>
              )}
            </div>
            <select value={form.warehouseId} onChange={e => setForm(p => ({ ...p, warehouseId: e.target.value }))} required className={inp}>
              <option value="">{warehouses.length === 0 ? 'No warehouses — click + Add Warehouse' : 'Select warehouse...'}</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Valuation Method</label>
            <select value={form.valuationMethod} onChange={e => setForm(p => ({ ...p, valuationMethod: e.target.value }))} className={inp}>
              {VALUATION_METHODS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Unit Cost ({currency})</label>
            <input type="number" min="0" step="0.01" value={form.unitCost} onChange={e => setForm(p => ({ ...p, unitCost: e.target.value }))} placeholder="0.00" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Min. Reorder Level</label>
            <input type="number" min="0" step="0.01" value={form.minimumReorderLevel} onChange={e => setForm(p => ({ ...p, minimumReorderLevel: e.target.value }))} placeholder="0" className={inp} />
          </div>

          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Detailed description..." className={`${inp} resize-none`} />
          </div>

          <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {loading ? 'Saving...' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Inspect Drawer ───────────────────────────────────────────────────────────

function InspectDrawer({
  item, onClose, onIssueStock, currency
}: {
  item: InventoryItem;
  onClose: () => void;
  onIssueStock: (item: InventoryItem) => void;
  currency: string;
}) {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loadingMov, setLoadingMov] = useState(true);

  useEffect(() => {
    setLoadingMov(true);
    inventoryService.getItemMovements(item.id).then(m => {
      setMovements(m);
      setLoadingMov(false);
    });
  }, [item.id]);

  const isLow = item.quantityOnHand <= item.minimumReorderLevel;
  const isOut = item.quantityOnHand <= 0;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="space-y-1">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryColor(item.category)}`}>{item.category}</span>
            <h3 className="font-black text-slate-900 dark:text-white text-sm leading-snug">{item.name}</h3>
            <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{item.itemCode}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Stock Level Alert */}
          {isOut ? (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-700 dark:text-rose-400 font-bold">
              <TriangleAlert className="w-4 h-4 shrink-0" /> Out of Stock — Immediate reorder required.
            </div>
          ) : isLow ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-700 dark:text-amber-400 font-bold">
              <TriangleAlert className="w-4 h-4 shrink-0" /> Low Stock — Below reorder threshold of {item.minimumReorderLevel} {item.unitOfMeasure}.
            </div>
          ) : null}

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Quantity on Hand', value: `${item.quantityOnHand} ${item.unitOfMeasure}`, highlight: isLow },
              { label: 'Reorder Level', value: `${item.minimumReorderLevel} ${item.unitOfMeasure}` },
              { label: `Unit Cost (${currency})`, value: `${currency} ${item.unitCostUSD.toFixed(2)}` },
              { label: 'Total Valuation', value: `${currency} ${item.totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
              { label: 'Valuation Method', value: item.valuationMethod },
              { label: 'Status', value: <StatusBadge status={item.status} size="sm" /> },
            ].map((m, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{m.label}</p>
                <p className={`text-xs font-extrabold ${m.highlight ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Location */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Storage Location</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white">{item.warehouseName}</p>
            {item.barcode && <p className="font-mono text-[11px] text-slate-500 flex items-center gap-1"><Barcode className="w-3 h-3" /> {item.barcode}</p>}
            {item.description && <p className="text-[11px] text-slate-500 mt-1">{item.description}</p>}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => { onClose(); onIssueStock(item); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer transition"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" /> Issue Stock
            </button>
          </div>

          {/* Movement History */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Movement History
            </h4>
            {loadingMov ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading movements...</div>
            ) : movements.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl">No movements recorded yet for this item.</div>
            ) : (
              <div className="space-y-2">
                {movements.map(mov => {
                  const meta = movementTypeLabel(mov.type);
                  return (
                    <div key={mov.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1.5 text-[11px] font-bold ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">{mov.movementNumber}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          {mov.type === 'goods_receipt' ? `From: ${mov.vendorSupplier || mov.destinationWarehouse || '—'}` : `To: ${mov.destinationWarehouse || '—'}`}
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                          {mov.type === 'goods_receipt' ? '+' : '−'}{mov.quantity} {item.unitOfMeasure}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{mov.performedBy}</span>
                        <span>{mov.date}</span>
                      </div>
                      {mov.referenceDocNumber && <p className="text-[10px] font-mono text-indigo-500">Ref: {mov.referenceDocNumber}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Warehouse Modal ─────────────────────────────────────────────────────────

function WarehouseModal({
  warehouses, onClose, onSuccess
}: {
  warehouses: InventoryWarehouse[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ code: '', name: '', location: '', managerName: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inventoryService.addWarehouse(form);
      toast.success(`Warehouse "${form.name}" created.`);
      setForm({ code: '', name: '', location: '', managerName: '' });
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create warehouse.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await inventoryService.deleteWarehouse(id);
      toast.success('Warehouse removed.');
      onSuccess();
    } catch {
      toast.error('Failed to remove warehouse.');
    }
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-indigo-600" /> Manage Campus Warehouses
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Depots and storage locations across campus.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Add Warehouse Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">+ Add New Warehouse</h4>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="Code (e.g. WH-MAIN-01)" className={inp} />
              <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Warehouse Name *" className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Location (e.g. Building B)" className={inp} />
              <input type="text" value={form.managerName} onChange={e => setForm(p => ({ ...p, managerName: e.target.value }))} placeholder="Manager / Storekeeper" className={inp} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl border-none cursor-pointer">
              {loading ? 'Creating...' : 'Create Warehouse'}
            </button>
          </form>

          {/* Existing Warehouses List */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wide">Existing Warehouses ({warehouses.length})</h4>
            {warehouses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No warehouses created yet. Use the form above to add your first campus warehouse.</p>
            ) : (
              <div className="space-y-2">
                {warehouses.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">{w.code}</span>
                      <p className="font-bold text-slate-900 dark:text-white">{w.name}</p>
                      {w.location && <p className="text-[11px] text-slate-400">{w.location} {w.managerName ? `· Mgr: ${w.managerName}` : ''}</p>}
                    </div>
                    <button onClick={() => handleDelete(w.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-none cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
    localStorage.setItem('inventorySettings', JSON.stringify(form));
    toast.success('Inventory settings saved.');
    onClose();
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" /> Inventory Settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure currency display for valuation and unit costs.</p>
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
              list="inventory-currencies"
              value={form.currency}
              onChange={e => setForm(p => ({ ...p, currency: e.target.value.toUpperCase() }))}
              placeholder="e.g. USD, GNF, LD, NGN"
              className={inp}
            />
            <datalist id="inventory-currencies">
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

export default function InventoryPage() {
  const [warehouses, setWarehouses] = useState<InventoryWarehouse[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [activeTab, setActiveTab] = useState<'items' | 'movements'>('items');

  // Modal states
  const [showGRN, setShowGRN] = useState(false);
  const [showAddSKU, setShowAddSKU] = useState(false);
  const [issueItem, setIssueItem] = useState<InventoryItem | null>(null);
  const [inspectItem, setInspectItem] = useState<InventoryItem | null>(null);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Inventory settings — persisted in localStorage
  const [inventorySettings, setInventorySettings] = useState({ currency: 'USD' });
  const [settingsForm, setSettingsForm] = useState({ currency: 'USD' });

  const [allMovements, setAllMovements] = useState<InventoryMovement[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [w, i, m] = await Promise.all([
        inventoryService.getWarehouses(),
        inventoryService.getItems(),
        inventoryService.getMovements(),
      ]);
      setWarehouses(w);
      setItems(i);
      setAllMovements(m);
    } catch {
      toast.error('Failed to load inventory data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    try {
      const stored = localStorage.getItem('inventorySettings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setInventorySettings(parsed);
        setSettingsForm(parsed);
      }
    } catch { }
  }, [loadData]);

  const filteredItems = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.itemCode.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.warehouseName.toLowerCase().includes(q)
    );
  }, [items, query]);

  const filteredMovements = useMemo(() => {
    if (!query) return allMovements;
    const q = query.toLowerCase();
    return allMovements.filter(m =>
      m.itemName.toLowerCase().includes(q) ||
      m.itemCode.toLowerCase().includes(q) ||
      m.movementNumber?.toLowerCase().includes(q) ||
      m.performedBy?.toLowerCase().includes(q)
    );
  }, [allMovements, query]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    const totalSKUs = items.length;
    const totalValuation = items.reduce((sum, i) => sum + i.totalValueUSD, 0);
    const lowStockCount = items.filter(i => i.quantityOnHand <= i.minimumReorderLevel && i.quantityOnHand > 0).length;
    const outOfStockCount = items.filter(i => i.quantityOnHand <= 0).length;

    return [
      {
        id: 'total_skus',
        title: 'Active Inventory SKUs',
        value: `${totalSKUs.toLocaleString('en-US')}`,
        subtitle: `Across ${warehouses.length} Warehouse${warehouses.length !== 1 ? 's' : ''}`,
        trendDirection: 'up',
        icon: <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      },
      {
        id: 'total_valuation',
        title: 'Stock Asset Valuation',
        value: `${inventorySettings.currency} ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: 'FIFO/WAC — Capitalized in GL 1050',
        trendDirection: 'up',
        icon: <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      },
      {
        id: 'low_stock',
        title: 'Low Stock Alerts',
        value: `${lowStockCount}`,
        subtitle: 'Items below minimum reorder level',
        trendDirection: lowStockCount > 0 ? 'down' : 'neutral',
        icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
      },
      {
        id: 'out_of_stock',
        title: 'Out of Stock',
        value: `${outOfStockCount}`,
        subtitle: 'Items with zero quantity on hand',
        trendDirection: outOfStockCount > 0 ? 'down' : 'neutral',
        icon: <TrendingDown className="w-5 h-5 text-rose-500" />,
      },
    ];
  }, [items, warehouses, inventorySettings]);

  const itemColumns = useMemo<ColumnDef<InventoryItem, any>[]>(() => [
    {
      accessorKey: 'itemCode',
      header: 'SKU & Item Name',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block">{item.itemCode}</span>
            <p className="font-bold text-slate-900 dark:text-white text-xs max-w-xs truncate">{item.name}</p>
            <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold ${categoryColor(item.category)}`}>{item.category}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'warehouseName',
      header: 'Warehouse',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-white text-xs block">{row.original.warehouseName || '—'}</span>
          {row.original.barcode && <span className="font-mono text-[10px] text-slate-400">Barcode: {row.original.barcode}</span>}
        </div>
      ),
    },
    {
      accessorKey: 'quantityOnHand',
      header: 'Quantity on Hand',
      cell: ({ row }) => {
        const item = row.original;
        const isLow = item.quantityOnHand <= item.minimumReorderLevel;
        return (
          <div>
            <span className={`font-mono text-sm font-extrabold ${item.quantityOnHand <= 0 ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {item.quantityOnHand} {item.unitOfMeasure}
            </span>
            <span className="text-[11px] text-slate-400 block">Reorder at: {item.minimumReorderLevel}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalValueUSD',
      header: 'Valuation & Unit Cost',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">{inventorySettings.currency} {row.original.totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          <span className="text-[11px] text-slate-400">{inventorySettings.currency} {row.original.unitCostUSD.toFixed(2)}/unit ({row.original.valuationMethod})</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); setInspectItem(item); }}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Inspect
            </button>
            <button
              onClick={e => { e.stopPropagation(); setIssueItem(item); }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer border-none"
            >
              <ArrowUpFromLine className="w-3 h-3 inline mr-1" />Issue
            </button>
          </div>
        );
      },
    },
  ], []);

  const movementColumns = useMemo<ColumnDef<InventoryMovement, any>[]>(() => [
    {
      accessorKey: 'movementNumber',
      header: 'Movement No.',
      cell: ({ row }) => {
        const mov = row.original;
        const meta = movementTypeLabel(mov.type);
        return (
          <div className="space-y-0.5">
            <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block">{mov.movementNumber}</span>
            <span className={`flex items-center gap-1 text-[11px] font-bold ${meta.color}`}>{meta.icon}{meta.label}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'itemName',
      header: 'Item',
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-xs text-slate-900 dark:text-white">{row.original.itemName || '—'}</p>
          <p className="font-mono text-[10px] text-slate-400">{row.original.itemCode}</p>
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => {
        const mov = row.original;
        const isIn = mov.type === 'goods_receipt';
        return (
          <span className={`font-mono font-extrabold text-sm ${isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isIn ? '+' : '−'}{mov.quantity}
          </span>
        );
      },
    },
    {
      accessorKey: 'totalCostUSD',
      header: 'Total Cost',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          {inventorySettings.currency} {row.original.totalCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'performedBy',
      header: 'Performed By',
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-semibold text-slate-900 dark:text-white">{row.original.performedBy || '—'}</p>
          <p className="text-[10px] text-slate-400">{row.original.date}</p>
        </div>
      ),
    },
    {
      accessorKey: 'referenceDocNumber',
      header: 'Reference',
      cell: ({ row }) => (
        <div>
          <p className="font-mono text-[11px] text-indigo-500">{row.original.referenceDocNumber || '—'}</p>
          {row.original.vendorSupplier && <p className="text-[10px] text-slate-400">{row.original.vendorSupplier}</p>}
        </div>
      ),
    },
  ], []);

  return (
    <>
      <EnterpriseModuleShell
        title="Inventory & Supply Chain ERP"
        description="Multi-warehouse stock management with GRN receiving, stock issue tracking, FIFO/WAC valuation, automatic COGS & inventory asset General Ledger postings."
        breadcrumbs={[{ label: 'School ERP' }, { label: 'Inventory' }]}
        icon={<Package className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
        recordCount={activeTab === 'items' ? filteredItems.length : filteredMovements.length}
        recordLabel={activeTab === 'items' ? 'Stock Items' : 'Movements'}
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
              onClick={() => setShowWarehouseModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border-none cursor-pointer"
            >
              <Warehouse className="w-3.5 h-3.5" /> Warehouses
            </button>
            <button
              onClick={() => setShowAddSKU(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border-none cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add SKU
            </button>
            <button
              onClick={() => setShowGRN(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm border-none cursor-pointer"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" /> Goods Receipt (GRN)
            </button>
          </div>
        }
      >
        <EnterpriseKPIDeck cards={kpiCards} />

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl self-start w-fit">
          {(['items', 'movements'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none capitalize ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'items' ? 'Stock Catalog' : 'Movement Log'}
            </button>
          ))}
        </div>

        <EnterpriseToolbar
          searchQuery={query}
          onSearchChange={setQuery}
          searchPlaceholder={activeTab === 'items' ? 'Search by SKU, item name, category, warehouse...' : 'Search by item, movement no., performed by...'}
          density={density}
          onDensityChange={setDensity}
          onRefresh={loadData}
        />

        {activeTab === 'items' ? (
          <EnterpriseDataGrid
            data={filteredItems}
            columns={itemColumns}
            isLoading={loading}
            density={density}
            onRowInspect={(row) => setInspectItem(row)}
          />
        ) : (
          <EnterpriseDataGrid
            data={filteredMovements}
            columns={movementColumns}
            isLoading={loading}
            density={density}
          />
        )}
      </EnterpriseModuleShell>

      {/* Modals */}
      {showGRN && (
        <GRNModal
          items={items}
          warehouses={warehouses}
          onClose={() => setShowGRN(false)}
          onSuccess={loadData}
          onOpenAddSKU={() => setShowAddSKU(true)}
          currency={inventorySettings.currency}
        />
      )}
      {showAddSKU && (
        <AddSKUModal
          warehouses={warehouses}
          onClose={() => setShowAddSKU(false)}
          onSuccess={loadData}
          onOpenWarehouseModal={() => setShowWarehouseModal(true)}
          currency={inventorySettings.currency}
        />
      )}
      {showWarehouseModal && (
        <WarehouseModal
          warehouses={warehouses}
          onClose={() => setShowWarehouseModal(false)}
          onSuccess={loadData}
        />
      )}
      {showSettingsModal && (
        <SettingsModal
          settings={inventorySettings}
          onClose={() => setShowSettingsModal(false)}
          onSave={(newSettings) => setInventorySettings(newSettings)}
        />
      )}
      {issueItem && (
        <IssueStockModal
          item={issueItem}
          onClose={() => setIssueItem(null)}
          onSuccess={loadData}
          currency={inventorySettings.currency}
        />
      )}
      {inspectItem && (
        <InspectDrawer
          item={inspectItem}
          onClose={() => setInspectItem(null)}
          onIssueStock={(item) => { setInspectItem(null); setIssueItem(item); }}
          currency={inventorySettings.currency}
        />
      )}
    </>
  );
}
