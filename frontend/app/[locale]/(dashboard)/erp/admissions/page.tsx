'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GraduationCap, FileCheck, Calendar, Award, UserCheck, Plus, CheckCircle2,
  Clock, AlertCircle, ArrowRight, FileText, Filter, Eye, DollarSign,
  X, User, Phone, Mail, Globe, Shield, RefreshCw, ClipboardList,
  BookOpen, ChevronRight, Activity, Trash2, ShieldAlert
} from 'lucide-react';
import { admissionsService } from '@/services/admissions.service';
import type { AdmissionApplication, AdmissionStage, AuditTrailStep } from '@/types/enterprise.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoToDisplay(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

function stageColor(stage: string) {
  switch (stage) {
    case 'application_received':  return 'bg-blue-50 text-blue-750 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    case 'document_verification': return 'bg-amber-50 text-amber-750 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    case 'interview_scheduled':   return 'bg-violet-50 text-violet-750 border-violet-200 dark:bg-violet-955/40 dark:text-violet-300 dark:border-violet-800';
    case 'assessment_completed':  return 'bg-indigo-50 text-indigo-750 border-indigo-200 dark:bg-indigo-955/40 dark:text-indigo-300 dark:border-indigo-800';
    case 'enrolled':
    case 'student_created':       return 'bg-emerald-50 text-emerald-750 border-emerald-200 dark:bg-emerald-955/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'rejected':              return 'bg-rose-50 text-rose-750 border-rose-200 dark:bg-rose-955/40 dark:text-rose-300 dark:border-rose-800';
    default:                      return 'bg-slate-50 text-slate-750 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700';
  }
}

const STAGE_ORDER: AdmissionStage[] = [
  'application_received',
  'document_verification',
  'interview_scheduled',
  'assessment_completed',
  'enrolled'
];

// ─── Create Application Modal ───────────────────────────────────────────────

function CreateApplicationModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName]                       = useState('');
  const [lastName, setLastName]                         = useState('');
  const [email, setEmail]                               = useState('');
  const [phone, setPhone]                               = useState('');
  const [gender, setGender]                             = useState<'male' | 'female'>('male');
  const [dateOfBirth, setDateOfBirth]                   = useState('2014-01-01');
  const [nationality, setNationality]                   = useState('Liberian');
  const [applicationType, setApplicationType]           = useState<'online' | 'offline' | 'transfer'>('online');
  const [gradeApplyingFor, setGradeApplyingFor]         = useState('Grade 7');
  const [academicYear, setAcademicYear]                 = useState('2026-2027');
  const [guardianName, setGuardianName]                 = useState('');
  const [guardianPhone, setGuardianPhone]               = useState('');
  const [guardianEmail, setGuardianEmail]               = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Father');
  const [submitting, setSubmitting]                     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !guardianName.trim()) {
      toast.error('First Name, Last Name, and Guardian Name are required.');
      return;
    }

    setSubmitting(true);
    try {
      await admissionsService.submitApplication({
        firstName,
        lastName,
        email,
        phone,
        gender,
        dateOfBirth,
        nationality,
        applicationType,
        gradeApplyingFor,
        academicYear,
        guardianName,
        guardianPhone,
        guardianEmail,
        guardianRelationship,
        documents: [
          { name: 'Birth Certificate.pdf', url: '#', verified: false },
          { name: 'Previous School Transcript.pdf', url: '#', verified: false }
        ]
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-base">New Admission Application</h3>
              <p className="text-[11px] text-slate-400 font-mono">Create manual or walk-in application record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Section 1: Applicant Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">1. Scholar Demographics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-350">First Name *</label>
                  <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-655 dark:text-slate-350">Last Name *</label>
                  <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-655 dark:text-slate-350">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-655 dark:text-slate-350">Phone Number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs font-mono focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-655 dark:text-slate-355">Gender</label>
                  <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none focus:border-indigo-500">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-655 dark:text-slate-350">Date of Birth</label>
                  <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-650 dark:text-slate-350">Nationality</label>
                  <input type="text" value={nationality} onChange={e => setNationality(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>

            {/* Section 2: Admissions Metrics */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">2. Enrollment Specifics</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-650 dark:text-slate-355">Application Type</label>
                  <select value={applicationType} onChange={e => setApplicationType(e.target.value as any)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none focus:border-indigo-500">
                    <option value="online">Online Registration</option>
                    <option value="offline">Offline Counter</option>
                    <option value="transfer">School Transfer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-650 dark:text-slate-350">Grade Applying For</label>
                  <input type="text" value={gradeApplyingFor} onChange={e => setGradeApplyingFor(e.target.value)} placeholder="e.g. Grade 9 - STEM" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-650 dark:text-slate-350">Academic Year</label>
                  <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs font-mono focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>

            {/* Section 3: Guardian Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">3. Primary Guardian Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-650 dark:text-slate-350">Guardian Name *</label>
                  <input type="text" required value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="e.g. Suleiman Bah" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-650 dark:text-slate-355">Relationship</label>
                  <select value={guardianRelationship} onChange={e => setGuardianRelationship(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none focus:border-indigo-500">
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Guardian">Legal Guardian</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-650 dark:text-slate-350">Guardian Email</label>
                  <input type="email" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-650 dark:text-slate-350">Guardian Phone *</label>
                  <input type="text" required value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs font-mono focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs shadow-md cursor-pointer">
              {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Admission Detail Modal / Stepper ────────────────────────────────────────

function AdmissionDetailModal({
  app,
  onClose,
  onUpdated,
}: {
  app: AdmissionApplication;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [stage, setStage]               = useState<AdmissionStage>(app.stage || 'application_received');
  const [reviewer, setReviewer]         = useState('Registrar Officer');
  const [notes, setNotes]               = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [docs, setDocs]                 = useState(app.documents || []);

  const currentIdx = STAGE_ORDER.indexOf(app.stage || 'application_received');

  const handleDocVerifyToggle = (idx: number) => {
    const updated = [...docs];
    updated[idx] = { ...updated[idx], verified: !updated[idx].verified };
    setDocs(updated);
    toast.success(`${updated[idx].name} verified status toggled.`);
  };

  const handleAdvance = async (targetStage: AdmissionStage) => {
    setSubmitting(true);
    try {
      // Keep doc updates in payload
      const updatedApp = { ...app, documents: docs };
      const safeTargetStage = targetStage || 'application_received';
      await admissionsService.advanceStage(updatedApp, safeTargetStage, reviewer, notes || `Workflow transitioned to ${safeTargetStage.replace(/_/g, ' ')}`);
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to advance application workflow stage.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{app.applicationNumber}</span>
              <h3 className="font-black text-base">{app.applicantName}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">✕</button>
        </div>

        <div className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-5 gap-6 p-5">
          {/* LEFT: Stepper Progress Track */}
          <div className="md:col-span-2 space-y-4 border-r border-slate-250 dark:border-slate-800 pr-0 md:pr-6">
            <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Workflow Journey
            </h4>

            <div className="space-y-4 relative pl-3 border-l border-slate-200 dark:border-slate-800 ml-2">
              {STAGE_ORDER.map((step, idx) => {
                const isPassed = currentIdx >= idx;
                const isActive = app.stage === step;
                return (
                  <div key={step} className="relative pl-6">
                    {/* Circle marker */}
                    <div className={`absolute left-0 top-1 -translate-x-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-black z-10 ${
                      isActive ? 'bg-indigo-600 border-indigo-600 text-white animate-pulse' :
                      isPassed ? 'bg-emerald-500 border-emerald-500 text-white' :
                                 'bg-white dark:bg-slate-900 border-slate-350 dark:border-slate-700 text-slate-400'
                    }`}>
                      {isPassed && <CheckCircle2 className="w-2.5 h-2.5" />}
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-black capitalize leading-none ${isActive ? 'text-indigo-650 dark:text-indigo-400' : isPassed ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                        {step.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[10px] text-slate-450">
                        {step === 'enrolled' && app.generatedStudentId ? `Scholar ID: ${app.generatedStudentId}` : ''}
                        {step === 'enrolled' && app.generatedInvoiceId ? `Fee Invoice: ${app.generatedInvoiceId}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Document Checklist */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> Documents Checklist
              </h4>
              {docs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No uploads attached.</p>
              ) : (
                <div className="space-y-1.5">
                  {docs.map((doc, idx) => (
                    <label key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 text-xs font-bold select-none cursor-pointer">
                      <span className="flex items-center gap-1.5 truncate pr-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.name}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={doc.verified}
                        onChange={() => handleDocVerifyToggle(idx)}
                        className="rounded border-slate-350 dark:border-slate-650 text-indigo-650 focus:ring-indigo-500 shrink-0"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Details & Transition */}
          <div className="md:col-span-3 space-y-5">
            {/* Stage banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${stageColor(app.stage)}`}>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider leading-none">Current Workflow State</p>
                  <p className="text-xs font-black capitalize mt-0.5">{(app.stage || '').replace(/_/g, ' ')}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black border uppercase bg-white/40 dark:bg-black/20">
                {app.status}
              </span>
            </div>

            {/* Applicant details */}
            <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <h5 className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Applicant Demographics & Background</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">First Name</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{app.firstName || '—'}</p>
                </div>
                { (app as any).middleName && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Middle Name</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{(app as any).middleName}</p>
                  </div>
                )}
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Last Name</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{app.lastName || '—'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Date of Birth</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{app.dateOfBirth || '—'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Gender</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 capitalize">{app.gender || '—'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Nationality</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{app.nationality || '—'}</p>
                </div>
                { (app as any).religion && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Religion</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{(app as any).religion}</p>
                  </div>
                )}
                { (app as any).previousSchool && (
                  <div className="col-span-2 space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Previous School</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{(app as any).previousSchool}</p>
                  </div>
                )}
                { (app as any).address && (
                  <div className="col-span-3 space-y-0.5 pt-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Residential Address</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{(app as any).address}</p>
                  </div>
                )}
                { (app as any).medicalInfo && (
                  <div className="col-span-3 space-y-0.5 pt-1">
                    <p className="text-[10px] text-rose-500 font-bold uppercase">Medical Info / Allergies</p>
                    <p className="font-bold text-rose-700 dark:text-rose-350 bg-rose-50 dark:bg-rose-955/20 border border-rose-150 dark:border-rose-900 px-2.5 py-1 rounded-xl">{(app as any).medicalInfo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Program Track section */}
            <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Academic Selection & Accommodation</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Desired Program & Track</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{(app as any).desiredProgram || app.gradeApplyingFor}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Academic Department</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{(app as any).desiredDepartment || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Desired Grade Level / Section</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{(app as any).desiredSection || app.gradeApplyingFor} ({app.academicYear})</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Boarding Hostel Accommodation</p>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 border ${
                    (app as any).hostelRequired 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700' 
                      : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}>
                    {(app as any).hostelRequired ? 'Hostel Required' : 'Day Student'}
                  </span>
                </div>
              </div>
            </div>

            {/* Guardian section */}
            <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Parent / Guardian Contact Information</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Parent / Guardian Name</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{(app as any).parentName || app.guardianName} ({(app as any).guardianRelationship || 'Parent'})</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Contact Phone</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">{(app as any).parentPhone || app.guardianPhone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Email Address</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 font-mono truncate">{(app as any).parentEmail || app.guardianEmail || '—'}</p>
                </div>
                { (app as any).parentOccupation && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400">Occupation / Profession</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{(app as any).parentOccupation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow Stage Advancer Form */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5" /> Advance Workflow Stage
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">Target Stage</label>
                  <select
                    value={stage}
                    onChange={e => setStage(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-850 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="application_received">Application Received</option>
                    <option value="document_verification">Document Verification</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="assessment_completed">Assessment Completed</option>
                    <option value="enrolled">Enrolled & Auto-Invoiced</option>
                    <option value="rejected">Rejected / Cancelled</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">Authorized Reviewer</label>
                  <input
                    type="text"
                    value={reviewer}
                    onChange={e => setReviewer(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">Decision Notes / Verification Memo</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Reviewer details regarding documents check or interview score..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleAdvance(stage)}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Post Stage Update
                </button>
              </div>
            </div>

            {/* Audit History Log */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> Stage Transition Audit Trail
              </h4>
              <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                {(app.auditHistory || []).map((step, idx) => (
                  <div key={idx} className="p-3 text-[11px] hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold text-indigo-650 dark:text-indigo-400">{step.action.replace(/_/, ' ')}</span>
                      <span className="font-mono text-[9px]">{isoToDisplay(step.timestamp)}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-bold mt-0.5">By {step.performedBy} ({step.performedByRole})</p>
                    {step.notes && <p className="text-slate-400 italic mt-0.5">"{step.notes}"</p>}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdmissionsERPPage() {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading]             = useState(true);
  const [stageFilter, setStageFilter]     = useState<string>('all');
  const [query, setQuery]                 = useState('');
  const [density, setDensity]             = useState<TableDensity>('cozy');
  const [selectedApp, setSelectedApp]     = useState<AdmissionApplication | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await admissionsService.getApplications(stageFilter);
      setApplications(data);
    } catch {
      toast.error('Failed to load admission applications.');
    } finally {
      setLoading(false);
    }
  }, [stageFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const q2 = query.toLowerCase();
      const matchQuery = !query || 
        app.applicantName.toLowerCase().includes(q2) || 
        app.applicationNumber.toLowerCase().includes(q2) ||
        app.email.toLowerCase().includes(q2);
      const matchStage = stageFilter === 'all' || app.stage === stageFilter;
      return matchQuery && matchStage;
    });
  }, [applications, query, stageFilter]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    const total = applications.length;
    const review = applications.filter(a => a.stage === 'document_verification' || a.stage === 'interview_scheduled').length;
    const approved = applications.filter(a => a.stage === 'registrar_approval' || a.stage === 'finance_approval' || a.stage === 'director_approval').length;
    const enrolled = applications.filter(a => a.stage === 'enrolled' || a.stage === 'student_created').length;

    return [
      {
        id: 'total_apps',
        title: 'Total Applications',
        value: total.toString(),
        subtitle: 'Online, Offline & Transfer Applicants',
        trendDirection: 'up',
        icon: <GraduationCap className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
      },
      {
        id: 'under_review',
        title: 'Verification & Interviews',
        value: review.toString(),
        subtitle: 'Registrar checking documents',
        trendDirection: 'neutral',
        icon: <Clock className="w-5 h-5 text-amber-500" />
      },
      {
        id: 'pending_approval',
        title: 'Decisions Pending',
        value: approved.toString(),
        subtitle: 'Assessments passed',
        trendDirection: 'up',
        icon: <FileCheck className="w-5 h-5 text-sky-505" />
      },
      {
        id: 'enrolled_scholars',
        title: 'Enrolled & Auto-Invoiced',
        value: enrolled.toString(),
        subtitle: 'Scholars with IDs generated',
        trendDirection: 'up',
        icon: <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      }
    ];
  }, [applications]);

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'applicationNumber',
        header: 'Application & Applicant',
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{app.applicationNumber}</span>
              <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm max-w-sm truncate">
                {app.applicantName}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{app.email || 'No email registered'}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'gradeApplyingFor',
        header: 'Target Grade & Program',
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-xs block">{row.original.gradeApplyingFor}</span>
            <span className="text-[11px] text-slate-400 capitalize">{row.original.applicationType} Application</span>
          </div>
        )
      },
      {
        accessorKey: 'guardianName',
        header: 'Guardian Info',
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">{row.original.guardianName} ({row.original.guardianRelationship})</span>
            <span className="font-mono text-[11px] text-slate-450">{row.original.guardianPhone}</span>
          </div>
        )
      },
      {
        accessorKey: 'stage',
        header: 'Workflow Stage',
        cell: ({ row }) => (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase ${stageColor(row.original.stage)}`}>
            <Clock className="w-3 h-3 shrink-0" />
            {(row.original.stage || '').replace(/_/g, ' ')}
          </span>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedApp(row.original);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-650 hover:text-white text-slate-705 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" />
            Inspect
          </button>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Admissions ERP & Student Onboarding Console"
      description="Automated 10-step admission workflow from online application, document verification, and assessment to automatic Student ID and Tuition Invoice generation."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Admissions ERP' }]}
      icon={<GraduationCap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={filteredApplications.length}
      recordLabel="Applications"
      onClearFilters={() => setStageFilter('all')}
      headerActions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-655/30 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Application</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search applications by applicant name, ADM number, email..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadData}
        customFilterNodes={
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            aria-label="Filter by admission stage"
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-indigo-500 shadow-2xs"
          >
            <option value="all">All Admission Stages</option>
            <option value="application_received">Application Received</option>
            <option value="document_verification">Document Verification</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="assessment_completed">Assessment Completed</option>
            <option value="enrolled">Enrolled & Auto-Invoiced</option>
          </select>
        }
      />

      <EnterpriseDataGrid
        data={filteredApplications}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={setSelectedApp}
        onRowClick={setSelectedApp}
        emptyStateProps={{
          title: 'No Applications Found',
          description: 'No student admission requests match your current query or workflow stage filter.',
          isFilterActive: stageFilter !== 'all' || query.length > 0,
          onResetFilters: () => { setStageFilter('all'); setQuery(''); },
          createLabel: 'Register New Applicant',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Detail Inspector Modal */}
      {selectedApp && (
        <AdmissionDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdated={loadData}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateApplicationModal
          onClose={() => setShowCreateModal(false)}
          onSaved={loadData}
        />
      )}
    </EnterpriseModuleShell>
  );
}
