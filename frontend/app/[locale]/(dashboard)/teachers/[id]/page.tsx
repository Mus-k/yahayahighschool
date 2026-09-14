'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import {
  UserCheck, Award, BookOpen, Layers, Calendar, Phone, Mail,
  MapPin, FileText, ArrowLeft, Printer, RefreshCw, AlertTriangle,
  GraduationCap, Building2
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import { Avatar } from '@/components/shared/Avatar';
import type { Teacher } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { RelationshipChip } from '@/components/erp/RelationshipChip';
import { getStrapiMediaUrl } from '@/services/cms.service';

import { apiClient } from '@/services/api.service';

export default function TeacherProfilePage() {
  const params = useParams();
  const idOrDocumentId = params?.id as string;
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [courseOfferings, setCourseOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'students' | 'documents'>('overview');

  useEffect(() => {
    if (!idOrDocumentId) return;
    async function loadTeacher() {
      setLoading(true);
      try {
        const data = await erpService.getTeacherById(idOrDocumentId);
        setTeacher(data);
        // Also load course offerings for this teacher
        if (data?.id) {
          const offeringsRes = await apiClient.get('/course-offerings', {
            params: {
              filters: { teacher: { id: { $eq: data.id } } },
              populate: ['subject', 'academicSection', 'gradeLevel', 'academicYear', 'academicTerm', 'room'],
              pagination: { limit: 100 }
            }
          }).catch(() => ({ data: { data: [] } }));
          setCourseOfferings(offeringsRes.data?.data || []);
        }
      } catch (err) {
        console.error('Failed loading teacher profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeacher();
  }, [idOrDocumentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
        <span className="text-sm font-semibold">Loading Faculty Profile & Teaching Roster...</span>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center rounded-2xl border border-slate-800 bg-slate-900/60 my-12">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-100">Faculty Member Profile Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          The requested teacher ID ({idOrDocumentId}) does not exist or has been removed.
        </p>
        <Link
          href="/teachers"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Faculty Roster</span>
        </Link>
      </div>
    );
  }

  const photoUrl = teacher.photo ? getStrapiMediaUrl(teacher.photo) : null;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <Link
          href="/teachers"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Back to Faculty Roster</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Faculty Dossier</span>
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar
            src={teacher.photo}
            name={teacher.name}
            size="2xl"
            className="border-2 border-amber-500/40 shadow-lg flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold">
                {teacher.schoolId || `#TCH-${teacher.id}`}
              </span>
              <StatusBadge status={teacher.employmentStatus} size="md" />
              {teacher.salaryGrade && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-bold">
                  Grade: {teacher.salaryGrade}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white truncate">{teacher.name}</h1>
            <p className="text-sm font-bold text-amber-400 mt-1">{teacher.specializations || teacher.qualifications || 'Academic Teaching Faculty'}</p>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              {teacher.experienceYears !== undefined && <span>Experience: <strong>{teacher.experienceYears} Years</strong></span>}
              {teacher.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-500" /> {teacher.phone}</span>}
              {teacher.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {teacher.email}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'overview', label: 'Biography & Credentials', icon: Award },
          { id: 'classes', label: 'Assigned Sections & Subjects', icon: Layers },
          { id: 'students', label: 'Direct Mentees Roster', icon: GraduationCap },
          { id: 'documents', label: 'Certificates & Documents', icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                active
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
              <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Scholar Biography & Teaching Philosophy</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {teacher.biography || `${teacher.name} is a dedicated faculty member at Yahaya International High School specializing in ${teacher.specializations || 'Academic Studies'}. Committed to fostering discipline, ethical reasoning, and academic rigor.`}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Academic Degrees & Qualifications</span>
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {teacher.qualifications || 'B.A. / M.A. in Islamic Sciences & Educational Pedagogy — Certified High School Teacher.'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4 text-xs">
              <h3 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>Departmental & Program Affiliation</span>
              </h3>
              <div>
                <span className="text-slate-500 font-semibold block mb-1.5">Academic Departments:</span>
                {teacher.departments && teacher.departments.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.departments.map((d: any) => (
                      <RelationshipChip key={d.id} type="department" label={d.name} />
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Core High School Faculty</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1.5">Specialized Programs:</span>
                {teacher.programs && teacher.programs.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.programs.map((p: any) => (
                      <RelationshipChip key={p.id} type="program" label={p.name} />
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">General Curriculum</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl text-xs space-y-2 font-mono">
              <span className="text-slate-500 uppercase font-bold block mb-2">Emergency Contact Record</span>
              <p className="text-slate-300">{teacher.emergencyContact || 'Contact Administration Office'}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Course Offerings */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Assigned Course Offerings ({courseOfferings.length})</span>
            </h3>
            {courseOfferings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseOfferings.map((o: any) => (
                  <div key={o.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-amber-400 text-xs">{o.subject?.code || '—'}</span>
                      <span className="text-[11px] text-slate-400">{o.academicTerm?.name}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 mb-1">{o.subject?.name || 'Unnamed Subject'}</h4>
                    <p className="text-xs text-slate-400">{o.academicSection?.name} · {o.gradeLevel?.name}</p>
                    {o.room && <p className="text-[11px] text-slate-500 mt-1 font-mono">Room {o.room.roomNumber}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-4 text-center">No course offerings assigned to this instructor.</p>
            )}
          </div>

          {/* Linked Sections */}
          {teacher?.sections && teacher.sections.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Linked Academic Sections</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacher.sections.map((sec: any) => (
                  <div key={sec.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-amber-400 text-sm">{sec.code}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 mb-1">{sec.name}</h4>
                    <p className="text-xs text-slate-400">{sec.description || 'Academic section'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <span>Direct Mentees / Supervised Students Roster</span>
          </h3>
          {teacher.students && teacher.students.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacher.students.map((st: any) => (
                <Link
                  key={st.id}
                  href={`/students/${st.documentId || st.id}`}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="font-mono text-[11px] text-amber-400 font-bold">{st.schoolId || `#ST-${st.id}`}</span>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">{st.firstName} {st.lastName}</h4>
                  </div>
                  <StatusBadge status={st.status} size="sm" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-8 text-center">No direct mentee relationship linked yet.</p>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Certificates & Faculty Documents</span>
          </h3>
          {teacher.documents && teacher.documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {teacher.documents.map((doc, idx) => (
                <a
                  key={idx}
                  href={getStrapiMediaUrl(doc) || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 flex items-center gap-3 transition-all"
                >
                  <FileText className="w-8 h-8 text-amber-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{doc.name || `Credential #${idx + 1}`}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">{(doc.size || 0).toFixed(1)} KB</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-12 text-center">No attached certificates found.</p>
          )}
        </div>
      )}
    </div>
  );
}
