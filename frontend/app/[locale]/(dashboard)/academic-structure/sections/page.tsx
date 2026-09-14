/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Search, Plus, Users, School, Trash2, Edit2, Eye, X, 
  Check, BookOpen, Building, CheckSquare, Award, Languages, Book, Atom, HelpCircle, Palette
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SectionData {
  id: number;
  documentId?: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
  color?: string;
  icon?: string;
  capacity?: number;
  academicHead?: any;
  department?: any;
  program?: any;
  academicYear?: any;
  subjects?: any[];
  courseOfferings?: any[];
}

const AVAILABLE_ICONS = [
  { name: 'languages', label: 'Languages / Arabic', icon: Languages },
  { name: 'book', label: 'English / Literature', icon: Book },
  { name: 'award', label: "Quran / Hifz", icon: Award },
  { name: 'atom', label: 'Sciences / Mathematics', icon: Atom },
  { name: 'layers', label: 'General / Multi-subject', icon: Layers },
  { name: 'school', label: 'Administrative Unit', icon: School }
];

export default function AcademicSectionsPage() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Dropdown options
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Modal / Drawer state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formColor, setFormColor] = useState('#2563eb');
  const [formIcon, setFormIcon] = useState('layers');
  const [formAcademicHeadId, setFormAcademicHeadId] = useState<string | number>('');
  const [formCapacity, setFormCapacity] = useState<number | string>(35);
  const [formDepartmentId, setFormDepartmentId] = useState<string | number>('');
  const [formProgramId, setFormProgramId] = useState<string | number>('');
  const [formAcademicYearId, setFormAcademicYearId] = useState<string | number>('');

  useEffect(() => {
    loadSections();
    loadMetadata();
  }, []);

  const loadSections = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/sections', {
        params: {
          populate: ['academicHead', 'courseOfferings', 'courseOfferings.subject', 'department', 'program', 'academicYear'],
          'pagination[limit]': 100
        }
      });
      
      const rawSections = res.data?.data || [];
      const sectionsWithSubjects = rawSections.map((sec: any) => {
        const uniqueSubjectsMap = new Map();
        sec.courseOfferings?.forEach((offering: any) => {
          if (offering.subject) {
            uniqueSubjectsMap.set(offering.subject.id, offering.subject);
          }
        });
        return {
          ...sec,
          subjects: Array.from(uniqueSubjectsMap.values())
        };
      });

      setSections(sectionsWithSubjects);
    } catch (err) {
      toast.error('Failed to load Academic Sections.');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [tchsRes, deptsRes, progsRes, yearsRes] = await Promise.all([
        apiClient.get('/teachers?pagination[limit]=300'),
        apiClient.get('/departments?pagination[limit]=100'),
        apiClient.get('/programs?pagination[limit]=100'),
        apiClient.get('/academic-years?pagination[limit]=100')
      ]);
      setTeachers(tchsRes.data?.data || []);
      setDepartments(deptsRes.data?.data || []);
      setPrograms(progsRes.data?.data || []);
      setAcademicYears(yearsRes.data?.data || []);
    } catch (err) {
      console.warn('Failed to load form dropdown metadata:', err);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedSection(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormActive(true);
    setFormColor('#2563eb');
    setFormIcon('layers');
    setFormAcademicHeadId('');
    setFormCapacity(35);
    setFormDepartmentId('');
    setFormProgramId('');
    setFormAcademicYearId('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (sec: SectionData) => {
    setIsEditing(true);
    setSelectedSection(sec);
    setFormName(sec.name);
    setFormCode(sec.code);
    setFormDescription(sec.description || '');
    setFormActive(sec.active);
    setFormColor(sec.color || '#2563eb');
    setFormIcon(sec.icon || 'layers');
    setFormAcademicHeadId(sec.academicHead?.id || '');
    setFormCapacity(sec.capacity || 35);
    setFormDepartmentId(sec.department?.id || '');
    setFormProgramId(sec.program?.id || '');
    setFormAcademicYearId(sec.academicYear?.id || '');
    setShowFormModal(true);
  };

  const handleOpenInspect = (sec: SectionData) => {
    setSelectedSection(sec);
    setShowInspectModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      toast.error('Name and Code are required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        data: {
          name: formName,
          code: formCode,
          description: formDescription,
          active: formActive,
          color: formColor,
          icon: formIcon,
          capacity: formCapacity ? Number(formCapacity) : 35,
          academicHead: formAcademicHeadId ? Number(formAcademicHeadId) : null,
          department: formDepartmentId ? Number(formDepartmentId) : null,
          program: formProgramId ? Number(formProgramId) : null,
          academicYear: formAcademicYearId ? Number(formAcademicYearId) : null
        }
      };

      if (isEditing && selectedSection) {
        await apiClient.put(`/sections/${selectedSection.documentId || selectedSection.id}`, payload);
        toast.success('Academic Section updated successfully.');
      } else {
        await apiClient.post('/sections', payload);
        toast.success('New Academic Section created.');
      }

      setShowFormModal(false);
      loadSections();
    } catch (err) {
      toast.error('Failed to save Academic Section.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sec: SectionData) => {
    if (!confirm(`Are you sure you want to delete Academic Section "${sec.code} - ${sec.name}"?`)) return;
    try {
      await apiClient.delete(`/sections/${sec.documentId || sec.id}`);
      toast.success('Academic Section deleted successfully.');
      loadSections();
    } catch (err) {
      toast.error('Failed to delete Academic Section.');
    }
  };

  // Filter computations
  const filteredSections = useMemo(() => {
    return sections.filter(sec =>
      sec.name?.toLowerCase().includes(query.toLowerCase()) ||
      sec.code?.toLowerCase().includes(query.toLowerCase()) ||
      sec.description?.toLowerCase().includes(query.toLowerCase())
    );
  }, [sections, query]);

  // Statistics computations
  const stats = useMemo(() => {
    const activeCount = sections.filter(s => s.active).length;
    const totalSubjects = sections.reduce((sum, s) => sum + (s.subjects?.length || 0), 0);
    const totalOfferings = sections.reduce((sum, s) => sum + (s.courseOfferings?.length || 0), 0);

    return {
      active: activeCount,
      subjects: totalSubjects,
      offerings: totalOfferings
    };
  }, [sections]);

  const renderIcon = (iconName?: string) => {
    const matched = AVAILABLE_ICONS.find(i => i.name === iconName);
    const IconComponent = matched ? matched.icon : Layers;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <PageContainer>
      <div className="space-y-6 w-full text-slate-800 dark:text-slate-100 animate-fade-in text-xs">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Layers className="w-8 h-8 text-indigo-500" />
              <span>Academic Sections (Divisions)</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure institutional academic divisions responsible for teaching, syllabus, and course offerings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all border-none cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Academic Section</span>
            </button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Sections</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.active} Divisions</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-450"><Layers className="w-6 h-6" /></div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mapped Subjects</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.subjects} Subjects</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"><BookOpen className="w-6 h-6" /></div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Course Offerings</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.offerings} Classes</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-450"><School className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search sections by name, code or description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-505 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Academic Sections Grid Card Layout (Wow Aesthetics) */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="text-slate-550 dark:text-slate-400 text-xs font-medium">Loading Academic Sections...</p>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-500">
            No Academic Sections found. Create one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((sec) => {
              const headName = sec.academicHead 
                ? sec.academicHead.name 
                : 'No Head Assigned';
              
              return (
                <div 
                  key={sec.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    {/* Header with Custom Color Badge */}
                    <div className="flex items-center justify-between">
                      <div 
                        className="p-2.5 rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: sec.color || '#4f46e5' }}
                      >
                        {renderIcon(sec.icon)}
                      </div>
                      <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {sec.code}
                      </span>
                    </div>

                    {/* Section Details */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{sec.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {sec.description || 'No description provided.'}
                      </p>
                      {/* Program/Department Badges */}
                      {(sec.department || sec.program) && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {sec.department && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 rounded-md">
                              Dept: {sec.department.name || sec.department.title}
                            </span>
                          )}
                          {sec.program && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 rounded-md">
                              Prog: {sec.program.title || sec.program.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Stats List */}
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/80">
                        <span className="text-slate-400 block font-sans">Subjects</span>
                        <strong className="text-slate-800 dark:text-slate-200 text-xs font-black">{sec.subjects?.length || 0}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/80">
                        <span className="text-slate-400 block font-sans">Offerings</span>
                        <strong className="text-slate-800 dark:text-slate-200 text-xs font-black">{sec.courseOfferings?.length || 0}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-500">Academic Head:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-bold">{headName}</strong>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                      sec.active 
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-550 border-slate-200 dark:border-slate-700"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", sec.active ? "bg-emerald-500" : "bg-slate-400")} />
                      {sec.active ? 'Active' : 'Inactive'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenInspect(sec)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
                        title="Inspect Section"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(sec)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-505/10 transition-colors border-none bg-transparent cursor-pointer"
                        title="Edit Section"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sec)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-505/10 transition-colors border-none bg-transparent cursor-pointer"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CREATE / EDIT SECTION MODAL ──────────────────────────────── */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-2xl text-slate-900 dark:text-white animate-slide-up">
              <button
                onClick={() => setShowFormModal(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer border-none bg-transparent"
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>{isEditing ? 'Modify Academic Section' : 'Create Academic Section'}</span>
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Section Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Qur'an Memorization Section"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Section Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. QURAN"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Section Capacity Limit</label>
                    <input
                      type="number"
                      placeholder="e.g. 35"
                      value={formCapacity}
                      onChange={(e) => setFormCapacity(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Academic Head</label>
                    <select
                      value={formAcademicHeadId}
                      onChange={(e) => setFormAcademicHeadId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Department Head...</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name || `Teacher #${t.id}`} ({t.schoolId || `ID: ${t.id}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Academic Department</label>
                    <select
                      value={formDepartmentId}
                      onChange={(e) => setFormDepartmentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name || d.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Academic Program</label>
                    <select
                      value={formProgramId}
                      onChange={(e) => setFormProgramId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Program...</option>
                      {programs.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title || p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Academic Year</label>
                    <select
                      value={formAcademicYearId}
                      onChange={(e) => setFormAcademicYearId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Academic Year...</option>
                      {academicYears.map(y => (
                        <option key={y.id} value={y.id}>
                          {y.displayName || y.year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Theme color</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="w-10 h-8 rounded border border-slate-200 dark:border-slate-700 p-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="flex-1 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Section Icon</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {AVAILABLE_ICONS.map(i => {
                        const Icon = i.icon;
                        const isSelected = formIcon === i.name;
                        return (
                          <button
                            key={i.name}
                            type="button"
                            onClick={() => setFormIcon(i.name)}
                            className={cn(
                              "p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800",
                              isSelected 
                                ? "border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-600 bg-white" 
                                : "border-slate-200 dark:border-slate-700 text-slate-500"
                            )}
                            title={i.label}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[9px] font-medium truncate w-full text-center">{i.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Description / Objectives</label>
                    <textarea
                      placeholder="Objectives, mission, or administrative scope of this academic section..."
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${formActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formActive ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="text-xs">
                      <p className="font-bold">Active Status</p>
                      <p className="text-slate-500 text-[10px]">Disabled sections cannot have new course offerings mapped.</p>
                    </div>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFormModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer border-none shadow-sm flex items-center gap-1.5"
                    >
                      {isSaving && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                      <Check className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : 'Save Section'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── INSPECT SECTION DETAILS DRAWER ───────────────────────────── */}
        {showInspectModal && selectedSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/65 p-4 overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-2xl text-slate-900 dark:text-white animate-slide-up">
              <button
                onClick={() => setShowInspectModal(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer border-none bg-transparent"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Title Header with Color Ribbon */}
              <div className="flex items-start gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div 
                  className="p-3.5 rounded-2xl text-white shadow-md shadow-indigo-500/10"
                  style={{ backgroundColor: selectedSection.color || '#4f46e5' }}
                >
                  {renderIcon(selectedSection.icon)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/60">
                      {selectedSection.code}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize",
                      selectedSection.active 
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-250/50" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200"
                    )}>
                      {selectedSection.active ? 'Active Division' : 'Inactive'}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white mt-1.5">{selectedSection.name}</h2>
                </div>
              </div>

              {/* Inspect Info */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2 font-mono">Dossier Overview</h4>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/60">
                    {selectedSection.description || 'No objectives or overview details logged for this Academic Section.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/65 flex flex-col justify-between">
                    <span className="text-slate-400 font-bold block mb-1">Academic Department Head</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-xs font-black">
                      {selectedSection.academicHead 
                        ? selectedSection.academicHead.name 
                        : 'None Appointed'}
                    </strong>
                    {selectedSection.academicHead?.schoolId && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                        SIS Code: {selectedSection.academicHead.schoolId}
                      </span>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/65">
                    <span className="text-slate-400 font-bold block mb-2">Section Core Metrics</span>
                    <ul className="space-y-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      <li className="flex justify-between">
                        <span>Capacity Limit:</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{selectedSection.capacity || 35}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>Department:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedSection.department?.name || selectedSection.department?.title || 'None'}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>Academic Program:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedSection.program?.title || selectedSection.program?.name || 'None'}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>Academic Year:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedSection.academicYear?.displayName || selectedSection.academicYear?.year || 'None'}</strong>
                      </li>
                      <li className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span>Mapped Subjects:</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{selectedSection.subjects?.length || 0}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>Active Offerings (Classes):</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{selectedSection.courseOfferings?.length || 0}</strong>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Mapped Subjects & Course Offerings List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider font-mono">Mapped Subjects List</h4>
                  {selectedSection.subjects && selectedSection.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {selectedSection.subjects.map((sub: any) => (
                        <span 
                          key={sub.id}
                          className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold shadow-2xs"
                        >
                          {sub.name} ({sub.code})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-[11px]">No subjects mapped directly to this academic division yet.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowInspectModal(false);
                    handleOpenEdit(selectedSection);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer border-none shadow-sm flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Modify Section</span>
                </button>
                <button
                  onClick={() => setShowInspectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border-none"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
