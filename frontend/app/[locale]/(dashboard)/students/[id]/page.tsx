/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import {
  GraduationCap, User, BookOpen, Layers, Calendar, AlertCircle,
  HeartPulse, FileText, Clock, DollarSign, Home, Shield, Award,
  CheckCircle2, ArrowLeft, Phone, Mail, MapPin, QrCode, Share2,
  Download, Printer, RefreshCw, AlertTriangle, X
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import { financeService } from '@/services/finance.service';
import { qmsService } from '@/services/qms.service';
import { Avatar } from '@/components/shared/Avatar';
import type { Student } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { RelationshipChip } from '@/components/erp/RelationshipChip';
import { TimelineFeed } from '@/components/erp/TimelineFeed';
import { BehaviorLevelCard } from '@/components/erp/BehaviorLevelCard';
import { getStrapiMediaUrl } from '@/services/cms.service';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { apiClient } from '@/services/api.service';
import { toast } from 'sonner';

export default function StudentSISProfilePage() {
  const params = useParams();
  const idOrDocumentId = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'identity' | 'academic' | 'behavior' | 'medical' | 'documents' | 'attendance' | 'finance' | 'hostel' | 'quran' | 'scholarships_transport' | 'audit'
  >('overview');

  const { user } = useAuth();
  const { userRole } = usePermissions();

  // Behavior Form states
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);
  const [behaviorLevel, setBehaviorLevel] = useState<'green' | 'yellow' | 'red'>('green');
  const [behaviorCategory, setBehaviorCategory] = useState('');
  const [behaviorDescription, setBehaviorDescription] = useState('');
  const [behaviorRecommendation, setBehaviorRecommendation] = useState('');
  const [parentNotified, setParentNotified] = useState(false);
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [isSavingBehavior, setIsSavingBehavior] = useState(false);

  // Audit logs states
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Quran states
  const [quranMemorizations, setQuranMemorizations] = useState<any[]>([]);
  const [loadingQuran, setLoadingQuran] = useState(false);

  // Attendance states
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Hostel states
  const [hostelAllocation, setHostelAllocation] = useState<any>(null);
  const [loadingHostel, setLoadingHostel] = useState(false);

  // Finance states
  const [invoices, setInvoices] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [walletTx, setWalletTx] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [activeFinanceSubTab, setActiveFinanceSubTab] = useState<'invoices' | 'receipts' | 'wallet' | 'ledger'>('invoices');

  const loadStudent = async () => {
    if (!idOrDocumentId) return;
    try {
      const data = await erpService.getStudentById(idOrDocumentId);
      setStudent(data);
    } catch (err) {
      console.error('Failed loading student profile:', err);
    }
  };

  useEffect(() => {
    if (!idOrDocumentId) return;
    setLoading(true);
    loadStudent().finally(() => setLoading(false));
  }, [idOrDocumentId]);

  const handleSaveBehavior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!behaviorCategory.trim() || !behaviorDescription.trim() || !student) {
      toast.error('Please enter category and description.');
      return;
    }
    setIsSavingBehavior(true);
    try {
      const existing = student.behaviorRecords || [];
      const newRecord = {
        teacherName: user?.displayName || user?.username || 'Faculty Member',
        date: new Date().toISOString().split('T')[0],
        level: behaviorLevel,
        category: behaviorCategory,
        description: behaviorDescription,
        recommendation: behaviorRecommendation,
        parentNotified,
        followUpRequired,
        resolution: ''
      };

      const updated = [newRecord, ...existing];

      await apiClient.put(`/students/${student.documentId}`, {
        data: {
          behaviorRecords: updated
        }
      });

      await apiClient.post('/audit-logs', {
        data: {
          action: 'Behavior Incident Logged',
          description: `Logged ${behaviorLevel} conduct event for student ${student.firstName} ${student.lastName}: ${behaviorCategory}`,
          performedBy: user?.id,
          severity: behaviorLevel === 'red' ? 'warning' : 'info'
        }
      });

      toast.success('Behavior/Conduct record logged successfully.');
      setShowBehaviorModal(false);

      setBehaviorCategory('');
      setBehaviorDescription('');
      setBehaviorRecommendation('');
      setParentNotified(false);
      setFollowUpRequired(false);

      await loadStudent();
    } catch (err) {
      toast.error('Failed to log behavior incident.');
    } finally {
      setIsSavingBehavior(false);
    }
  };

  const loadAuditLogs = async () => {
    if (!student?.user?.id) return;
    setLoadingAudit(true);
    try {
      const res = await apiClient.get('/audit-logs', {
        params: {
          'filters[performedBy][id][$eq]': student.user.id,
          'sort': 'createdAt:desc',
          'pagination[limit]': 50
        }
      });
      setAuditLogs(res.data?.data || []);
    } catch (e) {
      console.warn('Failed to load student audit trail');
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit' && student?.user?.id) {
      loadAuditLogs();
    }
  }, [activeTab, student?.user?.id]);

  const loadQuranData = async () => {
    if (!student?.id) return;
    setLoadingQuran(true);
    try {
      const memos = await qmsService.getMemorizationRecords(student.id);
      setQuranMemorizations(memos || []);
    } catch (e) {
      console.warn('Failed to load Quran progress logs');
    } finally {
      setLoadingQuran(false);
    }
  };

  const loadAttendanceLogs = async () => {
    if (!student?.id) return;
    setLoadingAttendance(true);
    try {
      const res = await apiClient.get('/attendance-records', {
        params: {
          'filters[student][id][$eq]': student.id,
          'sort': 'date:desc',
          'pagination[limit]': 100
        }
      });
      setAttendanceLogs(res.data?.data || []);
    } catch (e) {
      console.warn('Failed to load student attendance logs');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const loadHostelAllocation = async () => {
    if (!student?.id) return;
    setLoadingHostel(true);
    try {
      const res = await apiClient.get('/hostel-allocations', {
        params: {
          'filters[student][id][$eq]': student.id,
          'populate': 'room,room.floor,room.floor.building,bed',
          'pagination[limit]': 1
        }
      });
      setHostelAllocation(res.data?.data?.[0] || null);
    } catch (e) {
      console.warn('Failed to load hostel allocation');
    } finally {
      setLoadingHostel(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'quran') {
      loadQuranData();
    } else if (activeTab === 'attendance') {
      loadAttendanceLogs();
    } else if (activeTab === 'hostel') {
      loadHostelAllocation();
    }
  }, [activeTab, student?.id]);

  useEffect(() => {
    if (!student) return;

    const studentId = student.id;

    // Load Invoices
    financeService.getInvoices().then(all => {
      const filtered = all.filter((inv: any) => inv.student?.id === studentId || inv.studentId === student.studentId || inv.student?.schoolId === student.schoolId);
      setInvoices(filtered);
    });

    // Load Receipts
    financeService.getReceipts().then(all => {
      const filtered = all.filter((rec: any) => rec.student?.id === studentId || rec.studentId === student.studentId || rec.student?.schoolId === student.schoolId);
      setReceipts(filtered);
    });

    // Load Ledger
    financeService.getStudentLedger(String(studentId)).then(setLedger);

    // Load Wallet Transactions
    financeService.getStudentWalletTransactions(studentId).then(setWalletTx);
  }, [student]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="text-sm font-semibold">Loading Student 360° SIS Dossier...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center rounded-2xl border border-slate-800 bg-slate-900/60 my-12">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-100">Student Profile Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          The requested student ID ({idOrDocumentId}) does not exist or has been removed.
        </p>
        <Link
          href="/students"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Student Roster</span>
        </Link>
      </div>
    );
  }

  const fullName = `${student.firstName} ${student.middleName ? `${student.middleName} ` : ''}${student.lastName}`;
  const photoUrl = student.photo ? getStrapiMediaUrl(student.photo) : null;

  const renderEmergencyContacts = () => {
    if (!student.emergencyContacts) {
      return <p className="text-xs text-slate-500 italic">In emergency, contact primary parent/guardian listed above immediately.</p>;
    }

    let contactsList: string[] = [];
    try {
      if (typeof student.emergencyContacts === 'string') {
        const parsed = JSON.parse(student.emergencyContacts);
        contactsList = Array.isArray(parsed) ? parsed : (parsed.contacts ? (typeof parsed.contacts === 'string' ? JSON.parse(parsed.contacts) : parsed.contacts) : []);
      } else if (typeof student.emergencyContacts === 'object') {
        const contactsObj = student.emergencyContacts as any;
        if (contactsObj.contacts) {
          contactsList = typeof contactsObj.contacts === 'string' ? JSON.parse(contactsObj.contacts) : contactsObj.contacts;
        } else if (Array.isArray(contactsObj)) {
          contactsList = contactsObj;
        }
      }
    } catch (e) {
      console.warn("Failed parsing emergency contacts:", e);
    }

    if (!Array.isArray(contactsList) || contactsList.length === 0) {
      const rawVal = typeof student.emergencyContacts === 'string' ? student.emergencyContacts : JSON.stringify(student.emergencyContacts);
      return <p className="text-xs font-mono text-rose-800 dark:text-rose-350">{rawVal}</p>;
    }

    return (
      <div className="space-y-1.5 font-mono text-xs">
        {contactsList.map((phone, idx) => (
          <div key={idx} className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="font-bold">Call #{idx + 1}:</span>
            <span className="font-semibold">{phone}</span>
          </div>
        ))}
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Dossier Overview', icon: GraduationCap },
    { id: 'identity', label: 'Identity & Demographics', icon: User },
    { id: 'academic', label: 'Academic & Multi-Sections', icon: Layers },
    { id: 'behavior', label: 'Timeline & Behavior', icon: Award },
    { id: 'medical', label: 'Medical & Notes', icon: HeartPulse },
    { id: 'documents', label: 'Documents & Media', icon: FileText },
    { id: 'quran', label: 'Qur\'an Memorization', icon: BookOpen },
    { id: 'attendance', label: 'Attendance Track', icon: Clock },
    { id: 'finance', label: 'Fee & Billing Ledger', icon: DollarSign },
    { id: 'scholarships_transport', label: 'Scholarships & Transport', icon: Shield },
    { id: 'hostel', label: 'Hostel Assignment', icon: Home },
    { id: 'audit', label: 'Audit Trail & Logs', icon: Clock },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 w-full text-slate-800 dark:text-slate-100">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Back to Students Roster</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-800 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Reusable Avatar Component */}
          <Avatar
            src={student.photo}
            name={fullName}
            size="2xl"
            className="border-2 border-emerald-500/40 shadow-lg flex-shrink-0"
          />

          {/* Core Identity Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold">
                {student.schoolId || student.admissionNumber || `#ST-${student.id}`}
              </span>
              <StatusBadge status={student.enrollmentStatus || student.status || 'active'} size="md" />
              <span className="text-xs text-slate-400 font-mono">Enrolled: {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'Sep 2026'}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white truncate">{fullName}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              {student.gender && <span className="capitalize font-semibold text-emerald-400">Gender: {student.gender}</span>}
              {student.nationality && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {student.nationality}</span>}
              {student.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-500" /> {student.phone}</span>}
              {student.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {student.email}</span>}
            </div>
          </div>

          {/* QR / Barcode Quick Access */}
          <div className="hidden lg:flex flex-col items-end gap-1.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-right">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
              <QrCode className="w-4 h-4" />
              <span>SIS-QR Verify</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">ID: {student.documentId?.slice(0, 8) || student.id}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 no-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        {/* ── 1. Overview Tab ──────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Academic Sections & Programs Summary */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Current Multi-Section Assignments</span>
                </h3>
                {student.sections && student.sections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {student.sections.map((sec: any) => (
                      <RelationshipChip key={sec.id} type="section" label={sec.code} sublabel={sec.name} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No active class section currently assigned.</p>
                )}

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Enrolled Programs:</span>
                    {student.programs && student.programs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {student.programs.map((p: any) => (
                          <RelationshipChip key={p.id} type="program" label={p.name} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 dark:text-slate-500 italic">Standard High School Curriculum</span>
                    )}
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Departments:</span>
                    {student.departments && student.departments.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {student.departments.map((d: any) => (
                          <RelationshipChip key={d.id} type="department" label={d.name} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 dark:text-slate-500 italic">Islamic & STEM High School</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Biography & General Notes */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Biography & General Student Profile</span>
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {student.biography || student.generalNotes || 'Enrolled student at Yahaya International Islamic & English High School. Exhibiting commitment to moral leadership and academic excellence.'}
                </p>
              </div>

              {/* Recent Behavior Brief */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Recent Behavior & Achievement Log</span>
                  </h3>
                  <button onClick={() => setActiveTab('behavior')} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer">
                    View Full Feed →
                  </button>
                </div>
                {student.behaviorRecords && student.behaviorRecords.length > 0 ? (
                  <div className="space-y-3">
                    {student.behaviorRecords.slice(0, 2).map((b, idx) => (
                      <BehaviorLevelCard key={idx} record={b} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No behavioral records logged for this academic term.</p>
                )}
              </div>
            </div>

            {/* Right Column: Parents, Teachers, & Emergency */}
            <div className="space-y-6">
              {/* Linked Parents & Guardians */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-500" />
                  <span>Linked Parents / Guardians</span>
                </h3>
                {student.parents && student.parents.length > 0 ? (
                  <div className="space-y-3">
                    {student.parents.map((p) => (
                      <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Link href={`/parents/${p.documentId || p.id}`} className="text-sm font-bold text-purple-600 dark:text-purple-300 hover:underline">
                            {p.name}
                          </Link>
                          <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-[10px] font-bold uppercase">
                            {p.relationship}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" /> {p.phone}
                        </p>
                        {p.occupation && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">Occupation: {p.occupation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No guardian registry record linked yet.</p>
                )}
              </div>

              {/* Assigned Teachers & Sheikhs */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-500" />
                  <span>Assigned Faculty & Sheikhs</span>
                </h3>
                {student.teachers && student.teachers.length > 0 ? (
                  <div className="space-y-2">
                    {student.teachers.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div>
                          <Link href={`/teachers/${t.documentId || t.id}`} className="text-xs font-bold text-amber-600 dark:text-amber-300 hover:underline">
                            {t.name}
                          </Link>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[160px]">{t.specializations || 'Academic Faculty'}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">{t.phone || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No direct teachers assigned outside section defaults.</p>
                )}
              </div>

              {/* Emergency Contact Summary */}
              <div className="rounded-2xl border border-rose-250 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/10 p-6 shadow-xl">
                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Emergency Care & Contact Info</span>
                </h3>
                <div className="mt-2">
                  {renderEmergencyContacts()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. Identity & Demographics Tab ──────────────────────────────── */}
        {activeTab === 'identity' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 md:p-8 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Full Identity & Demographics Record</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">First Name</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{student.firstName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Middle Name</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{student.middleName || ''}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Last Name / Family</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{student.lastName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Date of Birth</span>
                <p className="text-sm font-mono text-slate-800 dark:text-slate-200">{student.dateOfBirth || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Place of Birth</span>
                <p className="text-sm text-slate-800 dark:text-slate-200">{student.placeOfBirth || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Nationality / Citizenship</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{student.nationality || 'Ghanaian / International'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">National ID / Ghanacard #</span>
                <p className="text-sm font-mono text-slate-800 dark:text-slate-200">{student.nationalId || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Passport Number</span>
                <p className="text-sm font-mono text-slate-800 dark:text-slate-200">{student.passportNumber || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Religion / Faith Track</span>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{student.religion || 'Islam (Sunni)'}</p>
              </div>

              <div className="md:col-span-3 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Home / Residential Address</span>
                <p className="text-sm text-slate-800 dark:text-slate-200">{student.address || 'Accra, Greater Accra Region, Ghana'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. Academic & Multi-Sections Tab ────────────────────────────── */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            {/* Active Course Enrollments Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <span>Active Course Offerings & Enrollments</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Active academic classes, language modules, and religious study groups the student is currently attending.
              </p>

              {student.enrollments && student.enrollments.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="p-3">Course Code</th>
                        <th className="p-3">Subject Name</th>
                        <th className="p-3">Academic Section (Division)</th>
                        <th className="p-3">Instructor</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {student.enrollments.map((enr: any) => {
                        const co = enr.courseOffering;
                        if (!co) return null;
                        const teacherName = co.teacher
                          ? co.teacher.displayName || `${co.teacher.firstName} ${co.teacher.lastName}`
                          : 'Unassigned';
                        return (
                          <tr key={enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{co.subject?.code || 'N/A'}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{co.subject?.name || 'General studies'}</td>
                            <td className="p-3">
                              <span
                                className="px-2 py-0.5 rounded text-[9px] font-bold text-white shadow-2xs"
                                style={{ backgroundColor: co.academicSection?.color || '#4f46e5' }}
                              >
                                {co.academicSection?.name || 'General'}
                              </span>
                            </td>
                            <td className="p-3">{teacherName}</td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250/50">
                                Active
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500 italic text-[11px] bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                  No active course offerings enrolled. Enroll this student using the Course Offerings console.
                </p>
              )}
            </div>

            {/* Historical Enrollment Records Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Multi-Section Assignment & Enrollment History</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Historical record of academic section assignments, including counselor/homeroom cohort migrations.
              </p>

              {student.enrollmentHistory && student.enrollmentHistory.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400">
                      <tr>
                        <th className="p-3">Academic Year</th>
                        <th className="p-3">Section Code</th>
                        <th className="p-3">Enrollment Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Staff Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {student.enrollmentHistory.map((h, idx) => (
                        <tr key={idx} className="hover:bg-slate-100 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{h.academicYear}</td>
                          <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">{h.sectionCode}</td>
                          <td className="p-3 font-mono">{new Date(h.enrollmentDate).toLocaleDateString()}</td>
                          <td className="p-3"><StatusBadge status={h.status} size="sm" /></td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{h.notes || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  No historical enrollment records logged. Current active section assignment is governed by the overview tab.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 4. Timeline & Behavior Tab ──────────────────────────────────── */}
        {activeTab === 'behavior' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Behavioral & Disciplinary Records</span>
                </h3>
                {(userRole === 'super-administrator' || userRole === 'director' || userRole === 'teacher') && (
                  <button
                    onClick={() => setShowBehaviorModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer border-none"
                  >
                    + Log Behavior Event
                  </button>
                )}
              </div>
              {student.behaviorRecords && student.behaviorRecords.length > 0 ? (
                <div className="space-y-4">
                  {student.behaviorRecords.map((rec, i) => (
                    <BehaviorLevelCard key={i} record={rec} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-8 text-center">No commendations or disciplinary notices recorded.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Student Life Chronological Timeline</span>
              </h3>
              <TimelineFeed items={student.timeline} emptyMessage="No life events or milestone records logged yet." />
            </div>
          </div>
        )}

        {/* ── 5. Medical & Notes Tab ──────────────────────────────────────── */}
        {activeTab === 'medical' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                <span>Medical Info & Care Plan</span>
              </h3>
              {student.medicalInfo && student.medicalInfo.length > 0 ? (
                student.medicalInfo.map((m, idx) => (
                  <div key={idx} className="space-y-4 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Blood Group:</span>
                      <span className="px-3 py-1 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-sm">{m.bloodGroup || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">Allergies / Contraindications:</span>
                      <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">{m.allergies || 'None reported'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">Chronic Conditions:</span>
                      <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">{m.chronicConditions || 'None reported'}</p>
                    </div>
                    {m.emergencyCarePlan && (
                      <div>
                        <span className="text-rose-600 font-semibold block mb-1">Emergency Care Plan:</span>
                        <p className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200">{m.emergencyCarePlan}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic py-8 text-center">No specialized medical records submitted by parents.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Internal Staff Observations & Notes</span>
              </h3>
              {student.staffNotes && student.staffNotes.length > 0 ? (
                <div className="space-y-3">
                  {student.staffNotes.map((note, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                        <span>{note.authorName} <span className="text-slate-500 font-normal">({note.authorRole})</span></span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{new Date(note.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{note.noteContent}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-8 text-center">No internal staff notes recorded.</p>
              )}
            </div>
          </div>
        )}

        {/* ── 6. Documents & Media Tab ────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Uploaded Student Dossier Documents</span>
            </h3>
            {student.documents && student.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {student.documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={getStrapiMediaUrl(doc) || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 flex items-center gap-3 transition-all group"
                  >
                    <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{doc.name || `Document #${idx + 1}`}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{(doc.size || 0).toFixed(1)} KB • {doc.ext || 'PDF'}</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-12 text-center">No attached birth certificates, transcripts, or passport files found.</p>
            )}
          </div>
        )}

        {/* ── 7. Qur'an Tab ──────────────────────────────────────────────── */}
        {activeTab === 'quran' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Qur'an & Tahfidz Memorization Progress</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                    <span className="text-slate-500 block font-bold mb-1">MEMORIZED LOGS</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-lg">{quranMemorizations.length} entries</strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                    <span className="text-slate-500 block font-bold mb-1">LAST MEMORIZED</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-lg truncate block max-w-full">
                      {quranMemorizations[0]?.surahName || quranMemorizations[0]?.surah || 'None'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                    <span className="text-slate-500 block font-bold mb-1">LATEST STATUS</span>
                    <strong className="text-amber-600 dark:text-amber-400 text-lg">
                      {quranMemorizations[0]?.status || 'Active'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                    <span className="text-slate-500 block font-bold mb-1">LAST EVAL GRADE</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-lg">
                      {quranMemorizations[0]?.grade || 'Pass'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Daily progress log</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  {loadingQuran ? (
                    <div className="flex justify-center p-6"><RefreshCw className="animate-spin text-emerald-500 w-5 h-5" /></div>
                  ) : quranMemorizations.length === 0 ? (
                    <p className="text-slate-500 text-xs italic py-4 text-center">No memorization logs registered yet.</p>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Surah / Ayah</th>
                          <th className="p-3">Grade</th>
                          <th className="p-3">Teacher Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {quranMemorizations.map((memo: any) => (
                          <tr key={memo.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono">{memo.date ? new Date(memo.date).toLocaleDateString() : 'N/A'}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {memo.surahName || memo.surah || 'Quran Memorization'} {memo.startAyah && memo.endAyah ? `(Ayah ${memo.startAyah}-${memo.endAyah})` : ''}
                            </td>
                            <td className="p-3 text-emerald-600 dark:text-emerald-450 font-bold">{memo.grade || 'Passed'}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{memo.notes || memo.remarks || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Evaluations & Competitions</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase mb-1">Placement Standing</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 block mb-0.5">Assigned to Hifz Track</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Evaluated: Sep 2026</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 8. Attendance Tab ──────────────────────────────────────────── */}
        {activeTab === 'attendance' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Academic Attendance Tracker</span>
            </h3>

            {loadingAttendance ? (
              <div className="flex justify-center p-6"><RefreshCw className="animate-spin text-emerald-500 w-5 h-5" /></div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-center">
                    <span className="text-slate-500 block font-bold mb-1">TOTAL DAYS PRESENT</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-3xl font-mono">
                      {attendanceLogs.filter(a => a.recordStatus?.toLowerCase() === 'present').length}
                    </strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-center">
                    <span className="text-slate-500 block font-bold mb-1">TOTAL DAYS ABSENT</span>
                    <strong className="text-rose-600 dark:text-rose-400 text-3xl font-mono">
                      {attendanceLogs.filter(a => a.recordStatus?.toLowerCase() === 'absent').length}
                    </strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-center">
                    <span className="text-slate-500 block font-bold mb-1">ATTENDANCE AVERAGE</span>
                    <strong className="text-emerald-600 dark:text-emerald-350 text-3xl font-mono">
                      {attendanceLogs.length > 0
                        ? `${((attendanceLogs.filter(a => a.recordStatus?.toLowerCase() === 'present').length / attendanceLogs.length) * 100).toFixed(1)}%`
                        : '100%'}
                    </strong>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  {attendanceLogs.length === 0 ? (
                    <p className="text-slate-500 text-xs italic py-6 text-center">No attendance records logged for this scholar.</p>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400">
                        <tr>
                          <th className="p-3">Session Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Remarks / Justification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {attendanceLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono">{log.date}</td>
                            <td className="p-3 font-bold">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                log.recordStatus?.toLowerCase() === 'present' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' :
                                log.recordStatus?.toLowerCase() === 'absent' ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400' :
                                'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                              }`}>
                                {log.recordStatus}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{log.comments || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 9. Finance Tab (Completed Live ERP) ─────────────────────────── */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            {/* Header KPI Deck */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Invoiced</span>
                <strong className="text-slate-800 dark:text-slate-200 text-xl font-mono">
                  ${invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0).toFixed(2)}
                </strong>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">Total Collected</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-xl font-mono">
                  ${receipts.reduce((sum, rec) => sum + Number(rec.paymentAmount || rec.amount || 0), 0).toFixed(2)}
                </strong>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block uppercase">Outstanding Receivable</span>
                <strong className="text-rose-600 dark:text-rose-400 text-xl font-mono">
                  ${invoices.reduce((sum, inv) => sum + Number(inv.remainingBalance || 0), 0).toFixed(2)}
                </strong>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/25 rounded-2xl p-4">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">Advance Wallet Balance</span>
                <strong className="text-emerald-600 dark:text-emerald-300 text-xl font-mono">
                  +${Number(student.advanceBalance || 0).toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              {[
                { id: 'invoices', label: `Invoices (${invoices.length})` },
                { id: 'receipts', label: `Receipts (${receipts.length})` },
                { id: 'wallet', label: 'Wallet History' },
                { id: 'ledger', label: 'Student Ledger' },
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveFinanceSubTab(subTab.id as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeFinanceSubTab === subTab.id
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {/* Sub-tab Contents */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl">
              {activeFinanceSubTab === 'invoices' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Active Student Invoices</h4>
                  {invoices.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400">
                          <tr>
                            <th className="p-3">Invoice #</th>
                            <th className="p-3">Issue Date</th>
                            <th className="p-3">Due Date</th>
                            <th className="p-3 text-right">Total Amount</th>
                            <th className="p-3 text-right">Paid Amount</th>
                            <th className="p-3 text-right">Remaining Due</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{inv.invoiceNumber}</td>
                              <td className="p-3 font-mono">{inv.issueDate}</td>
                              <td className="p-3 font-mono">{inv.dueDate}</td>
                              <td className="p-3 text-right font-mono">${Number(inv.totalAmount || 0).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">${Number(inv.paidAmount || 0).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400">${Number(inv.remainingBalance || 0).toFixed(2)}</td>
                              <td className="p-3"><StatusBadge status={inv.status} size="sm" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-6 text-center">No invoices registered for this scholar.</p>
                  )}
                </div>
              )}

              {activeFinanceSubTab === 'receipts' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Payment receipts log</h4>
                  {receipts.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400">
                          <tr>
                            <th className="p-3">Receipt #</th>
                            <th className="p-3">Payment Date</th>
                            <th className="p-3">Method</th>
                            <th className="p-3">Reference Number</th>
                            <th className="p-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          {receipts.map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{rec.receiptNumber}</td>
                              <td className="p-3 font-mono">{rec.paymentDate ? new Date(rec.paymentDate).toLocaleDateString() : 'N/A'}</td>
                              <td className="p-3 font-bold">{rec.paymentMethod}</td>
                              <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{rec.providerTransactionId || 'N/A'}</td>
                              <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">${Number(rec.paymentAmount || rec.amount || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-6 text-center">No payment receipts registered for this scholar.</p>
                  )}
                </div>
              )}

              {activeFinanceSubTab === 'wallet' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Wallet Transaction History</h4>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-xl">
                      Wallet Credit: ${Number(student.advanceBalance || 0).toFixed(2)}
                    </span>
                  </div>
                  {walletTx.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Transaction Type</th>
                            <th className="p-3">Reference</th>
                            <th className="p-3">Reason / Details</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-right">Running Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          {walletTx.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-mono">{new Date(tx.transactionDate || tx.createdAt).toLocaleDateString()}</td>
                              <td className="p-3 capitalize font-bold">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${
                                  tx.transactionType.includes('deposit') || tx.transactionType.includes('credit')
                                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                                }`}>
                                  {tx.transactionType.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{tx.referenceNumber || 'N/A'}</td>
                              <td className="p-3 text-slate-700 dark:text-slate-300">{tx.reason}</td>
                              <td className="p-3 text-right font-mono font-bold">
                                {tx.transactionType.includes('deposit') || tx.transactionType.includes('credit') ? '+' : '-'}${Number(tx.amount || 0).toFixed(2)}
                              </td>
                              <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">${Number(tx.runningBalance || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-6 text-center">No wallet transactions recorded for this scholar.</p>
                  )}
                </div>
              )}

              {activeFinanceSubTab === 'ledger' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Double-Entry Student running Ledger</h4>
                  {ledger.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Document</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-right">Running Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          {ledger.map((ent) => (
                            <tr key={ent.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-mono">{ent.transactionDate}</td>
                              <td className="p-3 font-mono font-bold text-slate-500 dark:text-slate-400">{ent.documentNumber}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ent.type === 'debit' ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                }`}>
                                  {ent.type.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 text-slate-700 dark:text-slate-300">{ent.description}</td>
                              <td className="p-3 text-right font-mono font-bold">${Number(ent.baseAmount || 0).toFixed(2)}</td>
                              <td className={`p-3 text-right font-mono font-bold ${ent.runningBalance <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                ${Number(ent.runningBalance || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-6 text-center">No ledger entries recorded for this scholar.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 10. Hostel Tab ─────────────────────────────────────────────── */}
        {activeTab === 'hostel' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Hostel & Dormitory Allocation details</span>
            </h3>
            {loadingHostel ? (
              <div className="flex justify-center p-6"><RefreshCw className="animate-spin text-emerald-500 w-5 h-5" /></div>
            ) : !hostelAllocation ? (
              <p className="text-slate-500 text-xs italic py-4 text-center">No active hostel or dormitory allocation assigned to this scholar.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                  <span className="text-slate-500 block font-bold mb-1">BUILDING</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-lg">
                    {hostelAllocation.room?.floor?.building?.name || 'Al-Bukhari Hall'}
                  </strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                  <span className="text-slate-500 block font-bold mb-1">ROOM NUMBER</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-lg">
                    {hostelAllocation.room?.roomNumber ? `Room ${hostelAllocation.room.roomNumber}` : 'Room 205'} ({hostelAllocation.room?.floor?.name || 'Floor 2'})
                  </strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                  <span className="text-slate-500 block font-bold mb-1">BED ID</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-lg">
                    {hostelAllocation.bed?.bedNumber || 'Bed-C'}
                  </strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                  <span className="text-slate-600 block font-bold mb-1">MONTHLY FEES</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-lg font-mono">
                    {hostelAllocation.monthlyRate ? `$${Number(hostelAllocation.monthlyRate).toFixed(2)}` : '$50.00'}
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 11. Scholarships & Transport Tab ─────────────────────────── */}
        {activeTab === 'scholarships_transport' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Scholarships, Financial Assistance & Transport Bus Services</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider block">Waqf Merit Scholarship</span>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">25% Tuition Fee Waiver Granted</p>
                <p className="text-slate-400">Approved by Director of Academic Administration for AY 2026-2027.</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider block">Campus Bus Service Route</span>
                <p className="text-sm font-black text-sky-600 dark:text-sky-400">Route #4: Medina District Express</p>
                <p className="text-slate-400">Bus ID: BUS-2026-08 • Pickup Stop: Central Library Square (07:15 AM)</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 12. Audit Trail Tab ──────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>System Audit Log Trail for Scholar #{student.schoolId || student.id}</span>
            </h3>

            {loadingAudit ? (
              <div className="flex justify-center p-6"><RefreshCw className="animate-spin text-emerald-500 w-5 h-5" /></div>
            ) : auditLogs.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4 text-center">No audit logs or submitted excuses found for this scholar.</p>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-2">
                    <div>
                      <span className={`font-bold block text-xs ${
                        log.action.includes('Excuse') ? "text-amber-600 dark:text-amber-400" :
                        log.action.includes('Payment') ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400"
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-slate-600 text-[11px] block mt-0.5">{log.description}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans shrink-0">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Behavior Logging Modal */}
      {showBehaviorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 rounded-3xl shadow-2xl relative space-y-4 text-xs text-slate-800 dark:text-slate-200">
            <button
              onClick={() => setShowBehaviorModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Log Conduct / Behavior Event</h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Record positive commendation or disciplinary warning for {fullName}.</p>
            </div>

            <form onSubmit={handleSaveBehavior} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Behavior Level</label>
                  <select
                    value={behaviorLevel}
                    onChange={(e) => setBehaviorLevel(e.target.value as any)}
                    className="w-full px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="green">Green (Commendation)</option>
                    <option value="yellow">Yellow (Minor Infraction)</option>
                    <option value="red">Red (Major Infraction)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={behaviorCategory}
                    placeholder="e.g. Helpful Conduct, Punctuality"
                    onChange={(e) => setBehaviorCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Incident / Commendation Description</label>
                <textarea
                  required
                  rows={4}
                  value={behaviorDescription}
                  placeholder="Provide precise details of the student's behavior event..."
                  onChange={(e) => setBehaviorDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Action / Recommendation</label>
                <input
                  type="text"
                  value={behaviorRecommendation}
                  placeholder="e.g. Nominated for weekly honor roll, Warning slip issued"
                  onChange={(e) => setBehaviorRecommendation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={parentNotified}
                    onChange={(e) => setParentNotified(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Parent / Guardian Notified</span>
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Follow Up Required</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBehaviorModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBehavior}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSavingBehavior ? 'Saving Log...' : 'Log Behavior Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
