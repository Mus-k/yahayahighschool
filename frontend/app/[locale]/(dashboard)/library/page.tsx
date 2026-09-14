'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, BookCheck, QrCode, Plus, Eye, RotateCcw, AlertTriangle, FileText,
  X, User, Calendar, Barcode, MapPin, Tag, Hash, Clock, Printer, ShieldCheck,
  BookMarked, DollarSign, CheckCircle2, XCircle, Settings, RefreshCw
} from 'lucide-react';
import { libraryService } from '@/services/library.service';
import { financeService } from '@/services/finance.service';
import { apiClient } from '@/services/api.service';
import type { LibraryBook, LibraryBorrowRecord } from '@/types/enterprise.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryColor(cat?: string) {
  const map: Record<string, string> = {
    'Islamic Studies': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    'STEM & Sciences': 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    'Languages': 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    'Literature': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    'History': 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    'General Reference': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
  return map[cat || ''] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

function fmtDate(d?: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function daysOverdue(dueDate: string) {
  const due = new Date(dueDate);
  const today = new Date();
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<LibraryBorrowRecord[]>([]);
  const [borrowers, setBorrowers] = useState<any[]>([]); // students + teachers
  const [sections, setSections] = useState<any[]>([]);
  const [gradeLevels, setGradeLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [activeTab, setActiveTab] = useState<'circulation' | 'catalog'>('circulation');

  // Modal states
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LibraryBorrowRecord | null>(null);

  // Add Book form
  const [addBookForm, setAddBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    category: 'General Reference',
    totalCopies: 1,
    rackLocation: '',
    isDigital: false,
    section: '',
    gradeLevel: ''
  });
  const [addBookLoading, setAddBookLoading] = useState(false);

  // Settings state
  const [librarySettings, setLibrarySettings] = useState({ dailyFine: 0.50, currency: 'USD' });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ dailyFine: 0.50, currency: 'USD' });

  // Return & Pay Fine modal state
  const [payReturnRecord, setPayReturnRecord] = useState<LibraryBorrowRecord | null>(null);
  const [payForm, setPayForm] = useState({
    paymentMethod: 'Cash' as 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Cheque',
    referenceNumber: '',
    cashierName: 'Library Circulation Desk',
    waiveReason: '',
    waiveFine: false,
  });
  const [payLoading, setPayLoading] = useState(false);

  // Issue Book form
  const [issueForm, setIssueForm] = useState({
    bookId: '',
    borrowerDocumentId: '',
    borrowerType: 'student' as 'student' | 'teacher' | 'worker',
    loanDays: '14',
  });
  const [issueLoading, setIssueLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, r, sRes, secRes, grRes] = await Promise.all([
        libraryService.getBooks(),
        libraryService.getBorrowRecords(),
        apiClient.get('/students', { params: { 'pagination[limit]': 200, 'fields[0]': 'firstName', 'fields[1]': 'lastName', 'fields[2]': 'schoolId', 'fields[3]': 'documentId' } }),
        apiClient.get('/sections', { params: { 'pagination[limit]': 100 } }),
        apiClient.get('/grade-levels', { params: { 'pagination[limit]': 100 } })
      ]);
      setBooks(b);
      setBorrowRecords(r);
      const studentList = (sRes.data?.data || []).map((s: any) => ({
        documentId: s.documentId,
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        schoolId: s.schoolId || '',
        type: 'student' as const,
      }));
      setBorrowers(studentList);
      setSections(secRes.data?.data || []);
      setGradeLevels(grRes.data?.data || []);
    } catch {
      toast.error('Failed to load library data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadData(); 
    try {
      const storedSettings = localStorage.getItem('librarySettings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setLibrarySettings(parsed);
        setSettingsForm(parsed);
      }
    } catch (err) {}
  }, []);

  // Filter based on active tab
  const filteredRecords = useMemo(() => {
    return borrowRecords.filter(r => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        r.bookTitle.toLowerCase().includes(q) ||
        r.borrowerName.toLowerCase().includes(q) ||
        r.isbn.includes(q) ||
        r.borrowNumber.toLowerCase().includes(q)
      );
    });
  }, [borrowRecords, query]);

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    });
  }, [books, query]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
    const totalBorrowed = borrowRecords.filter(r => r.status === 'issued' || r.status === 'overdue').length;
    
    // Recalculate fines dynamically
    const totalOverdueFines = borrowRecords.reduce((sum, r) => {
      if (r.finePaid) return sum;
      let fine = r.fineAmount || 0;
      if (r.status === 'issued' || r.status === 'overdue') {
        const dueMs = new Date(r.dueDate).getTime();
        const nowMs = new Date().getTime();
        const daysLate = Math.max(0, Math.floor((nowMs - dueMs) / (1000 * 60 * 60 * 24)));
        fine = Math.max(fine, daysLate * librarySettings.dailyFine);
      }
      return sum + fine;
    }, 0);

    return [
      {
        id: 'total_catalog',
        title: 'Academic Library Catalog',
        value: `${totalTitles.toLocaleString('en-US')} Titles`,
        subtitle: `${totalCopies.toLocaleString('en-US')} Total Physical & Digital Copies`,
        trendDirection: 'up',
        icon: <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        id: 'active_borrows',
        title: 'Active Borrowed Books',
        value: totalBorrowed.toString(),
        subtitle: 'Currently in circulation among scholars & faculty',
        trendDirection: 'neutral',
        icon: <BookCheck className="w-5 h-5 text-sky-500" />
      },
      {
        id: 'digital_books',
        title: 'Digital PDF Resources',
        value: books.filter(b => b.isDigital).length.toString(),
        subtitle: 'Accessible via Student & Teacher Portals',
        trendDirection: 'up',
        icon: <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      },
      {
        id: 'overdue_fines',
        title: 'Outstanding Overdue Fines',
        value: `${librarySettings.currency} ${totalOverdueFines.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subtitle: 'Auto-posted to Finance ERP (GL 4030)',
        trendDirection: totalOverdueFines > 0 ? 'down' : 'up',
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />
      }
    ];
  }, [books, borrowRecords]);

  // ── Submit Settings ────────────────────────────────────────────────────────────
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLibrarySettings(settingsForm);
    localStorage.setItem('librarySettings', JSON.stringify(settingsForm));
    setShowSettingsModal(false);
    toast.success('Library settings updated.');
  };

  // ── Submit Add Book ────────────────────────────────────────────────────────────
  const handleAddBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddBookLoading(true);
    try {
      const payload: any = {
        title: addBookForm.title,
        isbn: addBookForm.isbn,
        author: addBookForm.author,
        publisher: addBookForm.publisher,
        category: addBookForm.category,
        totalCopies: Number(addBookForm.totalCopies),
        availableCopies: Number(addBookForm.totalCopies),
        borrowedCopies: 0,
        rackLocation: addBookForm.rackLocation,
        isDigital: addBookForm.isDigital,
      };
      if (addBookForm.section) payload.section = addBookForm.section;
      if (addBookForm.gradeLevel) payload.gradeLevel = addBookForm.gradeLevel;

      const newBook = await libraryService.addBook(payload);
      setBooks(prev => [newBook, ...prev]);
      setShowAddBookModal(false);
      toast.success(`Book "${newBook.title}" added to catalog.`);
      setAddBookForm({
        title: '', author: '', isbn: '', publisher: '', category: 'General Reference',
        totalCopies: 1, rackLocation: '', isDigital: false, section: '', gradeLevel: ''
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to add book.');
    } finally {
      setAddBookLoading(false);
    }
  };

  // ── Submit Issue Book ────────────────────────────────────────────────────────
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { bookId, borrowerDocumentId, borrowerType, loanDays } = issueForm;
    if (!bookId || !borrowerDocumentId) {
      toast.error('Please select both a book and a borrower.');
      return;
    }

    const book = books.find(b => b.id === bookId);
    const borrower = borrowers.find(b => b.documentId === borrowerDocumentId);

    if (!book || !borrower) {
      toast.error('Invalid book or borrower selection.');
      return;
    }

    if (book.availableCopies <= 0) {
      toast.error(`No available copies of "${book.title}".`);
      return;
    }

    setIssueLoading(true);
    try {
      const newRecord = await libraryService.issueBook(
        book.id,
        book.title,
        book.isbn,
        borrower.name,
        borrowerType,
        parseInt(loanDays) || 14,
        borrower.documentId
      );

      // Optimistically update local state
      setBorrowRecords(prev => [newRecord, ...prev]);
      // Decrement available copies in the catalog
      setBooks(prev => prev.map(b =>
        b.id === book.id
          ? { ...b, availableCopies: b.availableCopies - 1, borrowedCopies: b.borrowedCopies + 1 }
          : b
      ));

      setIssueForm({ bookId: '', borrowerDocumentId: '', borrowerType: 'student', loanDays: '14' });
      setShowIssueModal(false);
    } catch {
      toast.error('Failed to issue book. Please try again.');
    } finally {
      setIssueLoading(false);
    }
  };

  // ── Handle Return Book (interceptor) ────────────────────────────────────────
  // If fine > 0 → open payment modal first; otherwise return directly.
  const handleReturn = (record: LibraryBorrowRecord) => {
    const dueMs = new Date(record.dueDate).getTime();
    const todayMs = Date.now();
    const daysLate = Math.max(0, Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24)));
    const calculatedFine = parseFloat((daysLate * 0.5).toFixed(2));
    const totalFine = Math.max(record.fineAmount, calculatedFine);

    if (totalFine > 0) {
      // Intercept — show payment modal
      setPayReturnRecord({ ...record, fineAmount: totalFine });
      setPayForm({
        paymentMethod: 'Cash',
        referenceNumber: '',
        cashierName: 'Library Circulation Desk',
        waiveReason: '',
        waiveFine: false,
      });
    } else {
      // No fine — process return directly
      processReturn(record, true);
    }
  };

  // Internal: complete the return after payment is confirmed
  const processReturn = async (record: LibraryBorrowRecord, finePaid: boolean) => {
    try {
      const updated = await libraryService.returnBook(record, librarySettings.dailyFine, finePaid);
      setBorrowRecords(prev => prev.map(r => r.id === record.id ? updated : r));
      setBooks(prev => prev.map(b =>
        b.id === record.bookId
          ? { ...b, availableCopies: b.availableCopies + 1, borrowedCopies: Math.max(0, b.borrowedCopies - 1) }
          : b
      ));
      if (selectedRecord?.id === record.id) setSelectedRecord(updated);
    } catch {
      toast.error('Failed to process return.');
    }
  };

  // ── Submit Return + Payment to Finance ERP ───────────────────────────────────
  const handlePayAndReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payReturnRecord) return;
    setPayLoading(true);

    try {
      const fineAmount = payReturnRecord.fineAmount;
      const waived = payForm.waiveFine;

      if (!waived && fineAmount > 0) {
        // Find the borrower in our local list to get documentId / studentId
        const borrower = borrowers.find(b => b.name === payReturnRecord.borrowerName);

        // Post payment receipt to Finance ERP → auto-appears in student's financial record
        await financeService.postPaymentReceipt({
          studentId: borrower?.documentId || payReturnRecord.borrowerId,
          studentName: payReturnRecord.borrowerName,
          admissionNumber: borrower?.schoolId || payReturnRecord.borrowerId,
          parentName: '—',
          cashierName: payForm.cashierName,
          paymentAmount: fineAmount,
          amount: fineAmount,
          currency: 'USD',
          paymentMethod: payForm.paymentMethod as any,
          referenceNumber: payForm.referenceNumber || undefined,
          paymentDate: new Date().toISOString(),
          paymentType: 'Library Overdue Fine',
          notes: `Library overdue fine for "${payReturnRecord.bookTitle}" (${payReturnRecord.borrowNumber}). Collected at Circulation Desk.`,
          status: 'posted',
        } as any);

        toast.success(
          `Fine of $${fineAmount.toFixed(2)} collected via ${payForm.paymentMethod} and posted to student financial record (GL 4030).`
        );
      } else if (waived) {
        toast.success(`Fine waived. Reason: ${payForm.waiveReason || 'Not specified'}. Return processed.`);
      }

      // Complete the return
      await processReturn(payReturnRecord, true);
      setPayReturnRecord(null);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Payment failed';
      toast.error(`Finance ERP error: ${msg}`);
    } finally {
      setPayLoading(false);
    }
  };

  // ── Columns: Circulation Desk ────────────────────────────────────────────────
  const circulationColumns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorKey: 'borrowNumber',
      header: 'Borrow ID & Book Title',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="space-y-0.5 py-0.5">
            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{r.borrowNumber}</span>
            <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm max-w-xs truncate">{r.bookTitle}</p>
            <span className="font-mono text-[11px] text-slate-400">ISBN: {r.isbn}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'borrowerName',
      header: 'Borrower',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-white text-xs block">{row.original.borrowerName}</span>
          <span className="text-[11px] text-slate-500 capitalize">{row.original.borrowerType} Profile</span>
        </div>
      )
    },
    {
      accessorKey: 'issueDate',
      header: 'Issue / Due Date',
      cell: ({ row }) => {
        const r = row.original;
        const overdue = r.status === 'overdue';
        const days = overdue ? daysOverdue(r.dueDate) : 0;
        return (
          <div>
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 font-semibold block">{fmtDate(r.issueDate)}</span>
            <span className={`font-mono text-xs font-bold ${overdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
              Due: {fmtDate(r.dueDate)}{overdue && days > 0 ? ` (${days}d overdue)` : ''}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'fineAmount',
      header: 'Overdue Fine',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div>
            <span className={`font-mono text-xs font-extrabold ${r.fineAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
              ${r.fineAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-[11px] block font-semibold ${r.finePaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
              {r.finePaid ? '✓ Settled (GL 4030)' : 'Unpaid'}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Circulation Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedRecord(r); }}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />Inspect
            </button>
            {(r.status === 'issued' || r.status === 'overdue') && (
              <button
                onClick={async (e) => { e.stopPropagation(); await handleReturn(r); }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs cursor-pointer border-none"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />Return
              </button>
            )}
          </div>
        );
      }
    }
  ], [selectedRecord]);

  // ── Columns: Book Catalog ────────────────────────────────────────────────────
  const catalogColumns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Book Title & Author',
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="space-y-0.5 py-0.5 max-w-xs">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold mb-1 ${categoryColor(b.category)}`}>{b.category}</span>
            <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">{b.title}</p>
            <span className="text-[11px] text-slate-500">{b.author}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'isbn',
      header: 'ISBN & Rack',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 block">{row.original.isbn}</span>
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />{row.original.rackLocation}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'totalCopies',
      header: 'Copies',
      cell: ({ row }) => {
        const b = row.original;
        const avail = b.availableCopies;
        const total = b.totalCopies;
        return (
          <div>
            <span className={`text-xs font-extrabold font-mono block ${avail === 0 ? 'text-rose-600 dark:text-rose-400' : avail <= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {avail}/{total} Available
            </span>
            <span className="text-[11px] text-slate-400">{b.borrowedCopies} borrowed</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'isDigital',
      header: 'Format & Tracking',
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex flex-col gap-1.5 items-start">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Physical</span>
              {b.isDigital && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Digital PDF</span>
              )}
            </div>
            {(b.sectionName || b.gradeLevelName) && (
              <div className="flex items-center gap-1.5">
                {b.sectionName && <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 text-slate-500">{b.sectionName}</span>}
                {b.gradeLevelName && <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 text-slate-500">{b.gradeLevelName}</span>}
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'publisher',
      header: 'Publisher',
      cell: ({ row }) => <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{row.original.publisher}</span>
    }
  ], []);

  return (
    <EnterpriseModuleShell
      title="Academic Library ERP & Circulation Desk"
      description="Integrated ISBN book cataloging, barcode/QR circulation desk, digital PDF library access, and automated overdue fine settlement via Finance ERP (GL 4030)."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Library System' }]}
      icon={<BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={activeTab === 'circulation' ? filteredRecords.length : filteredBooks.length}
      recordLabel={activeTab === 'circulation' ? 'Borrow Records' : 'Book Titles'}
      onClearFilters={() => setQuery('')}
      headerActions={
        <div className="flex gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition cursor-pointer border-none"
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button
              onClick={() => setShowAddBookModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" /> Add Book
            </button>
            <button
              onClick={() => setShowIssueModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" /> Issue Book
            </button>
          </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl self-start w-fit">
        {(['circulation', 'catalog'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none capitalize ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'circulation' ? 'Circulation Desk' : 'Book Catalog'}
          </button>
        ))}
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={activeTab === 'circulation' ? 'Search by book title, ISBN, borrower, record ID...' : 'Search by title, author, ISBN, category...'}
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadData}
      />

      {activeTab === 'circulation' ? (
        <EnterpriseDataGrid
          data={filteredRecords}
          columns={circulationColumns}
          isLoading={loading}
          density={density}
          onRowInspect={(row) => setSelectedRecord(row)}
        />
      ) : (
        <EnterpriseDataGrid
          data={filteredBooks}
          columns={catalogColumns}
          isLoading={loading}
          density={density}
        />
      )}

      {/* ─── MODAL: Settings ─── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">Library Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure overdue fine policies and currency.</p>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSettingsSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Daily Overdue Fine Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={settingsForm.dailyFine}
                  onChange={e => setSettingsForm(prev => ({ ...prev, dailyFine: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Currency</label>
                <input
                  type="text"
                  required
                  list="currencies"
                  value={settingsForm.currency}
                  onChange={e => setSettingsForm(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                  placeholder="e.g. USD, GNF, NGN"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
                <datalist id="currencies">
                  <option value="USD" />
                  <option value="LD" />
                  <option value="GNF" />
                  <option value="NGN" />
                  <option value="EUR" />
                </datalist>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition border-none cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add Book ─── */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">Add Book to Catalog</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter book details and select academic section tracking if applicable.</p>
              </div>
              <button onClick={() => setShowAddBookModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBookSubmit} className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Book Title *</label>
                <input
                  type="text"
                  required
                  value={addBookForm.title}
                  onChange={e => setAddBookForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Campbell Biology"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Author</label>
                <input
                  type="text"
                  value={addBookForm.author}
                  onChange={e => setAddBookForm(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="e.g. Lisa A. Urry"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">ISBN *</label>
                <input
                  type="text"
                  required
                  value={addBookForm.isbn}
                  onChange={e => setAddBookForm(prev => ({ ...prev, isbn: e.target.value }))}
                  placeholder="e.g. 978-0134083186"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Publisher</label>
                <input
                  type="text"
                  value={addBookForm.publisher}
                  onChange={e => setAddBookForm(prev => ({ ...prev, publisher: e.target.value }))}
                  placeholder="e.g. Pearson Education"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Category</label>
                <select
                  value={addBookForm.category}
                  onChange={e => setAddBookForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  {['Islamic Studies', 'STEM & Sciences', 'Languages', 'Literature', 'History', 'General Reference'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Total Copies</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addBookForm.totalCopies}
                  onChange={e => setAddBookForm(prev => ({ ...prev, totalCopies: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Rack Location</label>
                <input
                  type="text"
                  value={addBookForm.rackLocation}
                  onChange={e => setAddBookForm(prev => ({ ...prev, rackLocation: e.target.value }))}
                  placeholder="e.g. Rack ST-08"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Academic Section (Optional)</label>
                <select
                  value={addBookForm.section}
                  onChange={e => setAddBookForm(prev => ({ ...prev, section: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Global / No Section --</option>
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Grade Level (Optional)</label>
                <select
                  value={addBookForm.gradeLevel}
                  onChange={e => setAddBookForm(prev => ({ ...prev, gradeLevel: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- All Grades --</option>
                  {gradeLevels.map(gl => (
                    <option key={gl.id} value={gl.id}>{gl.name} ({gl.code})</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addBookForm.isDigital}
                    onChange={e => setAddBookForm(prev => ({ ...prev, isDigital: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Has Digital PDF Version</span>
                </label>
              </div>

              <div className="col-span-2 flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBookLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition border-none cursor-pointer disabled:opacity-60"
                >
                  {addBookLoading ? 'Adding...' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Issue Book ─── */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">Issue Book — Circulation Desk</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select a book from the catalog and a borrower to issue.</p>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Book Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <BookMarked className="w-3.5 h-3.5" /> Select Book from Catalog *
                </label>
                <select
                  value={issueForm.bookId}
                  onChange={e => setIssueForm(prev => ({ ...prev, bookId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choose a book...</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                      {b.title} — {b.availableCopies > 0 ? `${b.availableCopies} copies available` : 'No copies available'}
                    </option>
                  ))}
                </select>
                {/* Book preview card */}
                {issueForm.bookId && (() => {
                  const book = books.find(b => b.id === issueForm.bookId);
                  if (!book) return null;
                  return (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">{book.title}</p>
                      <p className="text-[11px] text-slate-500">{book.author} · {book.publisher}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="font-mono text-[10px] text-slate-400">ISBN: {book.isbn}</span>
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">{book.rackLocation}</span>
                        {book.isDigital && <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold">Digital PDF</span>}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Borrower Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Borrower Type</label>
                <div className="flex gap-2">
                  {(['student', 'teacher', 'worker'] as const).map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setIssueForm(prev => ({ ...prev, borrowerType: t }))}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer capitalize ${
                        issueForm.borrowerType === t
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Borrower Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Select Borrower *
                </label>
                <select
                  value={issueForm.borrowerDocumentId}
                  onChange={e => setIssueForm(prev => ({ ...prev, borrowerDocumentId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choose {issueForm.borrowerType}...</option>
                  {borrowers
                    .filter(b => b.type === issueForm.borrowerType || issueForm.borrowerType !== 'student')
                    .map(b => (
                      <option key={b.documentId} value={b.documentId}>
                        {b.name}{b.schoolId ? ` (${b.schoolId})` : ''}
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Loan Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Loan Duration (Days)
                </label>
                <div className="flex gap-2">
                  {['7', '14', '21', '30'].map(d => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setIssueForm(prev => ({ ...prev, loanDays: d }))}
                      className={`flex-1 px-2 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        issueForm.loanDays === d
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Issuing will auto-generate a Borrow ID and update the available copy count in the catalog.</span>
                </div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-800/30 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>Overdue Fine Policy:</strong> The borrower will be charged <strong>{librarySettings.currency} {librarySettings.dailyFine.toFixed(2)} per day</strong> for every day the book is late. This will be automatically calculated and posted to their Financial Ledger (GL 4030) upon return.</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issueLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold transition cursor-pointer border-none flex items-center gap-1.5"
                >
                  {issueLoading ? 'Issuing...' : 'Confirm & Issue Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Detailed Inspect Borrow Record ─── */}
      {selectedRecord && (() => {
        const book = books.find(b => b.id === selectedRecord.bookId);
        const isActive = selectedRecord.status === 'issued' || selectedRecord.status === 'overdue';
        const overduedays = selectedRecord.status === 'overdue' ? daysOverdue(selectedRecord.dueDate) : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">Library Circulation Record</span>
                  <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight max-w-lg truncate">{selectedRecord.bookTitle}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{selectedRecord.borrowNumber} · ISBN {selectedRecord.isbn}</p>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent ml-3 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto p-6 space-y-5 text-xs font-semibold text-slate-700 dark:text-slate-300">

                {/* Status grid */}
                <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="bg-white dark:bg-slate-900 p-3 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Circulation Status</span>
                    <div><StatusBadge status={selectedRecord.status} size="sm" /></div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Overdue Fine</span>
                    <span className={`font-mono font-extrabold text-sm block ${selectedRecord.fineAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                      {librarySettings.currency}{selectedRecord.fineAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Fine Settlement</span>
                    <div className={`flex items-center gap-1 text-xs font-bold ${selectedRecord.finePaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {selectedRecord.finePaid ? <><CheckCircle2 className="w-3.5 h-3.5" />Settled (GL 4030)</> : <><XCircle className="w-3.5 h-3.5" />Unpaid</>}
                    </div>
                  </div>
                </div>

                {/* Overdue Alert */}
                {selectedRecord.status === 'overdue' && overduedays > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>This book is <strong>{overduedays} days overdue</strong>. A fine of <strong>${(overduedays * 0.5).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> has been automatically accrued and will be posted to Finance ERP GL 4030 upon return.</span>
                  </div>
                )}

                {/* Section 1: Borrower */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <User className="w-4 h-4" /> Borrower Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Full Name</span>
                      <p className="text-slate-900 dark:text-white font-bold">{selectedRecord.borrowerName}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Borrower Type</span>
                      <p className="text-slate-900 dark:text-white font-bold capitalize">{selectedRecord.borrowerType}</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Loan Timeline */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Loan Timeline
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Issue Date', value: fmtDate(selectedRecord.issueDate), icon: <Calendar className="w-3.5 h-3.5 text-emerald-500" /> },
                      { label: 'Due Date', value: fmtDate(selectedRecord.dueDate), icon: <Calendar className="w-3.5 h-3.5 text-amber-500" />, highlight: selectedRecord.status === 'overdue' },
                      { label: 'Return Date', value: fmtDate(selectedRecord.returnDate), icon: <RotateCcw className="w-3.5 h-3.5 text-sky-500" /> },
                    ].map(({ label, value, icon, highlight }) => (
                      <div key={label} className={`p-3 rounded-xl border ${highlight ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'}`}>
                        <p className="text-[10px] uppercase text-slate-400 flex items-center gap-1 mb-1">{icon}{label}</p>
                        <p className={`font-mono font-bold text-xs ${highlight ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Book Details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> Book Catalog Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Title</span>
                      <p className="text-slate-900 dark:text-white font-bold leading-tight">{selectedRecord.bookTitle}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Author</span>
                      <p className="text-slate-900 dark:text-white font-bold">{book?.author || '—'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Publisher</span>
                      <p className="text-slate-700 dark:text-slate-300 font-semibold">{book?.publisher || '—'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Rack Location</span>
                      <p className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />{book?.rackLocation || '—'}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Category</span>
                      {book?.category && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryColor(book.category)}`}>{book.category}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-400">Copies Status</span>
                      <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {book ? `${book.availableCopies}/${book.totalCopies} available` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  {isActive && (
                    <button
                      onClick={() => handleReturn(selectedRecord)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer border-none"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Process Return{selectedRecord.fineAmount > 0 && ` & Collect Fine`}
                    </button>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border-none"
                  >
                    <Printer className="w-3.5 h-3.5" />Print Slip
                  </button>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer border-none"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ─── MODAL: Return & Collect Fine Payment ─── */}
      {payReturnRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="space-y-1">
                <span className="font-mono text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Overdue Fine Payment
                </span>
                <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">Collect Fine & Process Return</h3>
                <p className="text-xs text-slate-500 font-semibold max-w-xs truncate">{payReturnRecord.bookTitle}</p>
              </div>
              <button
                onClick={() => setPayReturnRecord(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent ml-3 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fine Summary */}
            <div className="mx-5 mt-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-rose-400 mb-0.5">Borrower</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{payReturnRecord.borrowerName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-rose-400 mb-0.5">Days Overdue</p>
                  <p className="text-xs font-black text-rose-600 dark:text-rose-400">{daysOverdue(payReturnRecord.dueDate)} days</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-rose-400 mb-0.5">Fine Amount</p>
                  <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                    ${payReturnRecord.fineAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-rose-500 text-center mt-2">
                Computed at $0.50/day · GL 4030 — Library Revenue · Posted to student financial record
              </p>
            </div>

            <form onSubmit={handlePayAndReturn} className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Waive Fine Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Waive Overdue Fine</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">For compassionate reasons only (requires manager approval)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPayForm(prev => ({ ...prev, waiveFine: !prev.waiveFine }))}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none shrink-0 ${payForm.waiveFine ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${payForm.waiveFine ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {payForm.waiveFine ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Waiver Reason *</label>
                  <textarea
                    value={payForm.waiveReason}
                    onChange={e => setPayForm(prev => ({ ...prev, waiveReason: e.target.value }))}
                    required
                    rows={2}
                    placeholder="e.g. Compassionate waiver — medical emergency documented by school nurse..."
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/10 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              ) : (
                <>
                  {/* Payment Method */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Payment Method *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Cash', 'Mobile Money', 'Bank Transfer', 'Cheque'] as const).map(method => (
                        <button
                          type="button"
                          key={method}
                          onClick={() => setPayForm(prev => ({ ...prev, paymentMethod: method }))}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer text-left ${
                            payForm.paymentMethod === method
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          {method === 'Cash' && '💵 '}
                          {method === 'Mobile Money' && '📱 '}
                          {method === 'Bank Transfer' && '🏦 '}
                          {method === 'Cheque' && '📋 '}
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reference Number (for non-cash) */}
                  {payForm.paymentMethod !== 'Cash' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                        {payForm.paymentMethod === 'Mobile Money' ? 'Transaction ID' : 'Reference / Cheque No.'}
                      </label>
                      <input
                        type="text"
                        value={payForm.referenceNumber}
                        onChange={e => setPayForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                        placeholder={payForm.paymentMethod === 'Mobile Money' ? 'e.g. TXN-928374923' : 'e.g. CHQ-00219'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* Cashier Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Collected By (Cashier)</label>
                    <input
                      type="text"
                      value={payForm.cashierName}
                      onChange={e => setPayForm(prev => ({ ...prev, cashierName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Finance ERP notice */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      This payment will be <strong>posted to Finance ERP</strong> as a Receipt (GL 4030 — Library Revenue)
                      and will automatically appear in <strong>{payReturnRecord.borrowerName}'s student financial record</strong>.
                    </span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayReturnRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-60 ${
                    payForm.waiveFine ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {payLoading
                    ? 'Processing...'
                    : payForm.waiveFine
                      ? 'Waive Fine & Return Book'
                      : `Collect $${payReturnRecord.fineAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} & Return Book`
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}
