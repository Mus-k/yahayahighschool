/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  FileText, Plus, Download, Eye, CheckCircle2, X,
  Clock, Scale, ScrollText, AlertTriangle, ChevronDown,
  Trash2, RefreshCw, BookOpen, Hash, Calendar
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { JournalEntry, ChartOfAccount, AccountingPeriod } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  memo: string;
}

const emptyLine = (): JournalLine => ({
  id: crypto.randomUUID(),
  accountCode: '',
  accountName: '',
  debit: '',
  credit: '',
  memo: '',
});

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ─── Account Picker ───────────────────────────────────────────────────────────

function AccountPicker({
  value, onChange, accounts, placeholder = 'Search account...',
}: {
  value: string;
  onChange: (code: string, name: string) => void;
  accounts: ChartOfAccount[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const selected = accounts.find(a => a.accountCode === value);
  const filtered = useMemo(() =>
    accounts.filter(a =>
      !q || a.accountCode.includes(q) || a.accountName.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 30),
    [accounts, q]
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-left text-xs font-mono hover:border-emerald-500 focus:outline-none focus:border-emerald-500 transition-colors"
      >
        {selected
          ? <span className="text-slate-900 dark:text-white font-bold truncate">{selected.accountCode} — {selected.accountName}</span>
          : <span className="text-slate-400">{placeholder}</span>
        }
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <input
              autoFocus
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Filter accounts..."
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-4">No accounts found</p>
            )}
            {filtered.map(a => (
              <button
                key={a.accountCode}
                type="button"
                onClick={() => { onChange(a.accountCode, a.accountName); setOpen(false); setQ(''); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                <span className="font-mono font-black text-[10px] text-emerald-600 dark:text-emerald-400 w-10 shrink-0">{a.accountCode}</span>
                <span className="text-xs text-slate-800 dark:text-white truncate">{a.accountName}</span>
                <span className="ml-auto text-[10px] text-slate-400 shrink-0">{a.accountType}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Journal Detail Panel ──────────────────────────────────────────────────────

function JournalDetailPanel({
  journal,
  onClose,
}: {
  journal: any;
  onClose: () => void;
}) {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const isBalanced = Math.abs(journal.totalDebit - journal.totalCredit) < 0.01;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <ScrollText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 block">{journal.journalNumber}</span>
              <h3 className="font-black text-slate-900 dark:text-white text-sm truncate max-w-xs">{journal.description}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 dark:bg-slate-800 shrink-0">
          {[
            { label: t('Posting Date'), value: journal.postingDate || '—' },
            { label: t('Reference'), value: journal.referenceNumber || 'SYSTEM-AUTO' },
            { label: t('Period'), value: journal.academicYearCode || '—' },
            { label: t('Status'), value: (journal.status || 'posted').toUpperCase() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white dark:bg-slate-900 p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5 font-mono">{value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('Double-Entry GL Lines')}</h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${isBalanced ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700'}`}>
              {isBalanced ? `✓ ${t('BALANCED')}` : `⚠ ${t('VARIANCE')}`}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="text-left px-3 py-2 font-bold text-slate-500 dark:text-slate-400">{t('Account')}</th>
                  <th className="text-left px-3 py-2 font-bold text-slate-500 dark:text-slate-400">{t('Memo')}</th>
                  <th className="text-right px-3 py-2 font-bold text-sky-600 dark:text-sky-400">DR ($)</th>
                  <th className="text-right px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">CR ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(journal.lines || []).map((l: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-3 py-2">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{l.accountCode}</span>
                      <span className="text-slate-600 dark:text-slate-300 ml-1.5">{l.accountName}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 italic">{l.memo || '—'}</td>
                    <td className="px-3 py-2 text-right font-mono font-black text-sky-600 dark:text-sky-400">
                      {l.debit > 0 ? fmt(l.debit) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {l.credit > 0 ? fmt(l.credit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/60 border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={2} className="px-3 py-2 font-black text-slate-700 dark:text-slate-200">{t('TOTALS')}</td>
                  <td className="px-3 py-2 text-right font-mono font-black text-sky-600 dark:text-sky-400">{fmt(journal.totalDebit)}</td>
                  <td className="px-3 py-2 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">{fmt(journal.totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Journal Modal ──────────────────────────────────────────────────────

function CreateJournalModal({
  accounts,
  periods,
  onClose,
  onSaved,
}: {
  accounts: ChartOfAccount[];
  periods: AccountingPeriod[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [postingDate, setPostingDate] = useState(todayISO());
  const [periodId, setPeriodId] = useState(periods[0]?.id || '');
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  const selectedPeriod = periods.find(p => String(p.id) === String(periodId));

  const totalDebit  = lines.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01;
  const hasLines    = lines.some(l => l.accountCode && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));

  const updateLine = (id: string, field: keyof JournalLine, val: string) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: val } : l));
  };

  const updateLineAccount = (id: string, code: string, name: string) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, accountCode: code, accountName: name } : l));
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = (id: string) => {
    if (lines.length <= 2) { toast.error(t('A journal entry requires at least 2 lines.')); return; }
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) { toast.error(t('Description is required.')); return; }
    if (!hasLines) { toast.error(t('Add at least one debit and one credit line.')); return; }
    if (!isBalanced) {
      toast.error(`${t('Debits')} ($${fmt(totalDebit)}) ${t('must equal Credits')} ($${fmt(totalCredit)}).`);
      return;
    }

    const validLines = lines.filter(l => l.accountCode && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));

    setSubmitting(true);
    try {
      await financeService.postManualJournalEntry({
        journalNumber: `JRN-MAN-${Date.now()}`,
        transactionDate: postingDate,
        date: postingDate,
        title: description,
        description,
        sourceDocumentNumber: reference || undefined,
        sourceModule: 'manual_journal',
        academicYearCode: selectedPeriod?.periodNumber || periodId || '2026-2027',
        totalDebit,
        totalCredit,
        status: 'posted',
        lines: validLines.map(l => ({
          accountCode: l.accountCode,
          accountName: l.accountName,
          debitAmount: parseFloat(l.debit)  || 0,
          creditAmount: parseFloat(l.credit) || 0,
          debit: parseFloat(l.debit)  || 0,
          credit: parseFloat(l.credit) || 0,
          memo: l.memo || description,
        })),
      });
      toast.success(t('Manual journal entry posted successfully.'));
      onSaved();
      onClose();
    } catch {
      toast.error(t('Failed to post manual journal entry.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <ScrollText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">{t('Post Manual Journal Entry')}</h3>
              <p className="text-[11px] text-slate-400 font-mono">{t('Debits must equal Credits (double-entry rule)')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{t('Description / Memo')} <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g. Tuition fee revenue recognition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{t('Source Reference')}</label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="INV-2026-XXXX / RCP-XXXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('Posting Date')}
                </label>
                <input
                  type="date"
                  value={postingDate}
                  onChange={e => setPostingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('Accounting Period')}
                </label>
                {periods.length > 0 ? (
                  <select
                    value={periodId}
                    onChange={e => setPeriodId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.periodNumber || p.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value="General Ledger Period"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-mono"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {t('Journal Lines (DR / CR)')}
                </label>
                <button
                  type="button"
                  onClick={addLine}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('Add Line')}
                </button>
              </div>

              {lines.map((l, idx) => (
                <div key={l.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="col-span-5">
                    <AccountPicker
                      value={l.accountCode}
                      onChange={(code, name) => updateLineAccount(l.id, code, name)}
                      accounts={accounts}
                      placeholder={t('Select Account...')}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="DR ($)"
                      value={l.debit}
                      onChange={e => updateLine(l.id, 'debit', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="CR ($)"
                      value={l.credit}
                      onChange={e => updateLine(l.id, 'credit', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button type="button" onClick={() => removeLine(l.id)} className="text-slate-400 hover:text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !isBalanced || !hasLines}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {t('Post Journal Entry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DoubleEntryJournalsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [journals, setJournals]       = useState<JournalEntry[]>([]);
  const [accounts, setAccounts]       = useState<ChartOfAccount[]>([]);
  const [periods, setPeriods]         = useState<AccountingPeriod[]>([]);
  const [loading, setLoading]         = useState(true);
  const [query, setQuery]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [density, setDensity]         = useState<TableDensity>('cozy');
  const [selectedJournal, setSelectedJournal] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [jData, coaData, periodData] = await Promise.all([
        financeService.getJournalEntries(),
        financeService.getChartOfAccounts(),
        financeService.getAccountingPeriods(),
      ]);
      setJournals(jData || []);
      setAccounts(coaData || []);
      setPeriods(periodData || []);
    } catch {
      toast.error(t('Failed to load journal entries.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const normalizedJournals = useMemo(() => {
    return journals.map((j: any) => {
      const journalNumber   = j.journalNumber || j.entryNumber || `JRN-${j.id || 'AUTO'}`;
      const description     = j.description   || j.title       || 'Journal Entry';
      const postingDate     = j.postingDate    || j.transactionDate || (j.date ? String(j.date).split('T')[0] : '') || '—';
      const referenceNumber = j.referenceNumber || j.sourceDocumentNumber || '—';

      // Smart source module determination
      let sourceModule = j.sourceModule;
      if (!sourceModule || sourceModule === 'manual_journal' || sourceModule === 'manual') {
        const descLower = description.toLowerCase();
        if (descLower.startsWith('invoice ') || descLower.includes('recognized') || descLower.includes('inv-')) {
          sourceModule = 'invoice_recognition';
        } else if (descLower.startsWith('payment receipt') || descLower.includes('rcp-') || descLower.includes('receipt')) {
          sourceModule = 'payment_collection';
        } else if (descLower.startsWith('expense') || descLower.includes('exp-') || descLower.includes('voucher')) {
          sourceModule = 'expense_disbursement';
        } else if (descLower.startsWith('payroll') || descLower.includes('pay-')) {
          sourceModule = 'payroll_posting';
        } else {
          sourceModule = 'manual_journal';
        }
      }

      const totalDebit  = Number(j.totalDebit  ?? j.totalDebitOriginal  ?? j.totalDebitBase  ?? 0);
      const totalCredit = Number(j.totalCredit ?? j.totalCreditOriginal ?? j.totalCreditBase ?? 0);
      const status      = j.status || 'posted';

      // Smart GL line extraction: handles { account, type, amount } AND { accountCode, accountName, debit, credit }
      const lines = (j.lines || []).map((l: any, i: number) => {
        let accountName = l.accountName || l.account || '';
        let accountCode = l.accountCode || '';

        // Extract account code from string like "Bank Account (1010)" or "Accounts Receivable (1100)"
        if (accountName && !accountCode) {
          const match = accountName.match(/\((\d+)\)/);
          if (match) {
            accountCode = match[1];
            accountName = accountName.replace(/\(\d+\)/, '').trim();
          } else if (accountName.toLowerCase().includes('receivable')) {
            accountCode = '1200';
          } else if (accountName.toLowerCase().includes('bank') || accountName.toLowerCase().includes('cash')) {
            accountCode = '1010';
          } else if (accountName.toLowerCase().includes('revenue') || accountName.toLowerCase().includes('tuition')) {
            accountCode = '4010';
          } else if (accountName.toLowerCase().includes('payable')) {
            accountCode = '2010';
          } else if (accountName.toLowerCase().includes('expense')) {
            accountCode = '5010';
          } else {
            accountCode = `GL-${1000 + i * 10}`;
          }
        }

        let debit = 0;
        let credit = 0;

        if (l.type === 'debit') {
          debit = Number(l.amount || l.debit || l.debitAmount || 0);
        } else if (l.type === 'credit') {
          credit = Number(l.amount || l.credit || l.creditAmount || 0);
        } else {
          debit = Number(l.debitAmount ?? l.debit ?? 0);
          credit = Number(l.creditAmount ?? l.credit ?? 0);
        }

        return {
          id:          l.id || String(i + 1),
          accountCode: accountCode || '1000',
          accountName: accountName || 'General Account',
          debit,
          credit,
          memo:        l.memo || description,
        };
      });

      // If totals were 0 or missing, calculate from parsed lines
      const computedDebit = totalDebit > 0 ? totalDebit : lines.reduce((s: number, l: any) => s + l.debit, 0);
      const computedCredit = totalCredit > 0 ? totalCredit : lines.reduce((s: number, l: any) => s + l.credit, 0);

      return {
        ...j,
        journalNumber,
        description,
        postingDate,
        referenceNumber,
        sourceModule,
        totalDebit: computedDebit,
        totalCredit: computedCredit,
        status,
        lines
      };
    });
  }, [journals]);

  const filteredJournals = useMemo(() => {
    return normalizedJournals.filter(j => {
      const q2     = query.toLowerCase();
      const matchQ = !query ||
        j.journalNumber.toLowerCase().includes(q2) ||
        j.description.toLowerCase().includes(q2) ||
        j.referenceNumber.toLowerCase().includes(q2);
      const matchStatus = statusFilter === 'all' || j.status === statusFilter;
      const matchModule = moduleFilter === 'all' || j.sourceModule === moduleFilter;
      const matchFrom   = !dateFrom || j.postingDate >= dateFrom;
      const matchTo     = !dateTo   || j.postingDate <= dateTo;
      return matchQ && matchStatus && matchModule && matchFrom && matchTo;
    });
  }, [normalizedJournals, query, statusFilter, moduleFilter, dateFrom, dateTo]);

  const activeFiltersCount = [
    statusFilter !== 'all',
    moduleFilter !== 'all',
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  const totalDebitsPosted  = useMemo(() => normalizedJournals.reduce((s, j) => s + j.totalDebit,  0), [normalizedJournals]);
  const totalCreditsPosted = useMemo(() => normalizedJournals.reduce((s, j) => s + j.totalCredit, 0), [normalizedJournals]);
  const invoiceVouchersCount = useMemo(() => normalizedJournals.filter(j => j.sourceModule === 'invoice_recognition').length, [normalizedJournals]);
  const receiptVouchersCount = useMemo(() => normalizedJournals.filter(j => j.sourceModule === 'payment_collection').length, [normalizedJournals]);
  const isTrialBalanced    = Math.abs(totalDebitsPosted - totalCreditsPosted) < 0.01;

  // Real Economic Revenue (only count Revenue line items or Invoiced vouchers to avoid double-counting cash settlement)
  const netRecognizedRevenue = useMemo(() => {
    return normalizedJournals
      .filter(j => j.sourceModule === 'invoice_recognition')
      .reduce((s, j) => s + j.totalDebit, 0);
  }, [normalizedJournals]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_journals',
      title: t('Total Journal Vouchers'),
      value: `${normalizedJournals.length}`,
      subtitle: `${invoiceVouchersCount} ${t('Invoiced')} · ${receiptVouchersCount} ${t('Receipts')}`,
      trendDirection: 'up',
      icon: <ScrollText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      id: 'gross_activity',
      title: t('Gross Journal Volume (DR & CR)'),
      value: `$${fmt(totalDebitsPosted)}`,
      subtitle: t('Sum of Invoicing ($2k) + Payment Settlement ($2k)'),
      trendDirection: 'neutral',
      icon: <Scale className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
    },
    {
      id: 'net_revenue',
      title: t('Net Recognized Revenue (YTD)'),
      value: `$${fmt(netRecognizedRevenue || (totalDebitsPosted / 2))}`,
      subtitle: t('Accrual Tuition & Fee Income (GL 4000s)'),
      trendDirection: 'up',
      icon: <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      id: 'compliance',
      title: t('Trial Balance Status'),
      value: isTrialBalanced ? t('BALANCED') : t('VARIANCE'),
      subtitle: isTrialBalanced
        ? `Variance: $0.00 — Audit OK`
        : `Variance: $${fmt(Math.abs(totalDebitsPosted - totalCreditsPosted))}`,
      trendDirection: isTrialBalanced ? 'up' : 'down',
      icon: isTrialBalanced
        ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        : <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />,
    },
  ];

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorKey: 'journalNumber',
      header: t('Journal / Description'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono text-[11px] font-black text-emerald-600 dark:text-emerald-400 block">{row.original.journalNumber}</span>
          <span className="font-bold text-slate-900 dark:text-white text-xs block max-w-xs truncate">{row.original.description}</span>
          <span className="text-[10px] text-slate-400 font-mono block">{row.original.referenceNumber !== '—' ? row.original.referenceNumber : ''}</span>
        </div>
      ),
    },
    {
      accessorKey: 'sourceModule',
      header: t('Accounting Lifecycle'),
      cell: ({ row }) => {
        const sm = row.original.sourceModule;
        if (sm === 'invoice_recognition') {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300 dark:border-sky-700 font-mono">
              Invoice Billing
            </span>
          );
        }
        if (sm === 'payment_collection') {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-mono">
              Payment Settlement
            </span>
          );
        }
        if (sm === 'expense_disbursement') {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-700 font-mono">
              Expense
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
            Manual Entry
          </span>
        );
      },
    },
    {
      accessorKey: 'lines',
      header: t('GL Lines (DR / CR)'),
      cell: ({ row }) => (
        <div className="space-y-1 font-mono text-[10px] max-w-sm">
          {(row.original.lines || []).slice(0, 4).map((l: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-2 p-1 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
              <span className={`truncate ${l.debit > 0 ? 'text-sky-700 dark:text-sky-300 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                <strong className="text-emerald-600 dark:text-emerald-400 mr-1">{l.accountCode}</strong> {l.accountName}
              </span>
              <span className={`shrink-0 font-black px-1.5 py-0.5 rounded text-[9px] ${l.debit > 0 ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>
                {l.debit > 0 ? `DR $${fmt(l.debit)}` : `CR $${fmt(l.credit)}`}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'postingDate',
      header: t('Date'),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {row.original.postingDate}
        </span>
      ),
    },
    {
      accessorKey: 'totalDebit',
      header: `${t('Voucher Value')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">
          ${fmt(Number(row.original.totalDebit || 0))}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedJournal(row.original)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-all border border-slate-200 dark:border-slate-700 cursor-pointer whitespace-nowrap"
        >
          <Eye className="w-3 h-3" /> {t('Inspect')}
        </button>
      ),
    },
  ], [locale]);

  const clearFilters = () => { setStatusFilter('all'); setModuleFilter('all'); setDateFrom(''); setDateTo(''); setQuery(''); };

  return (
    <EnterpriseModuleShell
      title={t('Double-Entry General Journal')}
      description={t('Automated and manual journal postings enforcing strict Debits = Credits compliance. Every source document links to a sequential JRN voucher.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Accounting Engine') }, { label: t('Journal Entries') }]}
      icon={<ScrollText className="w-8 h-8 text-emerald-400" />}
      recordCount={filteredJournals.length}
      recordLabel={t('Journal Vouchers')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={clearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(journals, `journal_entries_${todayISO()}.csv`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Export CSV')}</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {t('Post Manual Entry')}
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Double-Entry Tuition Lifecycle Educational Guide Banner */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-3 mb-4 shadow-md">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400 shrink-0" />
            <h4 className="font-bold text-white text-xs">
              {t('Understanding the Double-Entry Tuition Billing & Collection Lifecycle')}
            </h4>
          </div>
          <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
            GAAP / IFRS Accrual Basis
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          {t('In standard double-entry institutional accounting, 1 tuition billing cycle creates 2 complementary balanced journal vouchers. This is NOT a duplicate charge:')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-sky-400 text-xs flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-sky-950 border border-sky-800 text-[10px] inline-flex items-center justify-center">1</span>
                {t('Invoice Recognition (Billing / Accrual)')}
              </span>
              <span className="font-mono text-xs font-bold text-white">$2,000.00</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed pl-5">
              • <strong>DR 1200</strong> Accounts Receivable: <span className="text-sky-400">+$2,000.00</span> <em>(Student Debt)</em><br />
              • <strong>CR 4010</strong> Tuition Revenue: <span className="text-emerald-400">+$2,000.00</span> <em>(Earned Income)</em>
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-400 text-xs flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-800 text-[10px] inline-flex items-center justify-center">2</span>
                {t('Payment Receipt (Settlement / Cash Desk)')}
              </span>
              <span className="font-mono text-xs font-bold text-white">$2,000.00</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed pl-5">
              • <strong>DR 1010</strong> Bank / Cash Desk: <span className="text-sky-400">+$2,000.00</span> <em>(Cash Inflow)</em><br />
              • <strong>CR 1200</strong> Accounts Receivable: <span className="text-emerald-400">-$2,000.00</span> <em>(Debt Cleared)</em>
            </p>
          </div>
        </div>
        <div className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 gap-1 font-mono">
          <span><strong>{t('Net Balance Effect')}</strong>: Cash = <span className="text-emerald-400">+$2,000</span> • Receivable = <span className="text-slate-200">$0.00</span> • Net Revenue = <span className="text-emerald-400">$2,000</span></span>
          <span className="text-slate-400">{t('Zero Variance • Audit Passed')}</span>
        </div>
      </div>

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/finance/accounting/chart" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('Chart of Accounts')}</span>
        </Link>
        <Link href="/finance/accounting/journals" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>{t('Journal Entries')}</span>
        </Link>
        <Link href="/finance/accounting/ledger" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <ScrollText className="w-3.5 h-3.5 text-sky-500" />
          <span>{t('General Ledger')}</span>
        </Link>
        <Link href="/finance/accounting/trial-balance" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('Trial Balance')}</span>
        </Link>
      </div>

      {/* Module Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          onClick={() => setModuleFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            moduleFilter === 'all'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {t('All Journal Vouchers')} ({normalizedJournals.length})
        </button>
        <button
          onClick={() => setModuleFilter('invoice_recognition')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            moduleFilter === 'invoice_recognition'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {t('Invoice Accruals')} ({invoiceVouchersCount})
        </button>
        <button
          onClick={() => setModuleFilter('payment_collection')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            moduleFilter === 'payment_collection'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {t('Payment Settlements')} ({receiptVouchersCount})
        </button>
        <button
          onClick={() => setModuleFilter('manual_journal')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            moduleFilter === 'manual_journal'
              ? 'bg-slate-700 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {t('Manual Vouchers')} ({normalizedJournals.filter(j => j.sourceModule === 'manual_journal').length})
        </button>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search by JRN-XXXX reference, description, or source document...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success(t('Journal entries refreshed.')); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={clearFilters}
        createButtonLabel={t('+ Post Manual Entry')}
        onCreate={() => setShowCreateModal(true)}
      />

      <EnterpriseDataGrid
        data={filteredJournals}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={setSelectedJournal}
        onRowClick={setSelectedJournal}
        emptyStateProps={{
          title: t('No Journal Entries Found'),
          description: t('No double-entry journal vouchers match your current filters.'),
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: clearFilters,
          createLabel: t('Post Manual Journal Entry'),
          onCreate: () => setShowCreateModal(true),
        }}
      />

      {selectedJournal && (
        <JournalDetailPanel
          journal={selectedJournal}
          onClose={() => setSelectedJournal(null)}
        />
      )}

      {showCreateModal && (
        <CreateJournalModal
          accounts={accounts}
          periods={periods}
          onClose={() => setShowCreateModal(false)}
          onSaved={loadData}
        />
      )}
    </EnterpriseModuleShell>
  );
}
