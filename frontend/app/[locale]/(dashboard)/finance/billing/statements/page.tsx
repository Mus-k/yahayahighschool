/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  FileText, Search, Printer, Download, Mail, ArrowLeft, RefreshCw,
  AlertTriangle, DollarSign, Calendar, Filter, User, BookOpen, CreditCard,
  FileSpreadsheet, CheckCircle2
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { Avatar } from '@/components/shared/Avatar';
import { generateStudentStatementPDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';

interface StatementTx {
  id: string | number;
  date: string;
  type: 'invoice' | 'payment' | 'wallet_deposit' | 'scholarship' | 'discount' | 'adjustment';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export default function StudentStatementsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [liveStudents, setLiveStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Ledger details
  const [invoices, setInvoices] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [walletTx, setWalletTx] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  useEffect(() => {
    erpService.getStudents().then(res => {
      const studentsList = res.data || [];
      setLiveStudents(studentsList);
      if (studentsList.length > 0 && !selectedStudent) {
        setSelectedStudent(studentsList[0]);
        setStudentSearch(studentsList[0].schoolId || studentsList[0].studentId || studentsList[0].name || '');
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedStudent) {
      setInvoices([]);
      setReceipts([]);
      setWalletTx([]);
      setLedgerEntries([]);
      return;
    }

    const sid = selectedStudent.id;
    setLoading(true);

    Promise.all([
      financeService.getInvoices().then(all =>
        all.filter((i: any) => i.student?.id === sid || i.studentId === selectedStudent.studentId || i.student?.schoolId === selectedStudent.schoolId)
      ),
      financeService.getReceipts().then(all =>
        all.filter((r: any) => r.student?.id === sid || r.studentId === selectedStudent.studentId || r.student?.schoolId === selectedStudent.schoolId)
      ),
      financeService.getStudentLedger(String(sid)),
      financeService.getStudentWalletTransactions(sid)
    ]).then(([invs, recs, ledg, wtx]) => {
      setInvoices(invs || []);
      setReceipts(recs || []);
      setLedgerEntries(ledg || []);
      setWalletTx(wtx || []);
      setLoading(false);
    }).catch(() => {
      toast.error(t('Failed to load financial records'));
      setLoading(false);
    });
  }, [selectedStudent]);

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setStudentSearch(student.schoolId || student.studentId || student.name || '');
  };

  const statementTransactions = useMemo(() => {
    if (ledgerEntries && ledgerEntries.length > 0) {
      const list: StatementTx[] = ledgerEntries.map(e => ({
        id: `ledg-${e.id}`,
        date: e.transactionDate ? e.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
        type: e.type === 'debit' ? 'invoice' : 'payment',
        reference: e.documentNumber || e.referenceId || 'LEDGER-REF',
        description: e.description || (e.type === 'debit' ? 'Invoice Debit' : 'Payment Credit'),
        debit: e.type === 'debit' ? Number(e.baseAmount || 0) : 0,
        credit: e.type !== 'debit' ? Number(e.baseAmount || 0) : 0,
        runningBalance: Number(e.runningBalance || 0)
      }));
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return list.filter(tx => {
        if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
        if (dateFrom && new Date(tx.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(tx.date) > new Date(dateTo)) return false;
        return true;
      });
    }

    const list: StatementTx[] = [];

    invoices.forEach(inv => {
      list.push({
        id: `inv-${inv.id}`,
        date: inv.issueDate ? inv.issueDate.split('T')[0] : new Date().toISOString().split('T')[0],
        type: 'invoice',
        reference: inv.invoiceNumber || `INV-2026-${inv.id}`,
        description: `${t('Invoice Charge')}: ${inv.invoiceNumber || t('Tuition Fee')}`,
        debit: Number(inv.totalAmount || 0),
        credit: 0,
        runningBalance: 0
      });
    });

    receipts.forEach(rec => {
      if (rec.paymentMethod === 'Advance Wallet') return;
      list.push({
        id: `rec-${rec.id}`,
        date: rec.paymentDate ? rec.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
        type: 'payment',
        reference: rec.receiptNumber || `RCP-2026-${rec.id}`,
        description: `${t('Payment Received')}: ${rec.receiptNumber || t('Cashier Payout')} (${rec.paymentMethod || 'Cash'})`,
        debit: 0,
        credit: Number(rec.paymentAmount || rec.amount || 0),
        runningBalance: 0
      });
    });

    walletTx.forEach(w => {
      if (w.transactionType === 'wallet_used') {
        list.push({
          id: `wtx-${w.id}`,
          date: w.transactionDate ? w.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
          type: 'wallet_deposit',
          reference: w.referenceNumber || 'WALLET-USE',
          description: `${t('Advance Wallet Credit Applied')}: ${w.reason || t('Tuition Settlement')}`,
          debit: 0,
          credit: Number(w.amount || 0),
          runningBalance: 0
        });
      }
    });

    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runBal = 0;
    list.forEach(tx => {
      runBal = runBal + tx.debit - tx.credit;
      tx.runningBalance = runBal;
    });

    return list.filter(tx => {
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
      if (dateFrom && new Date(tx.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(tx.date) > new Date(dateTo)) return false;
      return true;
    });
  }, [invoices, receipts, walletTx, ledgerEntries, txTypeFilter, dateFrom, dateTo, locale]);

  const totalDebits = useMemo(() => statementTransactions.reduce((sum, tx) => sum + tx.debit, 0), [statementTransactions]);
  const totalCredits = useMemo(() => statementTransactions.reduce((sum, tx) => sum + tx.credit, 0), [statementTransactions]);
  const closingBalance = useMemo(() => (statementTransactions[statementTransactions.length - 1]?.runningBalance || 0), [statementTransactions]);

  const handlePrintPDF = async () => {
    if (!selectedStudent) {
      toast.error(t('Please select a student profile first.'));
      return;
    }
    toast.info(`${t('Generating certified PDF statement for')} ${selectedStudent.name}...`);
    await generateStudentStatementPDF(selectedStudent, statementTransactions, academicYear);
    toast.success(t('Certified Statement PDF downloaded successfully!'));
  };

  const handleExportCSV = () => {
    if (!selectedStudent || statementTransactions.length === 0) {
      toast.error(t('No statement data available for export.'));
      return;
    }

    const studentId = selectedStudent.schoolId || selectedStudent.studentId || 'N/A';
    const lines = [
      `YAHAYASCOOL INSTITUTIONAL STATEMENT LEDGER`,
      `Student Name,${selectedStudent.name}`,
      `Student ID,${studentId}`,
      `Academic Year,${academicYear}`,
      `Date Generated,${new Date().toLocaleString('en-GB')}`,
      `Total Debits (Charges),$${totalDebits.toFixed(2)}`,
      `Total Credits (Payments),$${totalCredits.toFixed(2)}`,
      `Net Closing Balance Due,$${closingBalance.toFixed(2)}`,
      ``,
      `Date,Reference,Type,Description,Debit ($),Credit ($),Running Balance ($)`
    ];

    statementTransactions.forEach(tx => {
      lines.push(`"${tx.date}","${tx.reference}","${tx.type}","${tx.description.replace(/"/g, '""')}",${tx.debit.toFixed(2)},${tx.credit.toFixed(2)},${tx.runningBalance.toFixed(2)}`);
    });

    const csvString = lines.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `YAHAYASCOOL_Statement_${(selectedStudent.name || 'Student').replace(/\s+/g, '_')}_${studentId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(t('Statement CSV file downloaded successfully!'));
  };

  return (
    <EnterpriseModuleShell
      title={t('Student Financial Statements & Running Account Ledger')}
      description={t('Generate certified student billing statements, itemized fee breakdowns, advance wallet allocations, and official print exports.')}
      icon={<FileText className="w-8 h-8" />}
      breadcrumbs={[
        { label: t('Finance ERP'), href: '/finance' },
        { label: t('Billing Suite'), href: '/finance/billing/invoices' },
        { label: t('Statements') }
      ]}
    >
      <div className="space-y-6">
        {/* Student Selector Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-md w-full space-y-1">
              <label className="text-xs font-extrabold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                <User className="w-4 h-4 text-emerald-400" /> {t('Select Scholar Profile')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('Type student name or admission number...')}
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              </div>

              {studentSearch.length > 0 && liveStudents.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-slate-700 rounded-xl bg-slate-950 divide-y divide-slate-800 shadow-2xl mt-1 z-20">
                  {liveStudents
                    .filter(s =>
                      (s.name && s.name.toLowerCase().includes(studentSearch.toLowerCase())) ||
                      (s.schoolId && s.schoolId.toLowerCase().includes(studentSearch.toLowerCase())) ||
                      (s.studentId && s.studentId.toLowerCase().includes(studentSearch.toLowerCase()))
                    )
                    .map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectStudent(s)}
                        className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-800 ${
                          selectedStudent?.id === s.id ? 'bg-emerald-950/80 border-l-4 border-emerald-400 text-white font-bold' : 'text-slate-200'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-white block">{s.name}</span>
                          <span className="text-[11px] text-slate-400">{s.gradeLevel ? `Grade: ${s.gradeLevel}` : 'Assigned'}</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-extrabold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 text-[11px]">
                          {s.schoolId || s.studentId || 'N/A'}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {selectedStudent && (
              <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
                <button
                  onClick={handlePrintPDF}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition-all border border-slate-600 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>{t('Print Certified PDF')}</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition-all border border-slate-600 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{t('Export CSV')}</span>
                </button>
              </div>
            )}
          </div>

          {selectedStudent && (
            <div className="flex items-center gap-4 border-t border-slate-800 pt-4 animate-in fade-in">
              <Avatar src={selectedStudent.photo} name={selectedStudent.name} size="lg" className="border-2 border-emerald-500/40" />
              <div>
                <h3 className="text-base font-extrabold text-white">{selectedStudent.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-emerald-300 font-extrabold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    ID: {selectedStudent.schoolId || selectedStudent.studentId || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statement Summary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-400">{t('Total Invoiced Debits')}</p>
            <p className="text-xl font-mono font-black text-rose-400 mt-1">${totalDebits.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-400">{t('Total Settled Credits')}</p>
            <p className="text-xl font-mono font-black text-emerald-400 mt-1">${totalCredits.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-400">{t('Net Outstanding Balance')}</p>
            <p className={`text-xl font-mono font-black mt-1 ${closingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>${closingBalance.toFixed(2)}</p>
          </div>
        </div>

        {/* Statement Transactions Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">{t('Statement Ledger Lines')} ({statementTransactions.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">{t('Date')}</th>
                  <th className="px-4 py-3 text-left font-bold">{t('Reference #')}</th>
                  <th className="px-4 py-3 text-left font-bold">{t('Description')}</th>
                  <th className="px-4 py-3 text-right font-bold text-rose-400">{t('Debit')} ($)</th>
                  <th className="px-4 py-3 text-right font-bold text-emerald-400">{t('Credit')} ($)</th>
                  <th className="px-4 py-3 text-right font-bold">{t('Running Balance')} ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {statementTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-bold">{t('No transaction records found for this student.')}</td>
                  </tr>
                ) : (
                  statementTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-300">{tx.date}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">{tx.reference}</td>
                      <td className="px-4 py-3 font-medium text-white">{tx.description}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-400">{tx.debit > 0 ? `$${tx.debit.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">{tx.credit > 0 ? `$${tx.credit.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono font-black text-white">${tx.runningBalance.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </EnterpriseModuleShell>
  );
}
