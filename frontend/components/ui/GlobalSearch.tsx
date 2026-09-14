/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, GraduationCap, UserCheck, Heart, BookOpen,
  FileText, Calendar, DollarSign, Award, Users, ArrowRight,
  ShieldAlert, Loader2, Layers, Clock, LayoutDashboard, Settings,
  FileSearch, Bell, AlignLeft, Key, Globe, HardDrive, UsersRound,
  BookMarked, Boxes, ScrollText, School, PenTool, BookCheck,
  SquareCheckBig, Library, BarChart3, FolderOpen, Trophy, Star,
  BadgeCheck, Scale, Landmark, CreditCard, Percent, Coins,
  PiggyBank, Wallet, Receipt, HeartHandshake, TrendingUp,
  Megaphone, Package, MessageSquare, UserCog, AlertTriangle,
  FileSpreadsheet, Compass, ShieldCheck, LayoutGrid, Clipboard
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { erpService } from '@/services/erp.service';
import { financeService } from '@/services/finance.service';
import { apiClient } from '@/services/api.service';
import { cn } from '@/lib/utils';

export interface SearchResultItem {
  id: string | number;
  title: string;
  subtitle?: string;
  category: 'page' | 'student' | 'teacher' | 'parent' | 'worker' | 'subject' | 'homework' | 'finance' | 'general';
  href: string;
  keywords?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Universal System Navigation Index (Sidebar pages & System modules)
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_NAVIGATION_PAGES: SearchResultItem[] = [
  // Overview & Dashboards
  { id: 'nav-dashboard', title: 'Main Dashboard', subtitle: 'System Overview & Analytics', category: 'page', href: '/dashboard', keywords: ['dashboard', 'home', 'main', 'overview', 'stats'] },
  { id: 'nav-[locale]-dashboard', title: 'Executive Admin Dashboard', subtitle: 'System Administration & Control Center', category: 'page', href: '/dashboard', keywords: ['admin', 'executive', 'director'] },

  // People & Directory
  { id: 'nav-directory', title: 'People Directory', subtitle: 'Unified Directory of Students, Staff, & Parents', category: 'page', href: '/directory', keywords: ['directory', 'people', 'contacts', 'search'] },
  { id: 'nav-students', title: 'Students Management', subtitle: 'Student Information & Academic Profiles', category: 'page', href: '/students', keywords: ['students', 'scholars', 'enrolled', 'directory', 'children'] },
  { id: 'nav-teachers', title: 'Teachers & Faculty', subtitle: 'Academic Faculty Roster & Assignment', category: 'page', href: '/teachers', keywords: ['teachers', 'faculty', 'instructors', 'staff'] },
  { id: 'nav-parents', title: 'Parents & Guardians', subtitle: 'Guardian Accounts & Family Links', category: 'page', href: '/parents', keywords: ['parents', 'guardians', 'families', 'family'] },
  { id: 'nav-workers', title: 'Non-Teaching Support Workers', subtitle: 'Support Staff, Drivers & Operations', category: 'page', href: '/workers', keywords: ['workers', 'staff', 'support', 'drivers', 'cleaners', 'janitors'] },
  { id: 'nav-admissions', title: 'Admission Applications', subtitle: 'New Student Enrollment & Applications', category: 'page', href: '/directory/admissions', keywords: ['admissions', 'enrollment', 'register', 'apply'] },

  // Academic Structure
  { id: 'nav-departments', title: 'Academic Structure & Departments', subtitle: 'School Departments & Faculties', category: 'page', href: '/academic-structure', keywords: ['departments', 'structure', 'faculties', 'divisions'] },
  { id: 'nav-programs', title: 'Academic Programs', subtitle: 'Curriculum Degrees & Certifications', category: 'page', href: '/academic-structure/programs', keywords: ['programs', 'courses', 'degrees'] },
  { id: 'nav-sections', title: 'Academic Sections', subtitle: 'Academic Sections & Department Divisions', category: 'page', href: '/academic-structure/sections', keywords: ['sections', 'classes', 'divisions', 'departments'] },
  { id: 'nav-academic-years', title: 'Academic Years', subtitle: 'School Calendar Years & Terms', category: 'page', href: '/academic-structure/years', keywords: ['years', 'sessions', 'calendar'] },
  { id: 'nav-academic-terms', title: 'Academic Terms', subtitle: 'Semester & Term Periods', category: 'page', href: '/academic-structure/terms', keywords: ['terms', 'semesters', 'quarters'] },
  { id: 'nav-calendar', title: 'School Calendar', subtitle: 'Events, Exams & Holiday Schedules', category: 'page', href: '/calendar', keywords: ['calendar', 'events', 'holidays', 'schedule'] },

  // LMS (Learning Management System)
  { id: 'nav-lms-subjects', title: 'Subjects & Curriculum', subtitle: 'Course Offerings & Syllabus Units', category: 'page', href: '/lms/subjects', keywords: ['subjects', 'curriculum', 'courses', 'syllabus'] },
  { id: 'nav-lms-timetables', title: 'Classes & Timetables', subtitle: 'Weekly Classroom & Slot Schedules', category: 'page', href: '/lms/timetables', keywords: ['timetables', 'schedule', 'classes', 'slots', 'periods'] },
  { id: 'nav-lms-lesson-plans', title: 'Lesson Plans', subtitle: 'Teaching Material & Curriculum Delivery', category: 'page', href: '/lms/lesson-plans', keywords: ['lesson', 'plans', 'teaching', 'material'] },
  { id: 'nav-lms-homework', title: 'Homework & Assignments', subtitle: 'Student Homework Assignments & Grading', category: 'page', href: '/lms/homework', keywords: ['homework', 'assignments', 'tasks'] },
  { id: 'nav-lms-attendance', title: 'Classroom Attendance', subtitle: 'Daily & Period Student Attendance Records', category: 'page', href: '/lms/attendance', keywords: ['attendance', 'rollcall', 'presence', 'absent'] },
  { id: 'nav-lms-gradebook', title: 'Assessments & Gradebook', subtitle: 'Gradebook Entries & Continuous Assessment', category: 'page', href: '/lms/gradebook', keywords: ['gradebook', 'scores', 'marks', 'assessments'] },
  { id: 'nav-lms-resources', title: 'Learning Resources', subtitle: 'Digital Textbooks, PDF, & Media Library', category: 'page', href: '/lms/resources', keywords: ['resources', 'books', 'library', 'materials'] },

  // Qur'an Department (QMS)
  { id: 'nav-qms-programs', title: "Qur'an Programs & Groups", subtitle: "Memorization & Halaqah Groups", category: 'page', href: '/qms/programs', keywords: ['quran', 'hifz', 'halaqah', 'islamic'] },
  { id: 'nav-qms-memorization', title: 'Hifz Tracking', subtitle: 'Surah & Juz Memorization Progress', category: 'page', href: '/qms/memorization', keywords: ['hifz', 'memorization', 'juz', 'surah'] },
  { id: 'nav-qms-revision', title: "Muraja'ah Revision", subtitle: 'Qur\'an Revision & Recitation Monitoring', category: 'page', href: '/qms/revision', keywords: ['murajaah', 'revision', 'recitation'] },
  { id: 'nav-qms-tajweed', title: 'Tajweed Evaluations', subtitle: 'Pronunciation & Rules Assessment', category: 'page', href: '/qms/tajweed', keywords: ['tajweed', 'pronunciation', 'makhraj'] },
  { id: 'nav-qms-halaqah', title: 'Daily Halaqah Sessions', subtitle: 'Circle Recitation & Teacher Logs', category: 'page', href: '/qms/halaqah', keywords: ['halaqah', 'circle', 'session'] },

  // Language Department (LLMS)
  { id: 'nav-llms-programs', title: 'Language Programs', subtitle: 'Arabic, English, French & Turkish Courses', category: 'page', href: '/llms/programs', keywords: ['languages', 'arabic', 'english', 'french', 'turkish'] },
  { id: 'nav-llms-skills', title: 'Language Skill Analytics', subtitle: 'Speaking, Listening, Reading & Writing Scores', category: 'page', href: '/llms/skills', keywords: ['skills', 'fluency', 'analytics'] },

  // Assessment & Exams
  { id: 'nav-assessment-exams', title: 'Examinations', subtitle: 'Midterm & Final Examination Management', category: 'page', href: '/assessment/exams', keywords: ['exams', 'examinations', 'tests'] },
  { id: 'nav-assessment-marks', title: 'Marks Entry Data Grid', subtitle: 'Faculty Score Entry & Grade Calculation', category: 'page', href: '/assessment/marks-entry', keywords: ['marks', 'scores', 'entry', 'grades', 'reportcard'] },
  { id: 'nav-assessment-scheduling', title: 'Exam Scheduling', subtitle: 'Timetables & Exam Room Assignments', category: 'page', href: '/assessment/scheduling', keywords: ['scheduling', 'timetable', 'halls', 'invigilation'] },
  { id: 'nav-assessment-question-bank', title: 'Question Bank', subtitle: 'Exam Question Repositories & Templates', category: 'page', href: '/assessment/question-bank', keywords: ['questions', 'bank', 'quiz', 'test'] },

  // Results & Certification
  { id: 'nav-results-cards', title: 'Report Cards', subtitle: 'Certified Terminal Report Cards', category: 'page', href: '/results/report-cards', keywords: ['results', 'report', 'cards', 'grades', 'sheet'] },
  { id: 'nav-results-transcripts', title: 'Academic Transcripts', subtitle: 'Multi-Year Academic Transcript Ledger', category: 'page', href: '/results/transcripts', keywords: ['transcripts', 'gpa', 'records'] },
  { id: 'nav-results-certificates', title: 'Academic Certificates', subtitle: 'Graduation & Achievement Certificates', category: 'page', href: '/results/certificates', keywords: ['certificates', 'diplomas', 'awards'] },
  { id: 'nav-results-promotions', title: 'Student Class Promotions', subtitle: 'Year-End Class Advancement & Rollover', category: 'page', href: '/results/promotions', keywords: ['promotions', 'advancement', 'pass'] },
  { id: 'nav-results-rankings', title: 'Class Rankings & Merit List', subtitle: 'Top Performers & Honor Roll', category: 'page', href: '/results/rankings', keywords: ['rankings', 'merit', 'honor', 'top'] },

  // Finance ERP Suite
  { id: 'nav-finance-main', title: 'Finance Executive Dashboard', subtitle: 'Treasury, Revenue, Expenses & Ledger Overview', category: 'page', href: '/finance', keywords: ['finance', 'billing', 'money', 'treasury', 'revenue', 'accounting'] },
  { id: 'nav-finance-invoices', title: 'Student Invoices', subtitle: 'Tuition Fee Invoices & Payment Demands', category: 'page', href: '/finance/billing/invoices', keywords: ['invoices', 'tuition', 'bills', 'fees'] },
  { id: 'nav-finance-payments', title: 'Multi-Method Cashier POS', subtitle: 'Cash, Mobile Money & Card Payment Desk', category: 'page', href: '/finance/billing/payments', keywords: ['payments', 'cashier', 'pos', 'receipts', 'billing'] },
  { id: 'nav-finance-statements', title: 'Student Financial Statements', subtitle: 'Running Account Ledgers & Statements', category: 'page', href: '/finance/billing/statements', keywords: ['statements', 'ledger', 'balance', 'dues'] },
  { id: 'nav-finance-fee-structures', title: 'Fee Structures', subtitle: 'Academic Fee Rates & Billing Templates', category: 'page', href: '/finance/billing/structures', keywords: ['fees', 'structures', 'rates', 'pricing'] },
  { id: 'nav-finance-installments', title: 'Installment Plans', subtitle: 'Deferred Tuition Payment Schedules', category: 'page', href: '/finance/billing/installments', keywords: ['installments', 'plans', 'payment-plan'] },
  { id: 'nav-finance-scholarships', title: 'Scholarships & Aid', subtitle: 'Waqf Grants, Financial Aid & Waivers', category: 'page', href: '/finance/billing/scholarships', keywords: ['scholarships', 'aid', 'waqf', 'grants', 'bursary'] },
  { id: 'nav-finance-payroll', title: 'Staff Payroll Runs', subtitle: 'Faculty & Worker Monthly Compensation', category: 'page', href: '/finance/payroll', keywords: ['payroll', 'salaries', 'wages', 'compensation', 'pay'] },
  { id: 'nav-finance-payroll-approvals', title: 'Payroll Approvals', subtitle: 'Executive Payout Authorization Desk', category: 'page', href: '/finance/payroll/approvals', keywords: ['approvals', 'payroll', 'authorize', 'payout'] },
  { id: 'nav-finance-expenses', title: 'Expense Requisitions', subtitle: 'Campus Operations & Utility Expenses', category: 'page', href: '/finance/expenses', keywords: ['expenses', 'requisitions', 'vendor', 'bills'] },
  { id: 'nav-finance-budget', title: 'Department Budgets', subtitle: 'Annual Department Allocation & Spending', category: 'page', href: '/finance/budget', keywords: ['budgets', 'allocation', 'forecast'] },
  { id: 'nav-finance-donations', title: 'Donation Campaigns & Waqf', subtitle: 'Charitable Contributions & Endowment', category: 'page', href: '/finance/donations', keywords: ['donations', 'waqf', 'charity', 'endowment'] },
  { id: 'nav-finance-reports', title: 'Financial Statements & Reports', subtitle: 'Income Statement & Balance Sheet Reports', category: 'page', href: '/finance/reports', keywords: ['reports', 'balance-sheet', 'income-statement', 'pnl'] },
  { id: 'nav-finance-chart', title: 'Chart of Accounts', subtitle: 'GL Account Codes & Accounting Categories', category: 'page', href: '/finance/accounting/chart', keywords: ['chart', 'accounts', 'gl', 'ledger-codes'] },
  { id: 'nav-finance-journals', title: 'Double-Entry Journals', subtitle: 'General Journal Vouchers & Accounting Entries', category: 'page', href: '/finance/accounting/journals', keywords: ['journals', 'entries', 'vouchers', 'double-entry'] },
  { id: 'nav-hostel', title: 'Hostel & Boarding ERP', subtitle: 'Halls, Rooms, Bed Allocations, Visitors & Gate Passes', category: 'page', href: '/hostel', keywords: ['hostel', 'boarding', 'rooms', 'beds', 'allocation', 'gatepass', 'visitor', 'warden', 'curfew'] },
  { id: 'nav-hostel-dashboard', title: 'Hostel Dashboard', subtitle: 'Hostel Executive & Occupancy Command Center', category: 'page', href: '/hostel?tab=dashboard', keywords: ['hostel', 'dashboard', 'occupancy', 'capacity'] },
  { id: 'nav-hostel-buildings', title: 'Boarding Buildings & Floors', subtitle: 'Boarding Halls & Floor Inventories', category: 'page', href: '/hostel?tab=buildings', keywords: ['hostel', 'buildings', 'halls', 'floors'] },
  { id: 'nav-hostel-rooms', title: 'Rooms & Beds Inventory', subtitle: 'Room Categories & Bed Space Registers', category: 'page', href: '/hostel?tab=rooms', keywords: ['hostel', 'rooms', 'beds', 'inventory'] },
  { id: 'nav-hostel-allocations', title: 'Hostel Bed Allocations', subtitle: 'Resident Student Bed Assignments & Status', category: 'page', href: '/hostel?tab=allocations', keywords: ['hostel', 'allocations', 'assign', 'bed'] },
  { id: 'nav-hostel-waiting-list', title: 'Hostel Waiting List', subtitle: 'Scholars Queued for Boarding Allocation', category: 'page', href: '/hostel?tab=waiting-list', keywords: ['hostel', 'waitlist', 'waiting', 'queue'] },
  { id: 'nav-hostel-feeplans', title: 'Boarding Fee Plans & Setup', subtitle: 'Term Charges & Refundable Security Deposit Rates', category: 'page', href: '/hostel?tab=feeplans', keywords: ['hostel', 'fees', 'plans', 'billing'] },
  { id: 'nav-hostel-deposits', title: 'Hostel Security Deposits', subtitle: 'GL 2050 Deposits Held & Refund Releases', category: 'page', href: '/hostel?tab=deposits', keywords: ['hostel', 'deposits', 'gl 2050', 'refund', 'money'] },
  { id: 'nav-hostel-visitors', title: 'Hostel Visitor Logs', subtitle: 'Guest Registrations & Short Stay Logs', category: 'page', href: '/hostel?tab=visitors', keywords: ['hostel', 'visitors', 'guests', 'registry'] },
  { id: 'nav-hostel-gatepasses', title: 'Warden Gate Passes', subtitle: 'Student Curfew Leaves & Gate Entry Permits', category: 'page', href: '/hostel?tab=gatepasses', keywords: ['hostel', 'gate', 'passes', 'curfew', 'leave'] },
  { id: 'nav-hostel-attendance', title: 'Hostel Attendance Logs', subtitle: 'Student Roll-Call & Curfew Check Registry', category: 'page', href: '/hostel?tab=attendance', keywords: ['hostel', 'attendance', 'checkin', 'rollcall'] },
  { id: 'nav-hostel-wardens', title: 'Wardens & Duty Roster', subtitle: 'Chief Wardens, Building Assignments & Duty Schedules', category: 'page', href: '/hostel?tab=wardens', keywords: ['hostel', 'wardens', 'duty', 'staff'] },
  { id: 'nav-hostel-maintenance', title: 'Hostel Maintenance Tickets', subtitle: 'Boarding Room Repair Requests & Resolution Status', category: 'page', href: '/hostel?tab=maintenance', keywords: ['hostel', 'maintenance', 'repair', 'tickets', 'wrench'] },
  { id: 'nav-hostel-settings', title: 'Hostel Reports & Settings', subtitle: 'Academic Year Policies & Occupancy Limits', category: 'page', href: '/hostel?tab=settings', keywords: ['hostel', 'settings', 'reports', 'policies'] },

  // System Administration & Settings
  { id: 'nav-users', title: 'User Account Management', subtitle: 'User Accounts, Roles & Password Resets', category: 'page', href: '/users', keywords: ['users', 'accounts', 'roles', 'login', 'passwords'] },
  { id: 'nav-settings', title: 'System Settings', subtitle: 'Platform Configuration & Preferences', category: 'page', href: '/settings', keywords: ['settings', 'config', 'preferences'] },
  { id: 'nav-roles', title: 'Roles & Permissions', subtitle: 'RBAC Access Control & Module Policies', category: 'page', href: '/settings/roles', keywords: ['roles', 'permissions', 'rbac', 'security'] },
  { id: 'nav-audit-logs', title: 'System Audit Trail', subtitle: 'Security & Activity Logs', category: 'page', href: '/audit-logs', keywords: ['audit', 'logs', 'security', 'history'] },
  { id: 'nav-notifications', title: 'Notifications Center', subtitle: 'Alerts, Broadcasts & Reminders', category: 'page', href: '/notifications', keywords: ['notifications', 'alerts', 'announcements'] },
  { id: 'nav-profile', title: 'User Profile', subtitle: 'Personal Account Information & Credentials', category: 'page', href: '/profile', keywords: ['profile', 'account', 'password', 'me'] },
];

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const router = useRouter();
  const { userRole } = usePermissions();

  const quickAccessShortcuts = useMemo(() => {
    const roleType = userRole ? String(userRole).toLowerCase() : '';
    if (roleType === 'teacher') {
      return [
        { label: '📅 My Timetable', href: '/lms/timetables' },
        { label: '📖 My Classes', href: '/lms/subjects' },
        { label: '🎓 My Students', href: '/students' },
        { label: '✅ Attendance', href: '/lms/attendance' },
        { label: '📝 Marks Entry', href: '/assessment/marks-entry' },
        { label: '🕌 Hifz Tracking', href: '/qms/memorization' },
        { label: '👤 My Profile', href: '/profile' },
      ];
    }
    if (roleType === 'student') {
      return [
        { label: '📅 My Timetable', href: '/lms/timetables' },
        { label: '📖 My Subjects', href: '/lms/subjects' },
        { label: '📝 Homework', href: '/lms/homework' },
        { label: '📊 My Results', href: '/results/report-cards' },
        { label: '🕌 Hifz Progress', href: '/qms/memorization' },
        { label: '👤 My Profile', href: '/profile' },
      ];
    }
    if (roleType === 'parent') {
      return [
        { label: '🎓 Children Overview', href: '/students' },
        { label: '✅ Attendance', href: '/lms/attendance' },
        { label: '📊 Results', href: '/results/report-cards' },
        { label: '💳 Payments', href: '/finance/parent-center' },
        { label: '👤 Profile', href: '/profile' },
      ];
    }
    return [
      { label: '🏢 Hostel ERP', href: '/hostel' },
      { label: '🎓 Students', href: '/students' },
      { label: '👨‍🏫 Teachers', href: '/teachers' },
      { label: '💰 Staff Payroll', href: '/finance/payroll' },
      { label: '📄 Student Invoices', href: '/finance/billing/invoices' },
      { label: '📖 Qur\'an Programs', href: '/qms/programs' },
      { label: '⚙️ System Users', href: '/users' },
      { label: '🔒 Roles & Permissions', href: '/settings/roles' },
    ];
  }, [userRole]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);



  // Perform multi-source search (Page index + Live ERP Database API records)
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const searchResults: SearchResultItem[] = [];
      const rawQ = query.trim().toLowerCase();

      // 1. Search System Navigation Pages & Sidebar Items First
      const matchedPages = SYSTEM_NAVIGATION_PAGES.filter(page => {
        const titleMatch = page.title.toLowerCase().includes(rawQ);
        const subMatch = page.subtitle?.toLowerCase().includes(rawQ);
        const kwMatch = page.keywords?.some(k => k.toLowerCase().includes(rawQ));
        return titleMatch || subMatch || kwMatch;
      });

      searchResults.push(...matchedPages);

      // 2. Fetch Database Entities in parallel via erpService & financeService
      try {
        const [studentsRes, teachersRes, workersRes, parentsRes, invoicesRes, receiptsRes] = await Promise.allSettled([
          erpService.getStudents(),
          erpService.getTeachers(),
          erpService.getWorkers(),
          erpService.getParents(),
          financeService.getInvoices(),
          financeService.getReceipts(),
        ]);

        // Process Students
        if (studentsRes.status === 'fulfilled') {
          const list = studentsRes.value.data || [];
          list.forEach((s: any) => {
            const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
            const sid = s.schoolId || s.studentId || s.admissionNumber || '';
            if (name.toLowerCase().includes(rawQ) || sid.toLowerCase().includes(rawQ)) {
              searchResults.push({
                id: `student-${s.id}`,
                title: name || `Student #${s.id}`,
                subtitle: `Student ID: ${sid || 'N/A'} • Section: ${s.sections?.[0]?.sectionCode || 'Assigned'}`,
                category: 'student',
                href: `/students/${s.id}`,
              });
            }
          });
        }

        // Process Teachers & Faculty
        if (teachersRes.status === 'fulfilled') {
          const list = teachersRes.value.data || [];
          list.forEach((t: any) => {
            const name = t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim();
            const tid = t.schoolId || t.teacherId || t.employeeId || '';
            if (name.toLowerCase().includes(rawQ) || tid.toLowerCase().includes(rawQ)) {
              searchResults.push({
                id: `teacher-${t.id}`,
                title: name || `Faculty #${t.id}`,
                subtitle: `Staff ID: ${tid || 'N/A'} • Role: ${t.specializations || t.role || 'Faculty'}`,
                category: 'teacher',
                href: `/teachers`,
              });
            }
          });
        }

        // Process Non-Teaching Workers
        if (workersRes.status === 'fulfilled') {
          const list = workersRes.value.data || [];
          list.forEach((w: any) => {
            const name = w.name || `${w.firstName || ''} ${w.lastName || ''}`.trim();
            const wid = w.schoolId || w.workerId || w.employeeId || '';
            if (name.toLowerCase().includes(rawQ) || wid.toLowerCase().includes(rawQ)) {
              searchResults.push({
                id: `worker-${w.id}`,
                title: name || `Worker #${w.id}`,
                subtitle: `Worker ID: ${wid || 'N/A'} • ${w.role || 'Support Staff'}`,
                category: 'worker',
                href: `/workers`,
              });
            }
          });
        }

        // Process Parents
        if (parentsRes.status === 'fulfilled') {
          const list = parentsRes.value.data || [];
          list.forEach((p: any) => {
            const name = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim();
            const pid = p.parentId || p.schoolId || '';
            if (name.toLowerCase().includes(rawQ) || pid.toLowerCase().includes(rawQ)) {
              searchResults.push({
                id: `parent-${p.id}`,
                title: name || `Parent #${p.id}`,
                subtitle: `Parent ID: ${pid || 'N/A'} • Children: ${p.children?.length || 0}`,
                category: 'parent',
                href: `/parents`,
              });
            }
          });
        }

        // Process Invoices
        if (invoicesRes.status === 'fulfilled') {
          const list = invoicesRes.value || [];
          list.forEach((inv: any) => {
            const invNum = inv.invoiceNumber || '';
            const stName = inv.student?.name || inv.studentName || '';
            if (invNum.toLowerCase().includes(rawQ) || stName.toLowerCase().includes(rawQ)) {
              searchResults.push({
                id: `invoice-${inv.id}`,
                title: `Invoice ${invNum || '#' + inv.id}`,
                subtitle: `Student: ${stName} • Amount: $${Number(inv.totalAmount || 0).toFixed(2)}`,
                category: 'finance',
                href: `/finance/billing/invoices`,
              });
            }
          });
        }

        // Process Receipts
        if (receiptsRes.status === 'fulfilled') {
          const list = receiptsRes.value || [];
          list.forEach((rec: any) => {
            const recNum = rec.receiptNumber || '';
            const stName = rec.student?.name || rec.studentName || '';
            if (recNum.toLowerCase().includes(rawQ) || stName.toLowerCase().includes(rawQ)) {
              searchResults.push({
                id: `receipt-${rec.id}`,
                title: `Receipt ${recNum || '#' + rec.id}`,
                subtitle: `Paid By: ${stName} • Amount: $${Number(rec.paymentAmount || 0).toFixed(2)}`,
                category: 'finance',
                href: `/finance/billing/payments`,
              });
            }
          });
        }

      } catch (err) {
        console.warn('Global Search API fetch warning:', err);
      }

      setResults(searchResults.slice(0, 20)); // Limit to top 20 relevant items
      setSelectedIndex(0);
      setIsLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, userRole]);

  const handleSelect = useCallback((item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    router.push(item.href);
  }, [router]);

  // Arrow key navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleNavigation = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, results.length - 1)));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [isOpen, results, selectedIndex, handleSelect]);

  const getIcon = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'page': return <LayoutGrid className="w-4 h-4 text-sky-400" />;
      case 'student': return <GraduationCap className="w-4 h-4 text-emerald-400" />;
      case 'teacher': return <UserCheck className="w-4 h-4 text-amber-400" />;
      case 'worker': return <Clipboard className="w-4 h-4 text-indigo-400" />;
      case 'parent': return <Heart className="w-4 h-4 text-rose-400" />;
      case 'subject': return <BookOpen className="w-4 h-4 text-cyan-400" />;
      case 'homework': return <FileText className="w-4 h-4 text-violet-400" />;
      case 'finance': return <DollarSign className="w-4 h-4 text-emerald-500" />;
      default: return <Search className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-all w-full max-w-xs justify-between group shadow-sm"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
          <span className="font-medium text-gray-400">Search Pages, Students, Staff, Fees...</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-background border border-border rounded shadow-sm text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Modal / Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/70"
            />
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[82vh]"
            >
              {/* Search Input Bar */}
              <div className="flex items-center px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <Search className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search system pages, students, staff, invoices, payroll..."
                  autoFocus
                  className="w-full bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 rounded-lg hover:bg-muted text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400 ml-2" />}
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
                {results.length > 0 ? (
                  results.map((item, index) => (
                    <button
                      key={`${item.category}-${item.id}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all',
                        index === selectedIndex
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-bold'
                          : 'hover:bg-muted/60 text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border',
                            index === selectedIndex
                              ? 'bg-white/20 border-white/30 text-white'
                              : 'bg-muted/80 border-border'
                          )}
                        >
                          {getIcon(item.category)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold truncate">{item.title}</p>
                          {item.subtitle && (
                            <p
                              className={cn(
                                'text-[11px] truncate mt-0.5 font-medium',
                                index === selectedIndex ? 'text-emerald-100' : 'text-muted-foreground'
                              )}
                            >
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <span
                          className={cn(
                            'text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border',
                            index === selectedIndex
                              ? 'bg-white/20 text-white border-white/30'
                              : 'bg-muted text-muted-foreground border-border'
                          )}
                        >
                          {item.category}
                        </span>
                        <ArrowRight className="w-4 h-4 opacity-80" />
                      </div>
                    </button>
                  ))
                ) : query.trim().length >= 2 && !isLoading ? (
                  <div className="py-12 text-center text-muted-foreground space-y-2">
                    <Layers className="w-8 h-8 mx-auto opacity-30 text-emerald-400" />
                    <p className="text-sm font-bold text-foreground">No matches found for &ldquo;{query}&rdquo;</p>
                    <p className="text-xs text-muted-foreground">Try searching for a page name (e.g. Payroll, Invoices, Students, Qur an, Attendance) or ID.</p>
                  </div>
                ) : (
                  <div className="py-6 px-4 text-center space-y-3">
                    <p className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest">
                      Quick Access System Shortcuts
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {quickAccessShortcuts.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => {
                            setIsOpen(false);
                            router.push(s.href);
                          }}
                          className="px-4 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all shadow-2xs"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <div className="flex items-center gap-3">
                  <span><kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-bold">↑</kbd> <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-bold">↓</kbd> navigate</span>
                  <span><kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-bold">Enter</kbd> select</span>
                </div>
                <span>YAHAYASCOOL Universal Search</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
