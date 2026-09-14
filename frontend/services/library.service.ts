import { apiClient } from './api.service';
import { financeService } from './finance.service';
import { sequenceService } from './sequence.service';
import type { LibraryBook, LibraryBorrowRecord } from '@/types/enterprise.types';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Library ERP Service
// Integrated Circulation Desk, Barcode/QR Engine & Overdue Fine Finance Ledger
// Persists book catalog and borrow records in-memory for the session.
// When Strapi library collections are provisioned, swap the static arrays below
// with the corresponding apiClient calls.
// ─────────────────────────────────────────────────────────────────────────────

// ── Service ───────────────────────────────────────────────────────────────────

export const libraryService = {
  /**
   * Get all Library Books in Catalog.
   */
  async getBooks(): Promise<LibraryBook[]> {
    try {
      const res = await apiClient.get('/library-books?populate=*&pagination[limit]=1000');
      if (res.data?.data) {
        return res.data.data.map((b: any) => ({
          ...b,
          id: b.documentId,
          // Extract nested relations safely
          sectionName: b.section?.name,
          gradeLevelName: b.gradeLevel?.name
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Get Borrowing / Circulation Records.
   */
  async getBorrowRecords(): Promise<LibraryBorrowRecord[]> {
    try {
      const res = await apiClient.get('/library-borrow-records?populate=*&pagination[limit]=1000&sort=createdAt:desc');
      if (res.data?.data) {
        return res.data.data.map((r: any) => ({
          ...r,
          id: r.documentId,
          bookTitle: r.book?.title || r.bookTitle,
          isbn: r.book?.isbn || r.isbn,
          bookId: r.book?.documentId || r.bookId
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Add a new Book to the Catalog.
   */
  async addBook(payload: any): Promise<LibraryBook> {
    const res = await apiClient.post('/library-books', { data: payload });
    const b = res.data.data;
    return {
      ...b,
      id: b.documentId,
      sectionName: b.section?.name,
      gradeLevelName: b.gradeLevel?.name
    };
  },

  /**
   * Issue / Borrow a Book from the Circulation Desk.
   * Decrements availableCopies in the in-memory catalog.
   * @param loanDays   Number of days for borrowing period (default: 14)
   * @param borrowerDocumentId  Strapi documentId of the borrower (for future API linking)
   */
  async issueBook(
    bookId: string,
    bookTitle: string,
    isbn: string,
    borrowerName: string,
    borrowerType: 'student' | 'teacher' | 'worker',
    loanDays = 14,
    borrowerDocumentId?: string
  ): Promise<LibraryBorrowRecord> {
    const borrowNum = sequenceService.generateDocumentNumber('LIB');
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + loanDays);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const payload = {
      borrowNumber: borrowNum,
      book: bookId,
      borrowerId: borrowerDocumentId || '1',
      borrowerName,
      borrowerType,
      issueDate,
      dueDate,
      status: 'issued',
      fineAmount: 0,
      finePaid: false,
    };

    const res = await apiClient.post('/library-borrow-records', { data: payload });
    const record = res.data.data;

    // Fetch book to decrement available copies
    try {
      const bookRes = await apiClient.get(`/library-books/${bookId}`);
      if (bookRes.data?.data) {
        const bookData = bookRes.data.data;
        if (bookData.availableCopies > 0) {
          await apiClient.put(`/library-books/${bookId}`, {
            data: {
              availableCopies: bookData.availableCopies - 1,
              borrowedCopies: (bookData.borrowedCopies || 0) + 1
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to update book availability', err);
    }

    toast.success(`"${bookTitle}" issued to ${borrowerName}. Due: ${dueDate} (${loanDays}-day loan).`);
    
    return {
      ...record,
      id: record.documentId,
      bookTitle,
      isbn,
      bookId
    };
  },

  /**
   * Process Book Return & Settle Overdue Fine via Finance ERP.
   * Calculates fine at $0.50/day automatically.
   */
  async returnBook(record: LibraryBorrowRecord, dailyFine: number, finePaid = false): Promise<LibraryBorrowRecord> {
    const returnDate = new Date().toISOString().split('T')[0];

    const dueMs = new Date(record.dueDate).getTime();
    const returnMs = new Date(returnDate).getTime();
    const daysLate = Math.max(0, Math.floor((returnMs - dueMs) / (1000 * 60 * 60 * 24)));
    const calculatedFine = parseFloat((daysLate * dailyFine).toFixed(2));
    const finalFine = Math.max(record.fineAmount || 0, calculatedFine);

    if (finalFine > 0 && finePaid) {
      try {
        await financeService.postPaymentReceipt({
          paymentAmount: finalFine,
          paymentMethod: 'Cash',
          paymentDate: new Date().toISOString(),
          cashierName: 'Library Circulation Desk',
          paymentType: 'Library Overdue Fine',
        });
        toast.success(`Finance Integration: Overdue Fine Receipt of $${finalFine.toFixed(2)} posted (GL 4030).`);
      } catch (err) {
        console.warn('Failed to record library fine receipt:', err);
      }
    }

    const payload = {
      returnDate,
      status: 'returned',
      fineAmount: finalFine,
      finePaid: finePaid || finalFine === 0,
    };

    const res = await apiClient.put(`/library-borrow-records/${record.id}`, { data: payload });
    const updated = res.data.data;

    // Fetch book to increment available copies
    if (record.bookId) {
      try {
        const bookRes = await apiClient.get(`/library-books/${record.bookId}`);
        if (bookRes.data?.data) {
          const bookData = bookRes.data.data;
          await apiClient.put(`/library-books/${record.bookId}`, {
            data: {
              availableCopies: bookData.availableCopies + 1,
              borrowedCopies: Math.max(0, (bookData.borrowedCopies || 0) - 1)
            }
          });
        }
      } catch (err) {
        console.error('Failed to update book availability', err);
      }
    }

    toast.success(`"${record.bookTitle}" returned successfully.${finalFine > 0 ? ` Fine: $${finalFine.toFixed(2)}` : ''}`);
    return {
      ...updated,
      id: updated.documentId,
      bookTitle: record.bookTitle,
      isbn: record.isbn,
      bookId: record.bookId
    };
  },
};
