'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Landmark, QrCode, TrendingDown, Plus, Eye, Calculator, Calendar, ShieldCheck, FileText,
  X, Barcode, MapPin, Building2, User, Settings, Trash2, CheckCircle2, AlertCircle, RefreshCw, DollarSign
} from 'lucide-react';
import { assetService } from '@/services/asset.service';
import type { FixedAsset, AssetCategory, DepreciationScheduleItem } from '@/types/enterprise.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

// ─── Helpers & Constants ──────────────────────────────────────────────────────

const ASSET_CATEGORIES: AssetCategory[] = [
  'Buildings & Facilities',
  'Furniture & Fixtures',
  'Vehicles & Transport',
  'IT & Computers',
  'Lab Equipment',
  'Printers & Office Supplies',
  'Network & Telecom',
];

function categoryColor(cat: AssetCategory) {
  const map: Record<string, string> = {
    'Buildings & Facilities': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    'Furniture & Fixtures': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    'Vehicles & Transport': 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    'IT & Computers': 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    'Lab Equipment': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    'Printers & Office Supplies': 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
    'Network & Telecom': 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  };
  return map[cat] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

// ─── Register Asset Modal ─────────────────────────────────────────────────────

function RegisterAssetModal({
  currency, onClose, onSuccess
}: {
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    category: 'IT & Computers' as AssetCategory,
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    salvageValue: '',
    usefulLifeYears: '5',
    depreciationMethod: 'Straight Line' as FixedAsset['depreciationMethod'],
    location: '',
    assignedDepartment: '',
    assignedStaffName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(form.purchaseCost);
    if (!cost || cost <= 0) {
      toast.error('Please enter a valid purchase cost.');
      return;
    }
    setLoading(true);
    try {
      await assetService.registerAsset({
        name: form.name,
        category: form.category,
        purchaseDate: form.purchaseDate,
        purchaseCostUSD: cost,
        salvageValueUSD: parseFloat(form.salvageValue) || 0,
        usefulLifeYears: parseInt(form.usefulLifeYears, 10) || 5,
        depreciationMethod: form.depreciationMethod,
        location: form.location,
        assignedDepartment: form.assignedDepartment,
        assignedStaffName: form.assignedStaffName,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to register asset.');
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
              <Landmark className="w-4 h-4 text-indigo-600" /> Register Fixed Asset
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Capitalize new institutional asset. Auto-posts GL 1500 Capitalization Journal.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Asset Name / Description *</label>
            <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Dell PowerEdge R750 Server or Science Spectrometer" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Asset Category *</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as AssetCategory }))} className={inp}>
              {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Purchase Date *</label>
            <input type="date" required value={form.purchaseDate} onChange={e => setForm(p => ({ ...p, purchaseDate: e.target.value }))} className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Purchase Cost ({currency}) *</label>
            <input type="number" min="0.01" step="0.01" required value={form.purchaseCost} onChange={e => setForm(p => ({ ...p, purchaseCost: e.target.value }))} placeholder="e.g. 5000.00" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Salvage Value ({currency})</label>
            <input type="number" min="0" step="0.01" value={form.salvageValue} onChange={e => setForm(p => ({ ...p, salvageValue: e.target.value }))} placeholder="e.g. 500.00" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Useful Life (Years) *</label>
            <input type="number" min="1" max="50" required value={form.usefulLifeYears} onChange={e => setForm(p => ({ ...p, usefulLifeYears: e.target.value }))} placeholder="e.g. 5" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Depreciation Method</label>
            <select value={form.depreciationMethod} onChange={e => setForm(p => ({ ...p, depreciationMethod: e.target.value as any }))} className={inp}>
              <option value="Straight Line">Straight Line</option>
              <option value="Declining Balance">Declining Balance</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Storage Location *</label>
            <input type="text" required value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Building C - Server Room 102" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Assigned Department</label>
            <input type="text" value={form.assignedDepartment} onChange={e => setForm(p => ({ ...p, assignedDepartment: e.target.value }))} placeholder="e.g. IT Operations" className={inp} />
          </div>

          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Custodian / Staff Name</label>
            <input type="text" value={form.assignedStaffName} onChange={e => setForm(p => ({ ...p, assignedStaffName: e.target.value }))} placeholder="e.g. Dr. Sarah Al-Hassan" className={inp} />
          </div>

          <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {loading ? 'Registering...' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Run Depreciation Modal ──────────────────────────────────────────────────

function RunDepreciationModal({
  asset, currency, onClose, onSuccess
}: {
  asset: FixedAsset;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const scheduleData = useMemo(() => {
    const depreciableBase = asset.purchaseCostUSD - asset.salvageValueUSD;
    const annualDep = depreciableBase / Math.max(1, asset.usefulLifeYears);
    const monthlyDep = Number((annualDep / 12).toFixed(2));

    const schedule: DepreciationScheduleItem[] = [];
    let currentBookValue = asset.purchaseCostUSD;
    let accumDep = 0;

    for (let yr = 1; yr <= asset.usefulLifeYears; yr++) {
      const depAmt = Number(annualDep.toFixed(2));
      accumDep += depAmt;
      currentBookValue -= depAmt;
      schedule.push({
        year: yr,
        periodName: `Year ${yr} (${2026 + yr - 1})`,
        beginningBookValueUSD: currentBookValue + depAmt,
        depreciationAmountUSD: depAmt,
        endingBookValueUSD: Math.max(asset.salvageValueUSD, currentBookValue),
        accumulatedDepreciationUSD: accumDep,
        isPosted: yr === 1
      });
    }

    return { schedule, monthlyDep };
  }, [asset]);

  const handleRunDepreciation = async () => {
    setLoading(true);
    try {
      await assetService.runDepreciationSchedule(asset);
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to run depreciation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" /> Depreciation Schedule & Posting
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{asset.assetTag} — {asset.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Asset Summary */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
            <div><p className="text-slate-400 font-bold uppercase text-[10px]">Cost</p><p className="font-extrabold text-slate-900 dark:text-white">{currency} {asset.purchaseCostUSD.toFixed(2)}</p></div>
            <div><p className="text-slate-400 font-bold uppercase text-[10px]">Book Value</p><p className="font-extrabold text-emerald-600 dark:text-emerald-400">{currency} {asset.currentBookValueUSD.toFixed(2)}</p></div>
            <div><p className="text-slate-400 font-bold uppercase text-[10px]">Monthly Dep</p><p className="font-extrabold text-indigo-600 dark:text-indigo-400">{currency} {scheduleData.monthlyDep.toFixed(2)}/mo</p></div>
            <div><p className="text-slate-400 font-bold uppercase text-[10px]">Life</p><p className="font-extrabold text-slate-900 dark:text-white">{asset.usefulLifeYears} Years</p></div>
          </div>

          {/* Schedule Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wide">Multi-Year Depreciation Schedule</h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5">Period</th>
                    <th className="p-2.5">Beg. Value</th>
                    <th className="p-2.5">Depreciation</th>
                    <th className="p-2.5">Ending Value</th>
                    <th className="p-2.5">Accum. Dep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {scheduleData.schedule.map(s => (
                    <tr key={s.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold font-sans">{s.periodName}</td>
                      <td className="p-2.5">{currency} {s.beginningBookValueUSD.toFixed(2)}</td>
                      <td className="p-2.5 text-amber-600 font-bold">−{currency} {s.depreciationAmountUSD.toFixed(2)}</td>
                      <td className="p-2.5 text-emerald-600 font-bold">{currency} {s.endingBookValueUSD.toFixed(2)}</td>
                      <td className="p-2.5 text-slate-500">{currency} {s.accumulatedDepreciationUSD.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
            <span>Clicking <strong>Post Monthly Depreciation</strong> will record 1 month's depreciation expense ({currency} {scheduleData.monthlyDep.toFixed(2)}) in Finance GL (Dr. 5030 Expense / Cr. 1500 Contra Asset) and update the book value.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer">Cancel</button>
            <button type="button" onClick={handleRunDepreciation} disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              {loading ? 'Posting Journal...' : 'Post Monthly Depreciation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inspect Asset Drawer ─────────────────────────────────────────────────────

function InspectAssetDrawer({
  asset, currency, onClose, onRunDep, onDelete
}: {
  asset: FixedAsset;
  currency: string;
  onClose: () => void;
  onRunDep: (asset: FixedAsset) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="space-y-1">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryColor(asset.category)}`}>{asset.category}</span>
            <h3 className="font-black text-slate-900 dark:text-white text-sm leading-snug">{asset.name}</h3>
            <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{asset.assetTag}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Tag & Barcode Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Asset Tag & Barcode</p>
                <p className="font-mono font-extrabold text-sm">{asset.assetTag}</p>
              </div>
              <StatusBadge status={asset.status} size="sm" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="font-mono text-slate-300 flex items-center gap-1"><Barcode className="w-3.5 h-3.5 text-indigo-400" /> {asset.barcode}</span>
              <span className="text-[11px] text-slate-400">Purchased: {asset.purchaseDate}</span>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: `Purchase Cost (${currency})`, value: `${currency} ${asset.purchaseCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
              { label: `Net Book Value (${currency})`, value: `${currency} ${asset.currentBookValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, highlight: true },
              { label: 'Accumulated Depreciation', value: `${currency} ${asset.accumulatedDepreciationUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
              { label: 'Salvage Value', value: `${currency} ${asset.salvageValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
              { label: 'Useful Life', value: `${asset.usefulLifeYears} Years` },
              { label: 'Method', value: asset.depreciationMethod },
            ].map((m, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{m.label}</p>
                <p className={`text-xs font-extrabold ${m.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Location & Custodian */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2 text-xs">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-indigo-500" /> Location & Assignment</p>
            <p className="font-bold text-slate-900 dark:text-white">{asset.location}</p>
            {asset.assignedDepartment && <p className="text-slate-500">Department: <strong>{asset.assignedDepartment}</strong></p>}
            {asset.assignedStaffName && <p className="text-slate-500">Custodian: <strong>{asset.assignedStaffName}</strong></p>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => { onClose(); onRunDep(asset); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" /> Run Depreciation
            </button>
            <button
              onClick={() => { onClose(); onDelete(asset.id); }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800/40 cursor-pointer"
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
    localStorage.setItem('assetSettings', JSON.stringify(form));
    toast.success('Asset ERP settings saved.');
    onClose();
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" /> Asset ERP Settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure currency display for asset register & valuation.</p>
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
              list="asset-currencies"
              value={form.currency}
              onChange={e => setForm(p => ({ ...p, currency: e.target.value.toUpperCase() }))}
              placeholder="e.g. USD, GNF, LD, NGN"
              className={inp}
            />
            <datalist id="asset-currencies">
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

export default function AssetManagementPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [depreciationAsset, setDepreciationAsset] = useState<FixedAsset | null>(null);
  const [inspectAsset, setInspectAsset] = useState<FixedAsset | null>(null);

  // Settings persisted in localStorage
  const [assetSettings, setAssetSettings] = useState({ currency: 'USD' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assetService.getAssets();
      setAssets(data);
    } catch {
      toast.error('Failed to load fixed asset register.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    try {
      const stored = localStorage.getItem('assetSettings');
      if (stored) {
        setAssetSettings(JSON.parse(stored));
      }
    } catch { }
  }, [loadData]);

  const filteredAssets = useMemo(() => {
    if (!query) return assets;
    const q = query.toLowerCase();
    return assets.filter(asset =>
      asset.name.toLowerCase().includes(q) ||
      asset.assetTag.toLowerCase().includes(q) ||
      asset.category.toLowerCase().includes(q) ||
      asset.location.toLowerCase().includes(q)
    );
  }, [assets, query]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    const totalCount = assets.length;
    const totalCost = assets.reduce((sum, a) => sum + a.purchaseCostUSD, 0);
    const totalBookValue = assets.reduce((sum, a) => sum + a.currentBookValueUSD, 0);
    const totalAccumDep = assets.reduce((sum, a) => sum + a.accumulatedDepreciationUSD, 0);
    const cur = assetSettings.currency;

    return [
      {
        id: 'total_assets',
        title: 'Fixed Asset Register',
        value: `${totalCount} Tagged Assets`,
        subtitle: 'Buildings, IT, Vehicles, & Science Labs',
        trendDirection: 'up',
        icon: <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        id: 'purchase_cost',
        title: 'Original Asset Cost (Series 1500)',
        value: `${cur} ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: 'Capitalized in Finance General Ledger',
        trendDirection: 'up',
        icon: <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      },
      {
        id: 'book_value',
        title: 'Net Book Value (NBV)',
        value: `${cur} ${totalBookValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: 'Current Net Carrying Value on Balance Sheet',
        trendDirection: 'neutral',
        icon: <ShieldCheck className="w-5 h-5 text-sky-500" />
      },
      {
        id: 'accum_depreciation',
        title: 'Accumulated Depreciation',
        value: `${cur} ${totalAccumDep.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: 'Monthly Depreciation GL Posting (GL 5030)',
        trendDirection: 'down',
        icon: <TrendingDown className="w-5 h-5 text-amber-500" />
      }
    ];
  }, [assets, assetSettings]);

  const columns = useMemo<ColumnDef<FixedAsset, any>[]>(() => {
    const cur = assetSettings.currency;
    return [
      {
        accessorKey: 'assetTag',
        header: 'Asset Tag & Name',
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{a.assetTag}</span>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors text-xs sm:text-sm max-w-sm truncate">
                {a.name}
              </p>
              <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold ${categoryColor(a.category)}`}>{a.category}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'location',
        header: 'Location & Department',
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-white text-xs block">{row.original.location}</span>
            <span className="text-[11px] text-slate-500">{row.original.assignedDepartment || 'General Campus'}</span>
          </div>
        )
      },
      {
        accessorKey: 'purchaseCostUSD',
        header: `Purchase Cost (${cur})`,
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white block">{cur} {row.original.purchaseCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="font-mono text-[11px] text-slate-500">{row.original.purchaseDate}</span>
          </div>
        )
      },
      {
        accessorKey: 'currentBookValueUSD',
        header: `Net Book Value (${cur})`,
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">{cur} {row.original.currentBookValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-[11px] text-slate-500">Dep: {cur} {row.original.accumulatedDepreciationUSD.toFixed(2)}</span>
          </div>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectAsset(a);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                Inspect
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDepreciationAsset(a);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs cursor-pointer border-none"
              >
                <Calculator className="w-3.5 h-3.5 inline mr-1" />
                Run Dep
              </button>
            </div>
          );
        }
      }
    ];
  }, [assetSettings]);

  const handleDeleteAsset = async (id: string) => {
    try {
      await assetService.deleteAsset(id);
      loadData();
    } catch {
      toast.error('Failed to delete asset.');
    }
  };

  return (
    <>
      <EnterpriseModuleShell
        title="Fixed Asset Management ERP"
        description="Enterprise fixed asset register, QR/Barcode tagging, life-cycle tracking, location assignments, and automated monthly depreciation journal postings."
        breadcrumbs={[{ label: 'School ERP' }, { label: 'Fixed Assets' }]}
        icon={<Landmark className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
        recordCount={filteredAssets.length}
        recordLabel="Fixed Assets"
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
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm border-none cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Register Asset</span>
            </button>
          </div>
        }
      >
        <EnterpriseKPIDeck cards={kpiCards} />

        <EnterpriseToolbar
          searchQuery={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search fixed assets by asset tag, name, category, location..."
          density={density}
          onDensityChange={setDensity}
          onRefresh={loadData}
        />

        <EnterpriseDataGrid
          data={filteredAssets}
          columns={columns}
          isLoading={loading}
          density={density}
          onRowInspect={(row) => setInspectAsset(row)}
        />
      </EnterpriseModuleShell>

      {/* Modals */}
      {showRegisterModal && (
        <RegisterAssetModal
          currency={assetSettings.currency}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={loadData}
        />
      )}
      {showSettingsModal && (
        <SettingsModal
          settings={assetSettings}
          onClose={() => setShowSettingsModal(false)}
          onSave={(newSettings) => setAssetSettings(newSettings)}
        />
      )}
      {depreciationAsset && (
        <RunDepreciationModal
          asset={depreciationAsset}
          currency={assetSettings.currency}
          onClose={() => setDepreciationAsset(null)}
          onSuccess={loadData}
        />
      )}
      {inspectAsset && (
        <InspectAssetDrawer
          asset={inspectAsset}
          currency={assetSettings.currency}
          onClose={() => setInspectAsset(null)}
          onRunDep={(asset) => setDepreciationAsset(asset)}
          onDelete={handleDeleteAsset}
        />
      )}
    </>
  );
}
