import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Formatting Utilities
// ─────────────────────────────────────────────────────────────────────────────

// ── Date Formatters ────────────────────────────────────────────────────────

/** Format a date string to a human-readable long format */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr = 'dd MMM yyyy'
): string {
  if (!date) return '—';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsed)) return '—';
    return format(parsed, formatStr);
  } catch {
    return '—';
  }
}

/** Format a datetime string */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd MMM yyyy, HH:mm');
}

/** Format a date as relative time (e.g., "2 hours ago") */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsed)) return '—';
    return formatDistanceToNow(parsed, { addSuffix: true });
  } catch {
    return '—';
  }
}

/** Format a date for HTML date input (YYYY-MM-DD) */
export function formatDateInput(date: string | Date | null | undefined): string {
  return formatDate(date, 'yyyy-MM-dd');
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Resolves an event/news item date automatically.
 * Checks date, publishDate, publishedAt, createdAt, or month+day strings,
 * falling back to the parent page date or now.
 */
export function resolveEventDate(
  event?: {
    date?: string | null;
    publishDate?: string | null;
    publishedAt?: string | null;
    createdAt?: string | null;
    month?: string | null;
    day?: string | null;
  } | null,
  fallbackDate?: string | Date | null
): Date {
  if (event) {
    const candidate = event.date || event.publishDate || event.publishedAt || event.createdAt;
    if (candidate) {
      const d = new Date(candidate);
      if (!isNaN(d.getTime())) return d;
    }

    if (event.month && event.day) {
      const cleanMonth = event.month.trim().toLowerCase();
      const cleanDay = parseInt(event.day.replace(/[^\d]/g, ''), 10);
      if (!isNaN(cleanDay) && MONTH_MAP[cleanMonth] !== undefined) {
        const year = fallbackDate ? new Date(fallbackDate).getFullYear() : 2024;
        return new Date(year, MONTH_MAP[cleanMonth], cleanDay);
      }
    }
  }

  if (fallbackDate) {
    const d = new Date(fallbackDate);
    if (!isNaN(d.getTime())) return d;
  }

  return new Date();
}

/** Localized month abbreviation and day for event badges across locales */
export function formatMonthAndDay(dateInput: Date | string, locale: string = 'en') {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const loc = (locale || 'en').toLowerCase();
  const validDate = !date || isNaN(date.getTime()) ? new Date() : date;

  try {
    const isAr = loc.startsWith('ar');
    const month = new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
      month: 'short',
    }).format(validDate).toUpperCase();

    const day = new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
      day: 'numeric',
    }).format(validDate);

    return { month, day };
  } catch {
    return {
      month: validDate.toLocaleString(locale, { month: 'short' }).toUpperCase(),
      day: validDate.getDate().toString(),
    };
  }
}

/** Localized date formatting for news cards & detail pages across locales (en, ar, fr, tr) */
export function formatCardDate(dateInput?: string | Date | null, locale: string = 'en'): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return '';

  const loc = (locale || 'en').toLowerCase();

  try {
    if (loc.startsWith('ar')) {
      return new Intl.DateTimeFormat('ar-EG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }
    if (loc.startsWith('fr')) {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }
    if (loc.startsWith('tr')) {
      return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    let str = date.toLocaleDateString(locale || 'en');
    if (loc.startsWith('ar')) {
      str = str.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
    }
    return str;
  }
}

// ── Currency Formatters ─────────────────────────────────────────────────────

/** Format a number as currency */
export function formatCurrency(
  amount: number | null | undefined,
  currency = 'NGN',
  locale = 'en-NG'
): string {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// ── Number Formatters ───────────────────────────────────────────────────────

/** Format a large number with thousands separators */
export function formatNumber(num: number | null | undefined): string {
  if (num == null) return '—';
  return new Intl.NumberFormat('en-US').format(num);
}

/** Format a number as percentage */
export function formatPercent(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value == null) return '—';
  return `${value.toFixed(decimals)}%`;
}

// ── Text Formatters ─────────────────────────────────────────────────────────

/** Format a School ID for display (e.g., "AC000000001") */
export function formatSchoolId(schoolId: string | null | undefined): string {
  if (!schoolId) return '—';
  return schoolId.toUpperCase();
}

/** Format a phone number for display */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '—';
  // Simple formatter — can be enhanced with libphonenumber-js later
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
}

/** Format a role type string to display name */
export function formatRoleName(roleType: string): string {
  return roleType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
