/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  ScrollText, Search, Filter, Download, Printer, AlertTriangle,
  CheckCircle2, Clock, DollarSign, FileText, Receipt, User,
  Mail, Phone, ShieldAlert, ArrowRight, Sparkles, Building2, Eye
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { StudentFinanceAccount, StudentLedgerEntry } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function StudentRunningLedgerPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [accounts, setAccounts] = useState<StudentFinanceAccount[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [ledgerEntries, setLedgerEntries] = useState<StudentLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedEntry, setSelectedEntry] = useState<StudentLedgerEntry | null>(null);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const accList = await financeService.getStudentAccounts();
      setAccounts(accList);
      if (accList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(accList[0].studentId);
      }
    } catch {
      toast.error(t('Failed to load student finance accounts.'));
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async (stuId: string) => {
    setLoading(true);
    try {
      const entries = await financeService.getStudentLedger(stuId);
      setLedgerEntries(entries);
    } catch {
      toast.error(t('Failed to load student ledger entries.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadLedger(selectedStudentId);
    }
  }, [selectedStudentId]);

  const currentAccount = useMemo(() => {
    return accounts.find(a => a.studentId === selectedStudentId) || accounts[0] || null;
  }, [accounts, selectedStudentId]);

  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter(e => {
      if (!query) return true;
      return (e.documentNumber || '').toLowerCase().includes(query.toLowerCase()) ||
        (e.description || '').toLowerCase().includes(query.toLowerCase());
    });
  }, [ledgerEntries, query]);

  const handleClearFilters = () => {
    setQuery('');
    toast.success(t('Ledger query cleared.'));
  };

  const toggleFinancialHold = async () => {
    if (!currentAccount) return;
    currentAccount.financialHold = !currentAccount.financialHold;
    if (currentAccount.financialHold) {
      currentAccount.holdReasons = ['report_cards', 'certificates'];
      toast.warning(`${t('Financial Hold ENABLED for')} ${currentAccount.studentName}.`);
    } else {
      currentAccount.holdReasons = [];
      toast.success(`${t('Financial Hold RELEASED for')} ${currentAccount.studentName}.`);
    }
    setAccounts([...accounts]);
  };

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    if (!currentAccount) return [];
    return [
      {
        id: 'net_balance',
        title: t('Running Net Account Balance'),
        value: currentAccount.netBalance < 0 
          ? `-$${Math.abs(currentAccount.netBalance).toFixed(2)} (${t('Credit')})` 
          : `$${(Number(currentAccount.netBalance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: currentAccount.netBalance <= 0 ? t('Account fully settled / in credit') : t('Outstanding balance due'),
        trendDirection: currentAccount.netBalance <= 0 ? 'up' : 'down',
        icon: <DollarSign className={`w-5 h-5 ${currentAccount.netBalance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />,
        onClick: () => toast.info(`${t('Account status for')} ${currentAccount.studentName}`)
      },
      {
        id: 'invoiced',
        title: t('Total Cumulative Invoiced'),
        value: `$${(Number(currentAccount.totalInvoiced) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: `${t('Academic Year')} ${currentAccount.academicYearCode}`,
        trendDirection: 'neutral',
        icon: <FileText className="w-5 h-5 text-sky-400" />
      },
      {
        id: 'paid',
        title: t('Total Cumulative Receipts'),
        value: `$${(Number(currentAccount.totalPaid) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: `${Math.round(((Number(currentAccount.totalPaid) || 0) / (Number(currentAccount.totalInvoiced) || 1)) * 100)}% ${t('settlement collection rate')}`,
        trendDirection: 'up',
        icon: <Receipt className="w-5 h-5 text-emerald-400" />
      },
      {
        id: 'hold_status',
        title: t('Institutional Hold Guard'),
        value: currentAccount.financialHold ? t('HOLD ACTIVE') : t('NO HOLDS'),
        subtitle: currentAccount.financialHold ? t('Restricted: Report cards & certificates') : t('Full academic privileges enabled'),
        trendDirection: currentAccount.financialHold ? 'down' : 'up',
        icon: currentAccount.financialHold ? <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        onClick: toggleFinancialHold
      }
    ];
  }, [currentAccount, locale]);

  const columns = useMemo<ColumnDef<StudentLedgerEntry, any>[]>(() => [
    {
      accessorKey: 'documentNumber',
      header: t('Document Ref & Date'),
      cell: ({ row }) => {
        const e = row.original;
        const isDebit = e.type === 'debit';
        return (
          <div className="space-y-0.5 font-mono">
            <span className={`text-xs font-black block ${isDebit ? 'text-sky-400' : 'text-emerald-400'}`}>{e.documentNumber}</span>
            <span className="text-[11px] text-slate-400 block">{e.transactionDate}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'type',
      header: t('Posting Type'),
      cell: ({ row }) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase ${
          row.original.type === 'debit'
            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          {row.original.type === 'debit' ? `▲ ${t('Debit (Charge)')}` : `▼ ${t('Credit (Payment)')}`}
        </span>
      )
    },
    {
      accessorKey: 'description',
      header: t('Itemized Description & Memo'),
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-bold text-white block max-w-md truncate">{row.original.description}</span>
          <span className="text-[11px] text-slate-400 block font-mono">{t('Posted by')}: {row.original.postedBy}</span>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: `${t('Transaction Amount')} ($)`,
      cell: ({ row }) => {
        const e = row.original;
        const isDebit = e.type === 'debit';
        return (
          <span className={`font-mono text-xs sm:text-sm font-black ${isDebit ? 'text-sky-400' : 'text-emerald-400'}`}>
            {isDebit ? '+' : '-'}${(Number(e.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      accessorKey: 'runningBalance',
      header: `${t('Running Balance')} ($)`,
      cell: ({ row }) => {
        const bal = Number(row.original.runningBalance) || 0;
        return (
          <span className={`font-mono text-xs sm:text-sm font-black ${bal <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            ${bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: t('Inspect'),
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEntry(row.original);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t('Voucher')}</span>
        </button>
      )
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('Student Financial Ledger & Running Account Statement')}
      description={t('Interactive double-entry account statement viewable per scholar. Monitors every debit invoice and credit payment with automated running balances and institutional financial hold enforcements.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Billing Suite') }, { label: t('Running Ledger') }]}
      icon={<ScrollText className="w-8 h-8" />}
      recordCount={filteredEntries.length}
      recordLabel={t('Ledger Rows')}
      activeFilterCount={query ? 1 : 0}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          {/* Scholar Account Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-400">{t('Select Scholar')}:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
              }}
              aria-label="Select Scholar Account"
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              {accounts.map(acc => (
                <option key={acc.studentId} value={acc.studentId} className="bg-slate-900">
                  {acc.studentName} ({acc.admissionNumber})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => financeService.exportToCSV(ledgerEntries, `ledger_${selectedStudentId}.csv`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('Export Ledger CSV')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Student Invoices')}</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Payment Desk & POS')}</span>
        </Link>
        <Link href="/finance/billing/ledger" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <ScrollText className="w-3.5 h-3.5" />
          <span>{t('Running Ledger')}</span>
        </Link>
        <Link href="/finance/billing/statements" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('Student Statements')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search ledger rows by voucher number or description...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          if (selectedStudentId) loadLedger(selectedStudentId);
          toast.success(t('Student ledger refreshed'));
        }}
        activeFilterCount={query ? 1 : 0}
        onResetFilters={handleClearFilters}
      />

      <EnterpriseDataGrid
        data={filteredEntries}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedEntry(row)}
        onRowClick={(row) => setSelectedEntry(row)}
        emptyStateProps={{
          title: t('No Ledger Entries Found'),
          description: t('No debit or credit postings match your query for this scholar.'),
          isFilterActive: query.length > 0,
          onResetFilters: handleClearFilters
        }}
      />

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        record={selectedEntry ? {
          name: selectedEntry.description,
          id: selectedEntry.documentNumber,
          role: `SCHOLAR: ${currentAccount?.studentName || 'Student'} (${currentAccount?.admissionNumber || 'N/A'})`,
          status: selectedEntry.type === 'debit' ? 'charge' : 'payment',
          email: `Transaction Date: ${selectedEntry.transactionDate}`,
          phone: `Posted by: ${selectedEntry.postedBy}`,
          department: `Type: ${selectedEntry.type.toUpperCase()}`,
          joinDate: selectedEntry.transactionDate,
          balance: `AMOUNT: $${(Number(selectedEntry.amount) || 0).toFixed(2)} | RUNNING BAL: $${(Number(selectedEntry.runningBalance) || 0).toFixed(2)}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}
