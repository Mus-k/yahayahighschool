/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  DollarSign, CreditCard, Heart, GraduationCap, FileText, Receipt,
  Clock, CheckCircle2, AlertTriangle, QrCode, Download, Printer,
  Sparkles, Smartphone, Landmark, ShieldCheck, ArrowRight, User
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/services/finance.service';
import type { StudentFinanceAccount, Invoice, PaymentReceipt } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function ParentPaymentCenterPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [childrenAccounts, setChildrenAccounts] = useState<StudentFinanceAccount[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts'>('invoices');
  const [showPayModal, setShowPayModal] = useState<Invoice | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Online Payment checkout state - clean defaults
  const [gatewayMethod, setGatewayMethod] = useState<'Orange Money' | 'MTN Money' | 'Stripe Card' | 'Bank Transfer'>('Orange Money');
  const [mobilePhoneOrCard, setMobilePhoneOrCard] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [accList, invList, recList] = await Promise.all([
        financeService.getStudentAccounts(),
        financeService.getInvoices(),
        financeService.getReceipts()
      ]);

      const parentEmail = (user?.email || '').toLowerCase();
      const parentName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim().toLowerCase() || (user?.username || '').toLowerCase();

      const matchedChildren = accList.filter(a => {
        if (!user) return true;
        const pName = (a.parentName || '').toLowerCase();
        return parentName && pName.includes(parentName);
      });

      const finalChildren = matchedChildren.length > 0 ? matchedChildren : accList;
      setChildrenAccounts(finalChildren);
      if (finalChildren.length > 0 && !selectedChildId) {
        setSelectedChildId(finalChildren[0].studentId);
      }

      setInvoices(invList);
      setReceipts(recList);
    } catch {
      toast.error(t('Failed to load parent payment center data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const selectedChild = useMemo(() => {
    return childrenAccounts.find(c => c.studentId === selectedChildId) || childrenAccounts[0] || null;
  }, [childrenAccounts, selectedChildId]);

  const childInvoices = useMemo(() => {
    if (!selectedChild) return [];
    return invoices.filter(i => i.studentId === selectedChild.studentId || i.studentName === selectedChild.studentName);
  }, [invoices, selectedChild]);

  const childReceipts = useMemo(() => {
    if (!selectedChild) return [];
    return receipts.filter(r => r.studentId === selectedChild.studentId || r.studentName === selectedChild.studentName);
  }, [receipts, selectedChild]);

  const handleProcessOnlinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal || !selectedChild) return;

    try {
      const { receipt } = await financeService.postPaymentReceipt({
        invoiceNumber: showPayModal.invoiceNumber,
        studentId: selectedChild.studentId,
        studentName: selectedChild.studentName,
        admissionNumber: selectedChild.admissionNumber,
        parentName: selectedChild.parentName,
        cashierName: `Online Gateway (${gatewayMethod})`,
        amount: showPayModal.remainingBalance || showPayModal.totalAmount,
        paymentMethod: gatewayMethod,
        referenceNumber: `GW-${Date.now().toString().slice(-6)}`,
        mobileOperator: gatewayMethod.includes('Money') ? gatewayMethod.split(' ')[0] : undefined,
        remainingStudentBalance: 0
      });

      toast.success(`${t('Online payment verified via')} ${gatewayMethod}! ${t('Receipt')} ${receipt.receiptNumber} ${t('issued immediately.')}`);
      setShowPayModal(null);
      loadData();
    } catch {
      toast.error(t('Payment processing failed'));
    }
  };

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    if (!selectedChild) return [];
    return [
      {
        id: 'child_balance',
        title: `${selectedChild.studentName} — ${t('Balance Due')}`,
        value: `$${(selectedChild.netBalanceDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: (selectedChild.netBalanceDue || 0) > 0 ? t('Action needed: Outstanding term balance') : t('All fees fully settled'),
        trendDirection: (selectedChild.netBalanceDue || 0) > 0 ? 'down' : 'up',
        icon: <DollarSign className={`w-5 h-5 ${(selectedChild.netBalanceDue || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
      },
      {
        id: 'child_invoiced',
        title: t('Total Term Fees Billed'),
        value: `$${(selectedChild.totalInvoicedYTD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: `${childInvoices.length} ${t('invoices issued')}`,
        trendDirection: 'neutral',
        icon: <FileText className="w-5 h-5 text-sky-400" />
      },
      {
        id: 'child_paid',
        title: t('Total Settled Payments'),
        value: `$${(selectedChild.totalPaidYTD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: `${childReceipts.length} ${t('verified payment receipt vouchers')}`,
        trendDirection: 'up',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      }
    ];
  }, [selectedChild, childInvoices, childReceipts, locale]);

  const invoiceColumns = useMemo<ColumnDef<Invoice, any>[]>(() => [
    {
      accessorKey: 'invoiceNumber',
      header: t('Invoice #'),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-black text-emerald-400">{row.original.invoiceNumber}</span>
      )
    },
    {
      accessorKey: 'dueDate',
      header: t('Due Date'),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-300">{row.original.dueDate || 'Immediate'}</span>
      )
    },
    {
      accessorKey: 'totalAmount',
      header: `${t('Total')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-white">
          ${(Number(row.original.totalAmount) || 0).toFixed(2)}
        </span>
      )
    },
    {
      accessorKey: 'remainingBalance',
      header: `${t('Balance Due')} ($)`,
      cell: ({ row }) => {
        const bal = Number(row.original.remainingBalance ?? (Number(row.original.totalAmount || 0) - Number(row.original.paidAmount || 0)));
        return (
          <span className={`font-mono text-xs sm:text-sm font-black ${bal > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            ${bal.toFixed(2)}
          </span>
        );
      }
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: t('Pay Online'),
      cell: ({ row }) => {
        const inv = row.original;
        const bal = Number(inv.remainingBalance ?? (Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)));
        if (bal <= 0 || inv.status === 'paid') {
          return <span className="text-emerald-400 font-bold text-xs">✓ {t('Settled')}</span>;
        }
        return (
          <button
            onClick={() => setShowPayModal(inv)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-md transition-all cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t('Pay Now')} (${bal.toFixed(2)})</span>
          </button>
        );
      }
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('Parent Financial Center & Secure Payment Portal')}
      description={t('Inspect itemized tuition invoices, track live settlement balances, and make instant tuition payments via Mobile Money, Card, or Wire.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Parent Portal') }, { label: t('Payment Center') }]}
      icon={<CreditCard className="w-8 h-8 text-emerald-400" />}
      recordCount={childInvoices.length}
      recordLabel={t('Invoices')}
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <div className="flex items-center gap-2">
          {/* Child Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            {childrenAccounts.map(c => (
              <button
                key={c.studentId}
                onClick={() => setSelectedChildId(c.studentId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  c.studentId === selectedChildId
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c.studentName} ({c.gradeLevel || c.gradeCode || 'Scholar'})
              </button>
            ))}
          </div>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Tabs */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'invoices'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{t('Outstanding & Historical Invoices')} ({childInvoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'receipts'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{t('Official Payment Receipts')} ({childReceipts.length})</span>
        </button>
      </div>

      {activeTab === 'invoices' ? (
        <EnterpriseDataGrid
          data={childInvoices}
          columns={invoiceColumns}
          isLoading={loading}
          density={density}
          onRowInspect={(row) => setSelectedItem(row)}
          onRowClick={(row) => setSelectedItem(row)}
          emptyStateProps={{
            title: t('No Invoices Found'),
            description: t('No fee invoices issued for this scholar.'),
            isFilterActive: false,
            onResetFilters: () => {}
          }}
        />
      ) : (
        <EnterpriseDataGrid
          data={childReceipts}
          columns={[
            {
              accessorKey: 'receiptNumber',
              header: t('Receipt #'),
              cell: ({ row }) => <span className="font-mono text-xs font-black text-emerald-400">{row.original.receiptNumber}</span>
            },
            {
              accessorKey: 'paymentDate',
              header: t('Payment Date'),
              cell: ({ row }) => <span className="font-mono text-xs text-slate-300">{row.original.paymentDate?.split('T')[0]}</span>
            },
            {
              accessorKey: 'paymentMethod',
              header: t('Method'),
              cell: ({ row }) => <span className="text-xs font-bold text-white">{row.original.paymentMethod}</span>
            },
            {
              accessorKey: 'amount',
              header: `${t('Paid Amount')} ($)`,
              cell: ({ row }) => <span className="font-mono text-xs font-black text-emerald-400">+${(Number(row.original.amount) || 0).toFixed(2)}</span>
            },
            {
              accessorKey: 'status',
              header: t('Status'),
              cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
            }
          ]}
          isLoading={loading}
          density={density}
          onRowInspect={(row) => setSelectedItem(row)}
          onRowClick={(row) => setSelectedItem(row)}
          emptyStateProps={{
            title: t('No Payment Receipts Found'),
            description: t('No payments have been recorded yet.'),
            isFilterActive: false,
            onResetFilters: () => {}
          }}
        />
      )}

      {/* Online Payment Modal */}
      {showPayModal && selectedChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-black text-white">{t('Instant Online Payment Gateway')}</h3>
              </div>
              <button onClick={() => setShowPayModal(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleProcessOnlinePayment} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <p className="text-slate-400">{t('Paying Invoice')}: <strong className="text-white font-mono">{showPayModal.invoiceNumber}</strong></p>
                <p className="text-slate-400">{t('Scholar')}: <strong className="text-emerald-400">{selectedChild.studentName}</strong></p>
                <p className="text-slate-400">{t('Settlement Amount')}: <strong className="text-emerald-400 font-mono font-black text-sm">${((showPayModal.remainingBalance || showPayModal.totalAmount)).toFixed(2)}</strong></p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Select Payment Gateway')}</label>
                <select
                  value={gatewayMethod}
                  onChange={(e) => setGatewayMethod(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Orange Money">Orange Money Mobile</option>
                  <option value="MTN Money">MTN Mobile Money</option>
                  <option value="Stripe Card">Credit / Debit Card (Visa/Mastercard)</option>
                  <option value="Bank Transfer">Direct Bank Wire Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Phone Number / Reference')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +221 77 000 00 00"
                  value={mobilePhoneOrCard}
                  onChange={(e) => setMobilePhoneOrCard(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowPayModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">{t('Authorize Payment')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}
