'use client';

import { useState, useEffect, useMemo } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, FileText, Settings, ChevronLeft, ChevronRight,
  LogOut, Bell, BookOpen, DollarSign, Home, Calendar, Clipboard, Bus,
  GraduationCap, UserCheck, Menu, X, Heart, BookCheck, MonitorPlay, Award,
  PenTool, BarChart3, Library, Trophy, ArrowRight, Building2, Search, Sun, Moon,
  Layers, FileSearch, ShieldCheck, Globe, HardDrive, AlignLeft, Megaphone,
  Key, Flag, LayoutGrid, ChevronDown, ChevronUp, School, MapPin, Car,
  ClipboardList, Wallet, Receipt, TrendingUp, Package, Boxes, Wrench,
  MessageSquare, Clock, UserCog, Landmark, ScrollText, BookMarked,
  HeartHandshake, UsersRound, Cpu, Fuel, AlertTriangle, Presentation,
  FolderOpen, SquareCheckBig, Star, BadgeCheck, Compass, CreditCard,
  QrCode, Coins, PiggyBank, Scale, Percent, ShoppingBag, Bed, KeyRound, ShieldAlert,
  Briefcase, Book
} from 'lucide-react';
import { useTheme } from '@/providers/theme.provider';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useMobile } from '@/hooks/useMobile';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { STORAGE_KEYS } from '@/lib/constants';
import { getUserDisplayName, getUserInitials } from '@/types/user.types';
import type { AuthUser } from '@/types/auth.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Role-specific navigation configurations
// ─────────────────────────────────────────────────────────────────────────────

const getHostelERPNav = () => ({
  title: 'Hostel ERP Suite',
  items: [
    { label: 'Hostel Dashboard', href: '/hostel?tab=dashboard', icon: LayoutDashboard },
    { label: 'Buildings & Floors', href: '/hostel?tab=buildings', icon: Building2 },
    { label: 'Rooms & Beds', href: '/hostel?tab=rooms', icon: Bed },
    { label: 'Bed Allocations', href: '/hostel?tab=allocations', icon: ClipboardList },
    { label: 'Waiting List', href: '/hostel?tab=waiting-list', icon: Users },
    { label: 'Fee Plans & Setup', href: '/hostel?tab=feeplans', icon: FileText },
    { label: 'Security Deposits', href: '/hostel?tab=deposits', icon: ShieldCheck },
    { label: 'Visitor Logs', href: '/hostel?tab=visitors', icon: KeyRound },
    { label: 'Gate Passes', href: '/hostel?tab=gatepasses', icon: ShieldAlert },
    { label: 'Attendance Logs', href: '/hostel?tab=attendance', icon: Calendar },
    { label: 'Wardens & Duty', href: '/hostel?tab=wardens', icon: UserCheck },
    { label: 'Maintenance Tickets', href: '/hostel?tab=maintenance', icon: Wrench },
    { label: 'Reports & Settings', href: '/hostel?tab=settings', icon: Settings },
  ]
});

function getSuperAdminNav(): NavSection[] {
  return [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    // DYNAMIC: Academic Sections group is injected at runtime by useSidebarSections() hook
    // The __ACADEMIC_SECTIONS__ sentinel is replaced by the AcademicSectionsGroup component
    {
      title: '__ACADEMIC_SECTIONS__',
      items: [],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Users', href: '/users', icon: Users },
        { label: 'Roles & Permissions', href: '/settings/roles', icon: ShieldCheck },
        { label: 'Audit Logs', href: '/audit-logs', icon: FileSearch },
        { label: 'Activity Logs', href: '/activity-logs', icon: AlignLeft },
        { label: 'Login Sessions', href: '/settings/sessions', icon: Key },
        { label: 'Localization', href: '/settings/languages', icon: Globe },
        { label: 'Media Library', href: '/media', icon: HardDrive },
      ],
    },
    {
      title: 'School ERP',
      items: [
        { label: 'People Directory', href: '/directory', icon: UsersRound },
        { label: 'Students', href: '/students', icon: GraduationCap },
        { label: 'Teachers', href: '/teachers', icon: UserCheck },
        { label: 'Parents', href: '/parents', icon: Heart },
        { label: 'Workers', href: '/workers', icon: Clipboard },
        { label: 'Departments', href: '/academic-structure', icon: Layers },
        { label: 'Programs', href: '/academic-structure/programs', icon: BookMarked },
        { label: 'All Sections', href: '/academic-structure/sections', icon: Boxes },
        { label: 'Grade Levels', href: '/academic-structure?tab=grade-levels', icon: Layers },
        { label: 'Academic Years', href: '/academic-structure/years', icon: Calendar },
        { label: 'Academic Terms', href: '/academic-structure/terms', icon: Clock },
        { label: 'School Calendar', href: '/calendar', icon: Calendar },
        { label: 'Admissions Hub', href: '/erp/admissions', icon: GraduationCap },
      ],
    },
    {
      title: 'Enterprise Operations ERP',
      items: [
        { label: 'Transport Logistics', href: '/transport', icon: Bus },
        { label: 'Library System', href: '/library', icon: BookOpen },
        { label: 'Inventory & Supplies', href: '/inventory', icon: Package },
        { label: 'Fixed Assets', href: '/assets', icon: Landmark },
        { label: 'Procurement & AP', href: '/procurement', icon: ShoppingBag },
      ],
    },
    getHostelERPNav(),
    {
      title: 'Academic Management',
      items: [
        { label: 'Subjects & Curriculum', href: '/lms/subjects', icon: BookOpen },
        { label: 'Course Offerings', href: '/lms/offerings', icon: GraduationCap },
        { label: 'Classes & Timetable', href: '/lms/timetables', icon: School },
        { label: 'Lesson Plans', href: '/lms/lesson-plans', icon: PenTool },
        { label: 'Homework', href: '/lms/homework', icon: BookCheck },
        { label: 'Attendance', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'Assessments & Gradebook', href: '/lms/gradebook', icon: Award },
        { label: 'Learning Resources', href: '/lms/resources', icon: Library },
      ],
    },
    {
      title: "Qur'an Department",
      items: [
        { label: 'Programs & Groups', href: '/qms/programs', icon: UsersRound },
        { label: 'Hifz Tracking', href: '/qms/memorization', icon: BookOpen },
        { label: 'Muraja\'ah', href: '/qms/revision', icon: Clipboard },
        { label: 'Tajweed', href: '/qms/tajweed', icon: PenTool },
        { label: 'Daily Halaqah', href: '/qms/halaqah', icon: BookCheck },
        { label: "Qur'an Attendance", href: '/qms/attendance', icon: SquareCheckBig },
        { label: "Da'wah Activities", href: '/qms/dawah', icon: Heart },
        { label: 'Competitions & Certs', href: '/qms/achievements', icon: Award },
      ],
    },
    {
      title: 'Language Department',
      items: [
        { label: 'Programs & Levels', href: '/llms/programs', icon: UsersRound },
        { label: 'Placement Tests', href: '/llms/placement', icon: FileText },
        { label: 'Skill Analytics', href: '/llms/skills', icon: BarChart3 },
        { label: 'Learning Portfolio', href: '/llms/portfolio', icon: FolderOpen },
        { label: 'Competitions', href: '/llms/competitions', icon: Trophy },
        { label: 'Achievements', href: '/llms/achievements', icon: Star },
      ],
    },
    {
      title: 'Assessment & Exams',
      items: [
        { label: 'Assessment Types', href: '/assessment/grading-schemes', icon: Layers },
        { label: 'Examinations', href: '/assessment/exams', icon: FileText },
        { label: 'Question Bank', href: '/assessment/question-bank', icon: Library },
        { label: 'Scheduling', href: '/assessment/scheduling', icon: Calendar },
        { label: 'Marks Entry', href: '/assessment/marks-entry', icon: PenTool },
      ],
    },
    {
      title: 'Results & Certification',
      items: [
        { label: 'Results Overview', href: '/results', icon: BarChart3 },
        { label: 'Report Cards', href: '/results/report-cards', icon: FileText },
        { label: 'Transcripts', href: '/results/transcripts', icon: ScrollText },
        { label: 'Certificates', href: '/results/certificates', icon: BadgeCheck },
        { label: 'Promotions', href: '/results/promotions', icon: ArrowRight },
        { label: 'Rankings', href: '/results/rankings', icon: Trophy },
      ],
    },
    {
      title: 'Finance ERP (Executive)',
      items: [
        { label: 'Executive Dashboard', href: '/finance', icon: DollarSign },
        { label: 'Chart of Accounts', href: '/finance/accounting/chart', icon: Scale },
        { label: 'Double-Entry Journals', href: '/finance/accounting/journals', icon: ScrollText },
        { label: 'General Ledger', href: '/finance/accounting/ledger', icon: BookMarked },
        { label: 'Bank & Cash Treasury', href: '/finance/accounting/accounts', icon: Landmark },
        { label: 'Accounting Periods', href: '/finance/accounting/periods', icon: Clock },
      ],
    },
    {
      title: 'Billing & Cashier Suite',
      items: [
        { label: 'Student Invoices', href: '/finance/billing/invoices', icon: FileText },
        { label: 'Multi-Method Payments', href: '/finance/billing/payments', icon: CreditCard },
        { label: 'Fee Structures', href: '/finance/billing/structures', icon: Layers },
        { label: 'Installment Plans', href: '/finance/billing/installments', icon: Percent },
        { label: 'Scholarships & Aid', href: '/finance/billing/scholarships', icon: Award },
        { label: 'Discounts & Rules', href: '/finance/billing/discounts', icon: Coins },
        { label: 'Cashier Sessions', href: '/finance/billing/sessions', icon: PiggyBank },
      ],
    },
    {
      title: 'Payroll, Expenses & Budgets',
      items: [
        { label: 'Staff Payroll Runs', href: '/finance/payroll', icon: Wallet },
        { label: 'Payroll Approvals', href: '/finance/payroll/approvals', icon: SquareCheckBig },
        { label: 'Expense Requests', href: '/finance/expenses', icon: Receipt },
        { label: 'Expense Approvals', href: '/finance/expenses/approvals', icon: SquareCheckBig },
        { label: 'Department Budgets', href: '/finance/budget', icon: BarChart3 },
        { label: 'Donation Campaigns', href: '/finance/donations', icon: HeartHandshake },
      ],
    },
    {
      title: 'Finance Reports & Audit',
      items: [
        { label: 'Financial Statements', href: '/finance/reports', icon: TrendingUp },
        { label: 'Audit Log & Search', href: '/finance/audit', icon: FileSearch },
        { label: 'Finance Settings', href: '/settings/finance', icon: Settings },
      ],
    },
    {
      title: 'Events & CMS',
      items: [
        { label: 'Events', href: '/cms/events', icon: Calendar },
        { label: 'Announcements', href: '/announcements', icon: Megaphone },
        { label: 'Website CMS', href: '/cms', icon: Globe },
        { label: 'Gallery', href: '/cms/gallery', icon: Package },
        { label: 'Contact Messages', href: '/cms/contact', icon: MessageSquare },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Settings', href: '/settings', icon: Settings },
        { label: 'School Profile', href: '/settings/school-profile', icon: School },
        { label: 'Integrations', href: '/settings/integrations', icon: Cpu },
      ],
    },
  ];
}

function getDirectorNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    // Dynamic Academic Sections group — injected at runtime
    { title: '__ACADEMIC_SECTIONS__', items: [] },
    {
      title: 'Academic Administration',
      items: [
        { label: 'All Subjects', href: '/lms/subjects', icon: BookOpen },
        { label: 'All Course Offerings', href: '/lms/offerings', icon: GraduationCap },
        { label: 'Timetable', href: '/lms/timetables', icon: School },
        { label: 'Lesson Plans', href: '/lms/lesson-plans', icon: PenTool },
        { label: 'Homework', href: '/lms/homework', icon: BookCheck },
        { label: 'Attendance Console', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'Gradebook Console', href: '/lms/gradebook', icon: Award },
        { label: 'Resources', href: '/lms/resources', icon: Library },
        { label: 'Academic Structure', href: '/academic-structure', icon: Layers },
      ],
    },
    {
      title: 'People',
      items: [
        { label: 'Teachers', href: '/teachers', icon: UserCheck },
        { label: 'Students', href: '/students', icon: GraduationCap },
        { label: 'Parents', href: '/parents', icon: Heart },
        { label: 'Departments', href: '/academic-structure', icon: Layers },
      ],
    },
    {
      title: "Qur'an Department",
      items: [
        { label: 'Programs & Groups', href: '/qms/programs', icon: UsersRound },
        { label: 'Hifz Progress', href: '/qms/memorization', icon: BookOpen },
        { label: 'Attendance', href: '/qms/attendance', icon: SquareCheckBig },
        { label: 'Achievements', href: '/qms/achievements', icon: Award },
      ],
    },
    {
      title: 'Language Department',
      items: [
        { label: 'Programs & Levels', href: '/llms/programs', icon: UsersRound },
        { label: 'Skill Analytics', href: '/llms/skills', icon: BarChart3 },
        { label: 'Achievements', href: '/llms/achievements', icon: Star },
      ],
    },
    {
      title: 'Assessments',
      items: [
        { label: 'Examinations', href: '/assessment/exams', icon: FileText },
        { label: 'Marks Entry', href: '/assessment/marks-entry', icon: PenTool },
        { label: 'Scheduling', href: '/assessment/scheduling', icon: Calendar },
      ],
    },
    {
      title: 'Results',
      items: [
        { label: 'Report Cards', href: '/results/report-cards', icon: FileText },
        { label: 'Promotions', href: '/results/promotions', icon: ArrowRight },
        { label: 'Rankings', href: '/results/rankings', icon: Trophy },
        { label: 'Certificates', href: '/results/certificates', icon: BadgeCheck },
      ],
    },
    getHostelERPNav(),
    {
      title: 'Executive Finance (Read-Only)',
      items: [
        { label: 'Executive Dashboard', href: '/finance', icon: DollarSign },
        { label: 'Department Budgets', href: '/finance/budget', icon: BarChart3 },
        { label: 'Financial Statements', href: '/finance/reports', icon: TrendingUp },
        { label: 'Waqf Donations', href: '/finance/donations', icon: HeartHandshake },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Events', href: '/cms/events', icon: Calendar },
        { label: 'Announcements', href: '/announcements', icon: Megaphone },
        { label: 'Profile', href: '/profile', icon: UserCog },
      ],
    },
  ];
}

function getTeacherNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Course Offering Portal', href: '/dashboard', icon: LayoutDashboard }] },
    {
      title: 'Academic Workspace',
      items: [
        { label: 'My Course Offerings', href: '/dashboard', icon: BookOpen },
        { label: 'My Timetable', href: '/lms/timetables', icon: School },
        { label: 'Lesson Plans', href: '/lms/lesson-plans', icon: PenTool },
        { label: 'Teaching Workload', href: '/lms/teacher/workload', icon: BarChart3 },
        { label: 'Curriculum Progress', href: '/lms/curriculum', icon: Clipboard },
        { label: 'Homework', href: '/lms/homework', icon: BookCheck },
      ],
    },
    {
      title: "Qur'an",
      items: [
        { label: "Qur'an Groups", href: '/qms/programs', icon: UsersRound },
        { label: 'Hifz Tracking', href: '/qms/memorization', icon: BookOpen },
        { label: 'Murajaah', href: '/qms/revision', icon: Clipboard },
        { label: 'Tajweed', href: '/qms/tajweed', icon: PenTool },
        { label: 'Halaqah', href: '/qms/halaqah', icon: BookCheck },
        { label: "Qur'an Attendance", href: '/qms/attendance', icon: SquareCheckBig },
      ],
    },
    {
      title: 'Languages',
      items: [
        { label: 'Language Programs', href: '/llms/programs', icon: UsersRound },
        { label: 'Student Skills', href: '/llms/skills', icon: BarChart3 },
        { label: 'Portfolio', href: '/llms/portfolio', icon: FolderOpen },
      ],
    },
    {
      title: 'Communication',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Announcements', href: '/announcements', icon: Megaphone },
        { label: 'Events', href: '/cms/events', icon: Calendar },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'My Profile', href: '/profile', icon: UserCog },
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];
}

function getStudentNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    {
      title: 'My Academics',
      items: [
        { label: 'My Profile', href: '/profile', icon: UserCog },
        { label: 'My Timetable', href: '/lms/timetables', icon: School },
        { label: 'My Subjects', href: '/lms/subjects', icon: BookOpen },
        { label: 'Homework', href: '/lms/homework', icon: BookCheck },
        { label: 'Attendance', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'My Results', href: '/results/report-cards', icon: FileText },
        { label: 'Transcripts', href: '/dashboard?view=transcript', icon: ScrollText },
        { label: 'Certificates', href: '/results/certificates', icon: BadgeCheck },
        { label: 'Achievements', href: '/results/rankings', icon: Trophy },
      ],
    },
    {
      title: "Qur'an Progress",
      items: [
        { label: 'Hifz Progress', href: '/qms/memorization', icon: BookOpen },
        { label: 'Murajaah', href: '/qms/revision', icon: Clipboard },
        { label: 'Achievements', href: '/qms/achievements', icon: Award },
      ],
    },
    {
      title: 'Language Progress',
      items: [
        { label: 'Arabic', href: '/llms/skills', icon: Globe },
        { label: 'Portfolio', href: '/llms/portfolio', icon: FolderOpen },
        { label: 'Achievements', href: '/llms/achievements', icon: Star },
      ],
    },
    {
      title: 'My Fees & Ledger',
      items: [
        { label: 'Financial Ledger', href: '/finance/billing/ledger', icon: ScrollText },
        { label: 'Payment Receipts', href: '/finance/billing/payments', icon: Receipt },
      ],
    },
    {
      title: 'Communication',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Events', href: '/cms/events', icon: Calendar },
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];
}

function getParentNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    {
      title: 'My Children',
      items: [
        { label: 'Children Overview', href: '/students', icon: GraduationCap },
        { label: 'Attendance', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'Homework', href: '/lms/homework', icon: BookCheck },
        { label: 'Results', href: '/results/report-cards', icon: FileText },
        { label: 'Certificates', href: '/results/certificates', icon: BadgeCheck },
        { label: 'Behavior Reports', href: '/results/rankings', icon: AlertTriangle },
      ],
    },
    {
      title: 'Progress',
      items: [
        { label: "Qur'an Progress", href: '/qms/memorization', icon: BookOpen },
        { label: 'Language Progress', href: '/llms/skills', icon: Globe },
        { label: 'Achievements', href: '/llms/achievements', icon: Star },
      ],
    },
    {
      title: 'Parent Payment Center',
      items: [
        { label: 'Payment Center & Balances', href: '/finance/parent-center', icon: DollarSign },
        { label: 'Invoices & Installments', href: '/finance/billing/invoices', icon: FileText },
        { label: 'Receipts & Verification', href: '/finance/billing/payments', icon: QrCode },
      ],
    },
    {
      title: 'Communication & Events',
      items: [
        { label: 'Events', href: '/cms/events', icon: Calendar },
        { label: 'Announcements', href: '/announcements', icon: Megaphone },
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];
}

function getAccountantNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Finance Dashboard', href: '/finance', icon: LayoutDashboard }] },
    {
      title: 'Billing & Cashier Suite',
      items: [
        { label: 'Student Invoices', href: '/finance/billing/invoices', icon: FileText },
        { label: 'Multi-Method Payments', href: '/finance/billing/payments', icon: CreditCard },
        { label: 'Fee Structures', href: '/finance/billing/structures', icon: Layers },
        { label: 'Installment Plans', href: '/finance/billing/installments', icon: Percent },
        { label: 'Scholarships & Aid', href: '/finance/billing/scholarships', icon: Award },
        { label: 'Discounts & Rules', href: '/finance/billing/discounts', icon: Coins },
        { label: 'Cashier Sessions', href: '/finance/billing/sessions', icon: PiggyBank },
      ],
    },
    getHostelERPNav(),
    {
      title: 'Accounting Engine',
      items: [
        { label: 'Chart of Accounts', href: '/finance/accounting/chart', icon: Scale },
        { label: 'Journal Entries', href: '/finance/accounting/journals', icon: ScrollText },
        { label: 'General Ledger', href: '/finance/accounting/ledger', icon: BookMarked },
        { label: 'Bank & Cash Treasury', href: '/finance/accounting/accounts', icon: Landmark },
      ],
    },
    {
      title: 'Operations & Payroll',
      items: [
        { label: 'Expense Requisitions', href: '/finance/expenses', icon: Receipt },
        { label: 'Payroll Runs', href: '/finance/payroll', icon: Wallet },
        { label: 'Department Budgets', href: '/finance/budget', icon: BarChart3 },
        { label: 'Donations', href: '/finance/donations', icon: HeartHandshake },
        { label: 'Financial Reports', href: '/finance/reports', icon: TrendingUp },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Profile', href: '/profile', icon: UserCog },
      ],
    },
  ];
}

function getAccountLeadNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Executive Dashboard', href: '/finance', icon: LayoutDashboard }] },
    {
      title: 'Executive Approvals',
      items: [
        { label: 'Payroll Approvals', href: '/finance/payroll/approvals', icon: SquareCheckBig },
        { label: 'Expense Approvals', href: '/finance/expenses/approvals', icon: SquareCheckBig },
        { label: 'Budget Approvals', href: '/finance/budget/approvals', icon: Landmark },
        { label: 'Accounting Periods', href: '/finance/accounting/periods', icon: Clock },
      ],
    },
    {
      title: 'Treasury & Accounting',
      items: [
        { label: 'Chart of Accounts', href: '/finance/accounting/chart', icon: Scale },
        { label: 'Double-Entry Journals', href: '/finance/accounting/journals', icon: ScrollText },
        { label: 'General Ledger', href: '/finance/accounting/ledger', icon: BookMarked },
        { label: 'Bank & Cash Treasury', href: '/finance/accounting/accounts', icon: Landmark },
        { label: 'Cashier Sessions', href: '/finance/billing/sessions', icon: PiggyBank },
      ],
    },
    {
      title: 'Billing & Aid Suite',
      items: [
        { label: 'Student Invoices', href: '/finance/billing/invoices', icon: FileText },
        { label: 'Multi-Method Payments', href: '/finance/billing/payments', icon: CreditCard },
        { label: 'Fee Structures', href: '/finance/billing/structures', icon: Layers },
        { label: 'Scholarships & Aid', href: '/finance/billing/scholarships', icon: Award },
        { label: 'Discounts & Rules', href: '/finance/billing/discounts', icon: Coins },
      ],
    },
    getHostelERPNav(),
    {
      title: 'Audit & Reports',
      items: [
        { label: 'Financial Statements', href: '/finance/reports', icon: TrendingUp },
        { label: 'Immutable Audit Trail', href: '/finance/audit', icon: FileSearch },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Profile', href: '/profile', icon: UserCog },
        { label: 'Settings', href: '/settings/finance', icon: Settings },
      ],
    },
  ];
}

function getWorkerNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    {
      title: 'My Work',
      items: [
        { label: 'Tasks', href: '/tasks', icon: ClipboardList },
        { label: 'Attendance', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'Leave', href: '/leave', icon: Calendar },
        { label: 'Salary', href: '/finance/payroll', icon: Wallet },
        { label: 'Documents', href: '/documents', icon: FolderOpen },
      ],
    },
    getHostelERPNav(),
    {
      title: 'Communication',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Profile', href: '/profile', icon: UserCog },
      ],
    },
  ];
}

function getDriverNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    {
      title: 'My Routes',
      items: [
        { label: 'Routes', href: '/transport/routes', icon: MapPin },
        { label: 'My Students', href: '/students', icon: GraduationCap },
        { label: 'Attendance', href: '/lms/attendance', icon: SquareCheckBig },
        { label: 'Vehicle', href: '/transport/vehicle', icon: Car },
        { label: 'Maintenance', href: '/transport/maintenance', icon: Wrench },
        { label: 'Fuel Log', href: '/transport/fuel', icon: Fuel },
      ],
    },
    {
      title: 'Communication',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Emergency Contacts', href: '/transport/emergency', icon: AlertTriangle },
        { label: 'Profile', href: '/profile', icon: UserCog },
      ],
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Head & Registrar Navigations
// ─────────────────────────────────────────────────────────────────────────────

function getSectionHeadNav(sectionId?: string): NavSection[] {
  const basePrefix = sectionId ? `/academic/sections/${sectionId}` : '';

  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    // Dynamic: shows only sections this teacher is head of
    { title: '__ACADEMIC_SECTIONS__', items: [] },
    // My Section items — only shown when inside a section workspace (sectionId extracted from URL)
    // On the console, the Academic Sections group above gives direct section access
    ...(sectionId ? [{
      title: 'My Section',
      items: [
        { label: 'Overview',          href: `${basePrefix}`,               icon: BarChart3 },
        { label: 'Grade Levels',      href: `${basePrefix}/grade-levels`,  icon: Layers },
        { label: 'Subjects',          href: `${basePrefix}/subjects`,      icon: BookOpen },
        { label: 'Course Offerings',  href: `${basePrefix}/offerings`,     icon: GraduationCap },
        { label: 'My Teachers',       href: `${basePrefix}/teachers`,      icon: UserCheck },
        { label: 'My Students',       href: `${basePrefix}/students`,      icon: Users },
        { label: 'Attendance',        href: `${basePrefix}/attendance`,    icon: SquareCheckBig },
        { label: 'Gradebook',         href: `${basePrefix}/gradebook`,     icon: Award },
        { label: 'Assessments',       href: `${basePrefix}/assessments`,   icon: PenTool },
        { label: 'Timetable',         href: `${basePrefix}/timetable`,     icon: School },
        { label: 'Transcripts',       href: `${basePrefix}/transcripts`,   icon: ScrollText },
        { label: 'Analytics',         href: `${basePrefix}/analytics`,     icon: BarChart3 },
      ],
    }] : []),
    // Transcripts is accessible globally — redirects to the section head's first managed section
    ...(!sectionId ? [{
      title: 'Tools',
      items: [
        { label: 'Transcripts', href: '/lms/transcripts', icon: ScrollText },
      ],
    }] : []),
    {
      title: 'Communication',
      items: [
        { label: 'Messages',       href: '/messages',       icon: MessageSquare },
        { label: 'Notifications',  href: '/notifications',  icon: Bell },
        { label: 'Announcements',  href: '/announcements',  icon: Megaphone },
        { label: 'Profile',        href: '/profile',        icon: UserCog },
      ],
    },
  ];
}

function getRegistrarNav(): NavSection[] {
  return [
    { title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    { title: '__ACADEMIC_SECTIONS__', items: [] },
    {
      title: 'Enrollment & Records',
      items: [
        { label: 'Students', href: '/students', icon: GraduationCap },
        { label: 'Student Enrollments', href: '/lms/offerings', icon: Clipboard },
        { label: 'Admissions', href: '/erp/admissions', icon: GraduationCap },
        { label: 'Academic Structure', href: '/academic-structure', icon: Layers },
      ],
    },
    {
      title: 'Results & Certification',
      items: [
        { label: 'Results Overview', href: '/results', icon: BarChart3 },
        { label: 'Report Cards', href: '/results/report-cards', icon: FileText },
        { label: 'Transcripts', href: '/results/transcripts', icon: ScrollText },
        { label: 'Certificates', href: '/results/certificates', icon: BadgeCheck },
        { label: 'Promotions', href: '/results/promotions', icon: ArrowRight },
        { label: 'Grade Moderation', href: '/results/approvals', icon: Award },
        { label: 'Academic Appeals', href: '/results/appeals', icon: FileText },
        { label: 'Graduation Records', href: '/results/rankings', icon: Trophy },
        { label: 'Academic Clearance', href: '/directory/clearance', icon: ShieldCheck },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Profile', href: '/profile', icon: UserCog },
      ],
    },
  ];
}

function getNavForRole(role: string | undefined, pathname?: string): NavSection[] {
  let nav: NavSection[] = [];
  
  // Extract sectionId from pathname if we are on a section page
  // Path pattern: /academic/sections/[sectionId]
  let sectionId: string | undefined;
  if (pathname) {
    const match = pathname.match(/\/academic\/sections\/([^\/]+)/);
    if (match) {
      sectionId = match[1];
    }
  }

  switch (role) {
    case 'super-administrator': nav = getSuperAdminNav(); break;
    case 'director':            nav = getDirectorNav(); break;
    case 'section-head':        nav = getSectionHeadNav(sectionId); break;
    case 'registrar':           nav = getRegistrarNav(); break;
    case 'teacher':             nav = getTeacherNav(); break;
    case 'student':             nav = getStudentNav(); break;
    case 'parent':              nav = getParentNav(); break;
    case 'accountant':          nav = getAccountantNav(); break;
    case 'account-lead':        nav = getAccountLeadNav(); break;
    case 'worker':              nav = getWorkerNav(); break;
    case 'driver':              nav = getDriverNav(); break;
    default:                    nav = [{ title: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] }]; break;
  }

  if (role === 'super-administrator' || role === 'director' || role === 'teacher') {
    nav = nav.map(section => {
      if (section.title === 'Academic Management') {
        const hasCurr = section.items.some(i => i.href === '/lms/curriculum');
        if (!hasCurr) {
          return {
            ...section,
            items: [
              ...section.items,
              { label: 'Curriculum Outlines', href: '/lms/curriculum', icon: Compass },
              { label: 'Teacher Workload', href: '/lms/teacher/workload', icon: Briefcase }
            ]
          };
        }
      }
      if (section.title === 'Results & Certification') {
        const hasAppr = section.items.some(i => i.href === '/results/approvals');
        if (!hasAppr) {
          return {
            ...section,
            items: [
              ...section.items,
              { label: 'Grade Moderation', href: '/results/approvals', icon: Award },
              { label: 'Retakes & Appeals', href: '/results/appeals', icon: FileText }
            ]
          };
        }
      }
      if (section.title === "Qur'an Department") {
        const hasHifz = section.items.some(i => i.href === '/qms/hifz-profile');
        if (!hasHifz) {
          return {
            ...section,
            items: [
              ...section.items,
              { label: 'Quran Hifz Portal', href: '/qms/hifz-profile', icon: Book }
            ]
          };
        }
      }
      return section;
    });

    const hasClearance = nav.some(s => s.items.some(i => i.href === '/directory/clearance'));
    if (!hasClearance) {
      nav.push({
        title: 'Enterprise Audits',
        items: [
          { label: 'Academic Clearance', href: '/directory/clearance', icon: ShieldCheck },
          { label: 'AI Advisor Alerts', href: '/dashboard/advisor', icon: Cpu }
        ]
      });
    }
  }

  return nav;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Academic Sections Sidebar Group
// Fetches all published sections from Strapi and renders clickable workspace links
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_TYPE_ICONS: Record<string, string> = {
  quran: '📖',
  language: '🌐',
  stem: '🔬',
  islamic: '🕌',
  sports: '⚽',
  arts: '🎨',
  vocational: '🔧',
  general: '📚',
  other: '📚',
};

function AcademicSectionsNav({
  isCollapsed,
  isActive,
  locale,
  user,
  role,
}: {
  isCollapsed: boolean;
  isActive: (href: string) => boolean;
  locale: string;
  user: any;
  role: string | undefined;
}) {
  const [sections, setSections] = useState<Array<{
    id: number; documentId: string; name: string; code: string;
    color?: string; sectionType?: string;
  }>>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Fetch sections from the public Strapi endpoint
    // We use fetch directly to avoid circular dependency issues
    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
    const token = typeof document !== 'undefined'
      ? document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')?.[1]
      : null;
    
    // If the role is section-head, we filter sections down to only those led by this user
    let fetchUrl = `${baseUrl}/api/sections?locale=${locale}&populate=*&pagination[limit]=30&sort=name:asc`;
    if (role === 'section-head' && user?.id) {
      fetchUrl += `&filters[academicHead][user][id][$eq]=${user.id}`;
    }

    fetch(fetchUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        const items = data?.data ?? [];
        setSections(items);
      })
      .catch(() => {/* silently fail */});
  }, [locale, role, user]);

  const sectionTitle = locale === 'ar' ? 'المراحل الأكاديمية' : 'Academic Sections';

  if (sections.length === 0) return null;

  return (
    <div className="mb-1">
      {!isCollapsed && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 hover:text-muted-foreground transition-colors"
        >
          <span>{sectionTitle}</span>
          {isExpanded
            ? <ChevronUp className="w-3 h-3" />
            : <ChevronDown className="w-3 h-3" />}
        </button>
      )}
      <AnimatePresence initial={false}>
        {(isCollapsed || isExpanded) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-0.5"
          >
            {sections.map(sec => {
              const href = `/academic/sections/${sec.documentId}`;
              const active = isActive(href) || (typeof window !== 'undefined' && window.location.pathname.includes(`/academic/sections/${sec.documentId}`));
              const emoji = SECTION_TYPE_ICONS[sec.sectionType ?? 'general'] ?? '📚';
              const dotColor = sec.color || '#6366f1';
              return (
                <Link
                  key={sec.documentId}
                  href={href}
                  title={isCollapsed ? sec.name : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl transition-all duration-150 group relative',
                    isCollapsed ? 'h-10 w-10 mx-auto justify-center' : 'px-3 py-2',
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {isCollapsed ? (
                    <span className="text-base leading-none">{emoji}</span>
                  ) : (
                    <>
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: dotColor }}
                      />
                      <AnimatePresence>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-sm font-medium truncate flex-1"
                        >
                          {sec.name}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-[10px] font-bold opacity-40 flex-shrink-0">{sec.code}</span>
                    </>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2 py-1 rounded-lg bg-popover border border-border shadow-lg text-xs font-medium text-popover-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {sec.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar Component
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarProps {
  className?: string;
}

const getSectionIconAndColor = (title: string) => {
  const normalized = title.toLowerCase();
  
  if (normalized.includes('overview') || normalized.includes('dashboard')) {
    return { icon: LayoutGrid, color: 'text-sky-500 bg-sky-500/10 dark:bg-sky-500/20' };
  }
  if (normalized.includes('administration') || normalized.includes('system') || normalized.includes('settings')) {
    return { icon: Settings, color: 'text-slate-500 bg-slate-500/10 dark:bg-slate-500/20' };
  }
  if (normalized.includes('school erp') || normalized.includes('people') || normalized.includes('academic administration')) {
    return { icon: School, color: 'text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20' };
  }
  if (normalized.includes('operations erp') || normalized.includes('hostel') || normalized.includes('transport') || normalized.includes('operations')) {
    if (normalized.includes('payroll') || normalized.includes('expenses') || normalized.includes('budgets')) {
      return { icon: Coins, color: 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/20' };
    }
    return { icon: Landmark, color: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/20' };
  }
  if (normalized.includes('academic management') || normalized.includes('academic workspace') || normalized.includes('my academics')) {
    return { icon: BookOpen, color: 'text-violet-500 bg-violet-500/10 dark:bg-violet-500/20' };
  }
  if (normalized.includes('qur\'an') || normalized.includes('halaqah')) {
    return { icon: BookCheck, color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20' };
  }
  if (normalized.includes('language') || normalized.includes('placement')) {
    return { icon: Globe, color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20' };
  }
  if (normalized.includes('assessment') || normalized.includes('exam')) {
    return { icon: ClipboardList, color: 'text-pink-500 bg-pink-500/10 dark:bg-pink-500/20' };
  }
  if (normalized.includes('results') || normalized.includes('cert')) {
    return { icon: Award, color: 'text-teal-500 bg-teal-500/10 dark:bg-teal-500/20' };
  }
  if (normalized.includes('finance') || normalized.includes('billing') || normalized.includes('payroll') || normalized.includes('cashier') || normalized.includes('accounting') || normalized.includes('expenses') || normalized.includes('ledger') || normalized.includes('payment') || normalized.includes('budget')) {
    return { icon: Coins, color: 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/20' };
  }
  if (normalized.includes('cms') || normalized.includes('event')) {
    return { icon: Megaphone, color: 'text-fuchsia-500 bg-fuchsia-500/10 dark:bg-fuchsia-500/20' };
  }
  
  return { icon: Layers, color: 'text-slate-400 bg-slate-500/5 dark:bg-slate-500/10' };
};

export function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useMobile();

  const t = useTranslations('navigation');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const getTranslatedLabel = (label: string) => {
    const labelKeyMap: Record<string, string> = {
      'Dashboard': 'dashboard',
      'Users': 'users',
      'Students': 'students',
      'Teachers': 'teachers',
      'Parents': 'parents',
      'Workers': 'workers',
      'Staff': 'workers',
      'Finance': 'finance',
      'Hostel': 'hostel',
      'Exams': 'exams',
      'Attendance': 'attendance',
      'Timetable': 'timetable',
      'Events': 'events',
      'Qur\'an': 'quran',
      'Messages': 'messages',
      'Notifications': 'notifications',
      'Audit Logs': 'auditLogs',
      'Settings': 'settings',
      'School Profile': 'schoolProfile',
      'Roles & Permissions': 'roles',
      'Reports': 'reports',
    };
    const key = labelKeyMap[label];
    if (key && t.has(key)) {
      return t(key);
    }

    const localDict: Record<string, Record<string, string>> = {
      ar: {
        'Activity Logs': 'سجلات الأنشطة',
        'Login Sessions': 'جلسات تسجيل الدخول',
        'Localization': 'الترجمة واللغات',
        'Media Library': 'مكتبة الوسائط',
        'People Directory': 'دليل الأشخاص',
        'Departments': 'الأقسام والمستويات',
        'Programs': 'البرامج الدراسية',
        'Academic Sections': 'المراحل الدراسية',
        'Academic Years': 'السنوات الدراسية',
        'Academic Terms': 'الفصول الدراسية',
        'School Calendar': 'التقويم المدرسي',
        'Admissions Hub': 'مركز القبول',
        'Admissions ERP': 'نظام القبول',
        'Transport Logistics': 'الخدمات اللوجستية والنقل',
        'Library System': 'نظام المكتبة',
        'Inventory & Supplies': 'المخزون والمستلزمات',
        'Fixed Assets': 'الأصول الثابتة',
        'Procurement & AP': 'المشتريات والحسابات الدائنة',
        'Hostel Dashboard': 'لوحة السكن',
        'Buildings & Floors': 'المباني والطوابق',
        'Rooms & Beds': 'الغرف والأسرة',
        'Bed Allocations': 'توزيع الأسرة',
        'Waiting List': 'قائمة الانتظار',
        'Fee Plans & Setup': 'خطط الرسوم',
        'Security Deposits': 'التأمينات المستردة',
        'Visitor Logs': 'سجلات الزوار',
        'Gate Passes': 'تصاريح البوابات',
        'Attendance Logs': 'سجلات الحضور',
        'Wardens & Duty': 'المشرفون والمناوبات',
        'Maintenance Tickets': 'طلبات الصيانة',
        'Reports & Settings': 'التقارير والإعدادات',
        'Subjects & Curriculum': 'المواد والمناهج',
        'Course Offerings': 'المواد المطروحة',
        'Classes & Timetable': 'الفصول والجدول',
        'Lesson Plans': 'خطط الدروس',
        'Homework': 'الواجبات المنزلية',
        'Attendance': 'الحضور والغياب',
        'Assessments & Gradebook': 'التقييمات ودفتر الدرجات',
        'Learning Resources': 'مصادر التعلم',
        'Curriculum Outlines': 'الخطط الدراسية',
        'Teacher Workload': 'العبء الدراسي للمعلم',
        'Programs & Groups': 'البرامج والمجموعات',
        'Hifz Tracking': 'متابعة الحفظ',
        "Muraja'ah": 'المراجعة والتمكين',
        'Tajweed': 'التجويد المخارج',
        'Daily Halaqah': 'الحلقة اليومية',
        "Qur'an Attendance": 'حضور القرآن',
        "Da'wah Activities": 'الأنشطة الدعوية',
        'Competitions & Certs': 'المسابقات والشهادات',
        'Quran Hifz Portal': 'بوابة حفظ القرآن',
        'Programs & Levels': 'البرامج والمستويات',
        'Placement Tests': 'اختبارات تحديد المستوى',
        'Skill Analytics': 'تحليل المهارات',
        'Learning Portfolio': 'الملف التعليمي',
        'Competitions': 'المسابقات والجوائز',
        'Achievements': 'الإنجازات المدرسية',
        'Assessment Types': 'أنواع التقييمات',
        'Examinations': 'الامتحانات والتقييم',
        'Question Bank': 'بنك الأسئلة',
        'Scheduling': 'جدولة الامتحانات',
        'Marks Entry': 'رصد الدرجات',
        'Results Overview': 'نظرة عامة على النتائج',
        'Report Cards': 'الشهادات المدرسية',
        'Transcripts': 'كشوف الدرجات',
        'Certificates': 'الشهادات المعتمدة',
        'Promotions': 'الترقيات والترفيع',
        'Rankings': 'الترتيب والمراكز',
        'Grade Moderation': 'اعتماد الدرجات',
        'Retakes & Appeals': 'الإعادات والاعتراضات',
        'Executive Dashboard': 'لوحة التحكم التنفيذية',
        'Chart of Accounts': 'شجرة الحسابات',
        'Double-Entry Journals': 'قيود اليومية',
        'General Ledger': 'دفتر الأستاذ العام',
        'Bank & Cash Treasury': 'الخزينة والحسابات البنكية',
        'Accounting Periods': 'الفترات المالية',
        'Student Invoices': 'فواتير الطلاب',
        'Multi-Method Payments': 'الدفع متعدد الوسائل',
        'Fee Structures': 'هياكل الرسوم',
        'Installment Plans': 'خطط التقسيط',
        'Scholarships & Aid': 'المنح والمساعدات',
        'Discounts & Rules': 'الخصومات والقواعد',
        'Cashier Sessions': 'جلسات الصندوق',
        'Staff Payroll Runs': 'مسيرات الرواتب',
        'Payroll Approvals': 'موافقات الرواتب',
        'Expense Requests': 'طلبات المصروفات',
        'Expense Approvals': 'موافقات المصروفات',
        'Department Budgets': 'ميزانيات الأقسام',
        'Donation Campaigns': 'حملات التبرعات',
        'Financial Statements': 'القوائم المالية',
        'Audit Log & Search': 'دفتر التدقيق والبحث',
        'Finance Settings': 'إعدادات المالية',
        'Events': 'الفعاليات والنشاطات',
        'Announcements': 'الإعلانات والتعاميم',
        'Website CMS': 'إدارة محتوى الموقع',
        'Gallery': 'معرض الصور',
        'Contact Messages': 'رسائل التواصل',
        'Settings': 'الإعدادات العامة',
        'School Profile': 'ملف المدرسة التعريف',
        'Integrations': 'الربط البرمجي والأنظمة',
        'Academic Clearance': 'المخالصة الأكاديمية',
        'AI Advisor Alerts': 'تنبيهات مستشار الذكاء الاصطناعي',
        'Course Offering Portal': 'بوابة المواد المطروحة',
        'My Course Offerings': 'مواد التدريس المطروحة',
        'Academic Workspace': 'مساحة العمل الأكاديمية',
        'Curriculum Progress': 'تقدم المنهج الدراسي',
        'Teaching Workload': 'العبء التدريسي',
      },
      fr: {
        'Activity Logs': "Journaux d'activité",
        'Login Sessions': 'Sessions de connexion',
        'Localization': 'Localisation',
        'Media Library': 'Médiathèque',
        'People Directory': 'Annuaire des personnes',
        'Departments': 'Départements',
        'Programs': 'Programmes',
        'Academic Sections': 'Sections académiques',
        'Academic Years': 'Années académiques',
        'Academic Terms': 'Trimestres académiques',
        'School Calendar': 'Calendrier scolaire',
        'Admissions Hub': 'Portail des admissions',
        'Admissions ERP': 'ERP des admissions',
        'Transport Logistics': 'Transport et Logistique',
        'Library System': 'Système de bibliothèque',
        'Inventory & Supplies': 'Inventaire et Fournitures',
        'Fixed Assets': 'Immobilisations',
        'Procurement & AP': 'Achats et Dépenses',
        'Hostel Dashboard': "Tableau d'hébergement",
        'Buildings & Floors': 'Bâtiments et Étages',
        'Rooms & Beds': 'Chambres et Lits',
        'Bed Allocations': 'Allocations de lits',
        'Waiting List': "Liste d'attente",
        'Fee Plans & Setup': 'Plans de frais',
        'Security Deposits': 'Dépôts de sécurité',
        'Visitor Logs': 'Registre des visiteurs',
        'Gate Passes': 'Laisser-passer',
        'Attendance Logs': 'Registres de présence',
        'Wardens & Duty': 'Gardiens et Devoirs',
        'Maintenance Tickets': 'Tickets de maintenance',
        'Reports & Settings': 'Rapports et Paramètres',
        'Subjects & Curriculum': 'Matières et Curriculum',
        'Course Offerings': 'Offres de cours',
        'Classes & Timetable': 'Classes et Emplois du temps',
        'Lesson Plans': 'Plans de cours',
        'Homework': 'Devoirs',
        'Attendance': 'Présence',
        'Assessments & Gradebook': 'Évaluations et Notes',
        'Learning Resources': "Ressources d'apprentissage",
        'Curriculum Outlines': 'Grandes lignes du curriculum',
        'Teacher Workload': "Charge de travail de l'enseignant",
        'Programs & Groups': 'Programmes et Groupes',
        'Hifz Tracking': 'Suivi de la mémorisation',
        "Muraja'ah": 'Révision',
        'Tajweed': 'Tajweed',
        'Daily Halaqah': 'Halaqah quotidienne',
        "Qur'an Attendance": 'Présence au Coran',
        "Da'wah Activities": "Activités de Da'wah",
        'Competitions & Certs': 'Compétitions et Certificats',
        'Quran Hifz Portal': 'Portail de mémorisation du Coran',
        'Programs & Levels': 'Programmes et Niveaux',
        'Placement Tests': 'Tests de placement',
        'Skill Analytics': 'Analyses de compétences',
        'Learning Portfolio': "Portfolio d'apprentissage",
        'Competitions': 'Compétitions',
        'Achievements': 'Réalisations',
        'Assessment Types': "Types d'évaluation",
        'Examinations': 'Examens',
        'Question Bank': 'Banque de questions',
        'Scheduling': 'Planification',
        'Marks Entry': 'Saisie des notes',
        'Results Overview': 'Aperçu des résultats',
        'Report Cards': 'Bulletins de notes',
        'Transcripts': 'Relevés de notes',
        'Certificates': 'Certificats',
        'Promotions': 'Promotions',
        'Rankings': 'Classements',
        'Grade Moderation': 'Modération des notes',
        'Retakes & Appeals': 'Rattrapages et Appels',
        'Executive Dashboard': 'Tableau de bord exécutif',
        'Chart of Accounts': 'Plan comptable',
        'Double-Entry Journals': "Journaux d'écriture",
        'General Ledger': 'Grand livre',
        'Bank & Cash Treasury': 'Trésorerie et Banque',
        'Accounting Periods': 'Périodes comptables',
        'Student Invoices': 'Factures des élèves',
        'Multi-Method Payments': 'Paiements multi-méthodes',
        'Fee Structures': 'Structures de frais',
        'Installment Plans': 'Plans de versement',
        'Scholarships & Aid': 'Bourses et Aides',
        'Discounts & Rules': 'Remises et Règles',
        'Cashier Sessions': 'Sessions de caisse',
        'Staff Payroll Runs': 'Fiches de paie',
        'Payroll Approvals': 'Approbations de paie',
        'Expense Requests': 'Demandes de dépenses',
        'Expense Approvals': 'Approbations de dépenses',
        'Department Budgets': 'Budgets par département',
        'Donation Campaigns': 'Campagnes de dons',
        'Financial Statements': 'États financiers',
        'Audit Log & Search': "Journal d'audit et Recherche",
        'Finance Settings': 'Paramètres financiers',
        'Events': 'Événements',
        'Announcements': 'Annonces',
        'Website CMS': 'CMS du site web',
        'Gallery': 'Galerie',
        'Contact Messages': 'Messages de contact',
        'Settings': 'Paramètres',
        'School Profile': "Profil de l'école",
        'Integrations': 'Intégrations',
        'Academic Clearance': 'Clairance académique',
        'AI Advisor Alerts': 'Alertes du conseiller IA',
        'Course Offering Portal': 'Portail des cours proposés',
        'My Course Offerings': 'Mes cours proposés',
        'Academic Workspace': 'Espace de travail académique',
        'Curriculum Progress': 'Progression du curriculum',
        'Teaching Workload': "Charge d'enseignement",
      },
      tr: {
        'Activity Logs': 'Aktivite Günlükleri',
        'Login Sessions': 'Oturum Yönetimi',
        'Localization': 'Yerelleştirme',
        'Media Library': 'Medya Kütüphanesi',
        'People Directory': 'Kişi Rehberi',
        'Departments': 'Bölümler',
        'Programs': 'Programlar',
        'Academic Sections': 'Akademik Seksiyonlar',
        'Academic Years': 'Akademik Yıllar',
        'Academic Terms': 'Akademik Dönemler',
        'School Calendar': 'Okul Takvimi',
        'Admissions Hub': 'Kabul Merkezi',
        'Admissions ERP': 'Kabul ERP',
        'Transport Logistics': 'Ulaşım Lojistiği',
        'Library System': 'Kütüphane Sistemi',
        'Inventory & Supplies': 'Envanter ve Malzemeler',
        'Fixed Assets': 'Sabit Varlıklar',
        'Procurement & AP': 'Satın Alma',
        'Hostel Dashboard': 'Yurt Paneli',
        'Buildings & Floors': 'Binalar ve Katlar',
        'Rooms & Beds': 'Odalar ve Yataklar',
        'Bed Allocations': 'Yatak Tahsisleri',
        'Waiting List': 'Bekleme Listesi',
        'Fee Plans & Setup': 'Ücret Planları',
        'Security Deposits': 'Güvenlik Depozitoları',
        'Visitor Logs': 'Ziyaretçi Defteri',
        'Gate Passes': 'Kapı İzinleri',
        'Attendance Logs': 'Yoklama Günlükleri',
        'Wardens & Duty': 'Nöbetçiler ve Görevler',
        'Maintenance Tickets': 'Bakım Talepleri',
        'Reports & Settings': 'Raporlar ve Ayarlar',
        'Subjects & Curriculum': 'Dersler ve Müfredat',
        'Course Offerings': 'Açılan Dersler',
        'Classes & Timetable': 'Sınıflar ve Programlar',
        'Lesson Plans': 'Ders Planları',
        'Homework': 'Ödevler',
        'Attendance': 'Yoklama',
        'Assessments & Gradebook': 'Değerlendirmeler ve Not Defteri',
        'Learning Resources': 'Öğrenme Kaynakları',
        'Curriculum Outlines': 'Müfredat Ana Hatları',
        'Teacher Workload': 'Öğretmen İş Yükü',
        'Programs & Groups': 'Programlar ve Gruplar',
        'Hifz Tracking': 'Hıfız Takibi',
        "Muraja'ah": 'Mürafaa / Tekrar',
        'Tajweed': 'Tecvid',
        'Daily Halaqah': 'Günlük Halka',
        "Qur'an Attendance": 'Kuran Yoklaması',
        "Da'wah Activities": 'Davet Faaliyetleri',
        'Competitions & Certs': 'Yarışmalar ve Belgeler',
        'Quran Hifz Portal': 'Kuran Hıfız Portalı',
        'Programs & Levels': 'Programlar ve Seviyeler',
        'Placement Tests': 'Seviye Tespit Sınavları',
        'Skill Analytics': 'Beceri Analitiği',
        'Learning Portfolio': 'Öğrenim Portföyü',
        'Competitions': 'Yarışmalar',
        'Achievements': 'Başarılar',
        'Assessment Types': 'Değerlendirme Türleri',
        'Examinations': 'Sınavlar',
        'Question Bank': 'Soru Bankası',
        'Scheduling': 'Sınav Takvimi',
        'Marks Entry': 'Not Girişi',
        'Results Overview': 'Sonuçlara Genel Bakış',
        'Report Cards': 'Karne Raporları',
        'Transcripts': 'Transkriptler',
        'Certificates': 'Sertifikalar',
        'Promotions': 'Sınıf Geçme',
        'Rankings': 'Sıralamalar',
        'Grade Moderation': 'Not Moderasyonu',
        'Retakes & Appeals': 'İtirazlar ve Bütünleme',
        'Executive Dashboard': 'Yönetici Finans Paneli',
        'Chart of Accounts': 'Hesap Planı',
        'Double-Entry Journals': 'Yevmiye Kayıtları',
        'General Ledger': 'Defter-i Kebir',
        'Bank & Cash Treasury': 'Kasa ve Banka',
        'Accounting Periods': 'Muhasebe Dönemleri',
        'Student Invoices': 'Öğrenci Faturaları',
        'Multi-Method Payments': 'Çok Yöntemli Ödemeler',
        'Fee Structures': 'Harç Yapıları',
        'Installment Plans': 'Taksit Planları',
        'Scholarships & Aid': 'Burslar ve Destekler',
        'Discounts & Rules': 'İndirimler ve Kurallar',
        'Cashier Sessions': 'Kasa Oturumları',
        'Staff Payroll Runs': 'Personel Bordroları',
        'Payroll Approvals': 'Bordro Onayları',
        'Expense Requests': 'Gider Talepleri',
        'Expense Approvals': 'Gider Onayları',
        'Department Budgets': 'Bölüm Bütçeleri',
        'Donation Campaigns': 'Bağış Kampanyaları',
        'Financial Statements': 'Finansal Tablolar',
        'Audit Log & Search': 'Denetim ve Arama',
        'Finance Settings': 'Finans Ayarları',
        'Events': 'Etkinlikler',
        'Announcements': 'Duyurular',
        'Website CMS': 'Web Sitesi CMS',
        'Gallery': 'Galeri',
        'Contact Messages': 'İletişim Mesajları',
        'Settings': 'Ayarlar',
        'School Profile': 'Okul Profili',
        'Integrations': 'Entegrasyonlar',
        'Academic Clearance': 'Akademik Tahliye',
        'AI Advisor Alerts': 'YZ Danışman Uyarıları',
        'Course Offering Portal': 'Ders Teklif Portalı',
        'My Course Offerings': 'Ders Tekliflerim',
        'Academic Workspace': 'Akademik Çalışma Alanı',
        'Curriculum Progress': 'Müfredat İlerlemesi',
        'Teaching Workload': 'Öğretim Yükü',
      },
    };

    return localDict[locale]?.[label] || label;
  };

  const getTranslatedSectionTitle = (title: string) => {
    const titleKeyMap: Record<string, string> = {
      'Overview': 'overview',
      'Administration': 'administration',
      'School ERP': 'academics',
      'LMS Academics': 'academics',
      'System Settings': 'system',
      'System': 'system',
    };
    const key = titleKeyMap[title];
    if (key && t.has(key)) {
      return t(key);
    }

    const sectionDict: Record<string, Record<string, string>> = {
      ar: {
        'Academic Management': 'الإدارة الأكاديمية',
        "Qur'an Department": 'قسم القرآن الكريم',
        'Language Department': 'قسم اللغات',
        'Assessment & Exams': 'التقييم والامتحانات',
        'Results & Certification': 'النتائج والشهادات',
        'Finance ERP (Executive)': 'إدارة المالية (تنفيذي)',
        'Billing & Cashier Suite': 'نظام الفواتير والخزينة',
        'Payroll, Expenses & Budgets': 'الرواتب والمصروفات المدرسية',
        'Finance Reports & Audit': 'التقارير المالية والتدقيق',
        'Events & CMS': 'الفعاليات ومحتوى الموقع',
        'Enterprise Operations ERP': 'العمليات والخدمات اللوجستية',
        'Hostel ERP Suite': 'إدارة السكن الداخلي',
        'Enterprise Audits': 'التدقيق والتحليل الذكي',
        'Academic Workspace': 'مساحة العمل الأكاديمية',
        'My Work': 'أعمالي التدريسية',
      },
      fr: {
        'Academic Management': 'Gestion académique',
        "Qur'an Department": 'Département du Coran',
        'Language Department': 'Département des langues',
        'Assessment & Exams': 'Évaluations et Examens',
        'Results & Certification': 'Résultats et Certifications',
        'Finance ERP (Executive)': 'Finance (Exécutif)',
        'Billing & Cashier Suite': 'Facturation et Caisse',
        'Payroll, Expenses & Budgets': 'Paie, Dépenses et Budgets',
        'Finance Reports & Audit': 'Rapports financiers et Audit',
        'Events & CMS': 'Événements et CMS',
        'Enterprise Operations ERP': 'Opérations d\'entreprise',
        'Hostel ERP Suite': 'Hébergement ERP',
        'Enterprise Audits': "Audits d'entreprise",
        'Academic Workspace': 'Espace académique',
        'My Work': 'Mon espace de cours',
      },
      tr: {
        'Academic Management': 'Akademik Yönetim',
        "Qur'an Department": 'Kuran Departmanı',
        'Language Department': 'Dil Departmanı',
        'Assessment & Exams': 'Değerlendirme ve Sınavlar',
        'Results & Certification': 'Sonuçlar ve Sertifikalar',
        'Finance ERP (Executive)': 'Finans ERP (Yönetici)',
        'Billing & Cashier Suite': 'Faturalandırma ve Vezne',
        'Payroll, Expenses & Budgets': 'Bordro, Giderler ve Bütçeler',
        'Finance Reports & Audit': 'Finansal Raporlar ve Denetim',
        'Events & CMS': 'Etkinlikler ve CMS',
        'Enterprise Operations ERP': 'Operasyonel ERP',
        'Hostel ERP Suite': 'Yurt ERP',
        'Enterprise Audits': 'Kurumsal Denetim',
        'Academic Workspace': 'Akademik Çalışma Alanı',
        'My Work': 'Ders Alanım',
      }
    };

    return sectionDict[locale]?.[title] || title;
  };

  const [isCollapsed, setIsCollapsed] = useLocalStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useLocalStorage<Record<string, boolean>>('sidebar_sections', {});

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  const role = (user as any)?.role?.type as string | undefined;
  const navSections = useMemo(() => getNavForRole(role, pathname), [role, pathname]);

  const activeHref = useMemo(() => {
    let best = '';
    for (const section of navSections) {
      for (const item of section.items) {
        if (item.href.includes('?')) continue;
        if (pathname === item.href || pathname.startsWith(item.href + '/')) {
          if (item.href.length > best.length) {
            best = item.href;
          }
        }
      }
    }
    return best;
  }, [pathname, navSections]);

  const isActive = (href: string) => {
    // Precise match for query parameters (e.g. /hostel?tab=dashboard)
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      const params = new URLSearchParams(query);
      const pathMatches = pathname === path || pathname === `${path}/`;
      if (!pathMatches) return false;

      for (const [key, val] of params.entries()) {
        const paramVal = searchParams.get(key);
        if (key === 'tab' && val === 'dashboard' && !paramVal) {
          continue; // Default tab is dashboard when no query param is present
        }
        if (paramVal !== val) return false;
      }
      return true;
    }

    // Exact match for top-level pages to prevent them from staying active when on nested routes
    if (['/dashboard', '/finance', '/settings', '/results', '/directory', '/cms'].includes(href)) {
      return pathname === href || pathname === `${href}/`;
    }
    return href === activeHref;
  };

  // Auto-expand sections that contain the active page
  useEffect(() => {
    for (const section of navSections) {
      const hasActiveChild = section.items.some(item => isActive(item.href));
      if (hasActiveChild && !expandedSections[section.title]) {
        setExpandedSections(prev => ({ ...prev, [section.title]: true }));
      }
    }
  }, [pathname, searchParams, navSections]);

  // Auto scroll active item into view
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeEl = document.querySelector('.active-sidebar-item');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname, activeHref, searchParams]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const isSectionExpanded = (title: string) => {
    if (expandedSections[title] === undefined) return true; // default open
    return expandedSections[title];
  };

  async function handleLogout() {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  }

  const getStrapiMediaUrlLocal = (media: any) => {
    if (!media) return null;
    const rawUrl = typeof media === 'string' ? media : (media.url || media.photoUrl || media.avatarUrl);
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) return rawUrl;
    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
    return `${baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  };

  const displayName = user ? getUserDisplayName(user as unknown as Parameters<typeof getUserDisplayName>[0]) : 'User';
  const initials = user ? getUserInitials(user as unknown as Parameters<typeof getUserInitials>[0]) : '??';
  const roleLabel = role ? role.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
  const avatarUrl = user?.avatarUrl || user?.photoUrl || getStrapiMediaUrlLocal(user?.avatar) || getStrapiMediaUrlLocal((user as any)?.photo) || null;

  const sidebarWidth = isCollapsed ? 72 : 280;

  const sidebarContent = (
    <aside
      className={cn(
        'fixed inset-y-0 z-40 flex flex-col h-full bg-card border-border',
        isRtl ? 'right-0 border-l' : 'left-0 border-r',
        'transition-all duration-300 ease-in-out overflow-hidden',
        className
      )}
      style={{ width: sidebarWidth }}
    >
      {/* Header */}
      <div className={cn('flex items-center border-b border-border flex-shrink-0', isCollapsed ? 'h-16 justify-center px-3' : 'h-16 px-4 gap-3')}>
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold text-sm shadow-lg">
            Y
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-sm text-foreground truncate"
              >
                YAHAYASCOOL
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0',
              isRtl ? 'mr-auto' : 'ml-auto',
              isCollapsed && (isRtl ? 'mr-0' : 'ml-0')
            )}
          >
            {isRtl ? (
              isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {navSections.map((section) => {
          // Render the dynamic Academic Sections group
          if (section.title === '__ACADEMIC_SECTIONS__') {
            return (
              <AcademicSectionsNav
                key="__academic_sections__"
                isCollapsed={isCollapsed}
                isActive={isActive}
                locale={locale}
                user={user}
                role={role}
              />
            );
          }
          return (
          <div key={section.title} className="mb-1">
            {!isCollapsed && (() => {
              const { icon: Icon, color } = getSectionIconAndColor(section.title);
              return (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-2 py-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-all duration-200 group mt-3 mb-1 border-none bg-transparent cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1 rounded-lg transition-transform group-hover:scale-105", color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-extrabold text-[10.5px] text-slate-600 dark:text-slate-300 group-hover:text-foreground transition-colors">
                      {getTranslatedSectionTitle(section.title)}
                    </span>
                  </div>
                  {isSectionExpanded(section.title)
                    ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                    : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors" />}
                </button>
              );
            })()}

            {/* Section Items */}
            <AnimatePresence initial={false}>
              {(isCollapsed || isSectionExpanded(section.title)) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-0.5"
                >
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const translatedLabel = getTranslatedLabel(item.label);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? translatedLabel : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-xl transition-all duration-150 group relative',
                          isCollapsed ? 'h-10 w-10 mx-auto justify-center' : 'px-3 py-2.5',
                          active
                            ? 'bg-[#048ED6] text-white shadow-md shadow-[#048ED6]/20 active-sidebar-item'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <item.icon className={cn('flex-shrink-0 transition-transform', isCollapsed ? 'w-5 h-5' : 'w-4 h-4', active && 'scale-110')} />
                        <AnimatePresence>
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-sm font-medium truncate"
                            >
                              {translatedLabel}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {isCollapsed && (
                          <div className="absolute left-full ml-3 px-2 py-1 rounded-lg bg-popover border border-border shadow-lg text-xs font-medium text-popover-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                            {translatedLabel}
                          </div>
                        )}
                        {!isCollapsed && item.badge && (
                          <span className="ml-auto text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn('border-t border-border flex-shrink-0 p-2 space-y-1')}>
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(
            'flex items-center gap-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
            isCollapsed ? 'h-10 w-10 mx-auto justify-center' : 'px-3 py-2.5 w-full'
          )}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!isCollapsed && <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User Profile */}
        <div 
          className={cn('flex items-center gap-3 rounded-xl p-2 group relative cursor-pointer', !isCollapsed && 'hover:bg-muted transition-colors')}
          title={isCollapsed ? `${displayName} (${user?.schoolId || user?.username || 'AC000000001'})` : undefined}
        >
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
                className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700"
              />
            ) : null}
            <div className={cn(
              "w-8 h-8 rounded-full bg-gradient-to-br from-[#048ED6] to-sky-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm",
              avatarUrl && "hidden"
            )}>
              {initials}
            </div>
          </div>
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-popover border border-border shadow-lg text-xs font-medium text-popover-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 flex flex-col">
              <span className="font-bold">{displayName}</span>
              <span className="text-[10px] font-mono text-[#048ED6]">{user?.schoolId || user?.username || 'AC000000001'}</span>
            </div>
          )}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0 flex-1"
              >
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-muted text-[#048ED6]">
                    {user?.schoolId || user?.username || 'AC000000001'}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate capitalize mt-0.5">{roleLabel}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Trigger */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className={cn(
            "fixed top-4 z-40 p-2.5 rounded-xl bg-card border border-border shadow-md text-foreground",
            isRtl ? 'right-4' : 'left-4'
          )}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: isRtl ? 280 : -280 }}
                animate={{ x: 0 }}
                exit={{ x: isRtl ? 280 : -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={cn(
                  "fixed inset-y-0 z-50 w-[280px]",
                  isRtl ? 'right-0' : 'left-0'
                )}
              >
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "absolute top-4 p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors",
                    isRtl ? 'left-4' : 'right-4'
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return sidebarContent;
}
