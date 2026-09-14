/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Search, Plus, Award, RefreshCw, Layers, Users, Trash2, 
  Edit, Eye, X, CheckSquare, Square, Building, Check, Briefcase, Star
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProgramData {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  code?: string;
  active: boolean;
  isFeatured: boolean;
  description: string;
  objectives?: string;
  duration?: string;
  requirements?: string;
  department?: { id: number; title: string; code?: string };
  sectionsList?: any[];
  studentsList?: any[];
  teachersList?: any[];
}

export default function AcademicProgramsPage() {
  const [programs, setPrograms] = useState<ProgramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Dropdown options
  const [departments, setDepartments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Modal / Drawer state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDuration, setFormDuration] = useState('Full Academic Year');
  const [formDescription, setFormDescription] = useState('');
  const [formObjectives, setFormObjectives] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formDepartmentId, setFormDepartmentId] = useState<string | number>('');

  // Assigning rosters
  const [selectedSectionIds, setSelectedSectionIds] = useState<number[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  const [searchSectionQuery, setSearchSectionQuery] = useState('');
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [searchTeacherQuery, setSearchTeacherQuery] = useState('');

  useEffect(() => {
    loadPrograms();
    loadMetadata();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && formTitle) {
      setFormSlug(formTitle.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      );
    }
  }, [formTitle, isEditing]);

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/programs', {
        params: {
          populate: ['department', 'sectionsList', 'studentsList', 'teachersList'],
          'pagination[limit]': 100
        }
      });
      setPrograms(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load academic programs.');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [deptsRes, secsRes, studsRes, tchsRes] = await Promise.all([
        apiClient.get('/departments?pagination[limit]=100'),
        apiClient.get('/sections?pagination[limit]=150'),
        apiClient.get('/students?pagination[limit]=300'),
        apiClient.get('/teachers?pagination[limit]=300'),
      ]);

      setDepartments(deptsRes.data?.data || []);
      setSections(secsRes.data?.data || []);
      setStudents(studsRes.data?.data || []);
      setTeachers(tchsRes.data?.data || []);
    } catch (err) {
      console.warn('Failed to load options metadata.');
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedProgram(null);
    setFormTitle('');
    setFormSlug('');
    setFormCode('');
    setFormDuration('Full Academic Year');
    setFormDescription('');
    setFormObjectives('');
    setFormRequirements('');
    setFormActive(true);
    setFormIsFeatured(false);
    setFormDepartmentId('');
    setSelectedSectionIds([]);
    setSelectedStudentIds([]);
    setSelectedTeacherIds([]);
    setSearchSectionQuery('');
    setSearchStudentQuery('');
    setSearchTeacherQuery('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (prog: ProgramData) => {
    setIsEditing(true);
    setSelectedProgram(prog);
    setFormTitle(prog.title);
    setFormSlug(prog.slug);
    setFormCode(prog.code || '');
    setFormDuration(prog.duration || 'Full Academic Year');
    setFormDescription(prog.description);
    setFormObjectives(prog.objectives || '');
    setFormRequirements(prog.requirements || '');
    setFormActive(prog.active);
    setFormIsFeatured(prog.isFeatured || false);
    setFormDepartmentId(prog.department?.id || '');
    setSelectedSectionIds(prog.sectionsList?.map(s => s.id) || []);
    setSelectedStudentIds(prog.studentsList?.map(s => s.id) || []);
    setSelectedTeacherIds(prog.teachersList?.map(t => t.id) || []);
    setSearchSectionQuery('');
    setSearchStudentQuery('');
    setSearchTeacherQuery('');
    setShowFormModal(true);
  };

  const handleOpenInspect = (prog: ProgramData) => {
    setSelectedProgram(prog);
    setShowInspectModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSlug.trim() || !formDescription.trim()) {
      toast.error('Title, Slug, and Description are required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        data: {
          title: formTitle,
          slug: formSlug,
          code: formCode || null,
          duration: formDuration,
          description: formDescription,
          objectives: formObjectives,
          requirements: formRequirements,
          active: formActive,
          isFeatured: formIsFeatured,
          department: formDepartmentId || null,
          sectionsList: selectedSectionIds,
          studentsList: selectedStudentIds,
          teachersList: selectedTeacherIds,
        }
      };

      if (isEditing && selectedProgram) {
        await apiClient.put(`/programs/${selectedProgram.documentId || selectedProgram.id}`, payload);
        toast.success('Academic program track updated successfully.');
      } else {
        await apiClient.post('/programs', payload);
        toast.success('New academic program track created.');
      }

      setShowFormModal(false);
      loadPrograms();
    } catch (err) {
      toast.error('Failed to save academic program.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (prog: ProgramData) => {
    if (!confirm(`Are you sure you want to delete program track "${prog.code || ''} - ${prog.title}"?`)) return;
    try {
      await apiClient.delete(`/programs/${prog.documentId || prog.id}`);
      toast.success('Academic program track deleted successfully.');
      loadPrograms();
    } catch (err) {
      toast.error('Failed to delete academic program track.');
    }
  };

  // Checkbox togglers
  const toggleSectionSelection = (id: number) => {
    setSelectedSectionIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleStudentSelection = (id: number) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleTeacherSelection = (id: number) => {
    setSelectedTeacherIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Filter computations
  const filteredPrograms = useMemo(() => {
    return programs.filter(p =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.code?.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.department?.title?.toLowerCase().includes(query.toLowerCase())
    );
  }, [programs, query]);

  // Statistics computations
  const stats = useMemo(() => {
    const activeCount = programs.filter(p => p.active).length;
    const totalScholars = programs.reduce((sum, p) => sum + (p.studentsList?.length || 0), 0);
    const totalSections = programs.reduce((sum, p) => sum + (p.sectionsList?.length || 0), 0);

    return {
      active: activeCount,
      scholars: totalScholars,
      sections: totalSections
    };
  }, [programs]);

  // Sub-list searches
  const filteredSectionsList = useMemo(() => {
    return sections.filter(s => 
      s.name?.toLowerCase().includes(searchSectionQuery.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchSectionQuery.toLowerCase())
    );
  }, [sections, searchSectionQuery]);

  const filteredStudentsList = useMemo(() => {
    return students.filter(s => 
      s.name?.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
      s.schoolId?.toLowerCase().includes(searchStudentQuery.toLowerCase())
    );
  }, [students, searchStudentQuery]);

  const filteredTeachersList = useMemo(() => {
    return teachers.filter(t => 
      t.name?.toLowerCase().includes(searchTeacherQuery.toLowerCase()) ||
      t.schoolId?.toLowerCase().includes(searchTeacherQuery.toLowerCase())
    );
  }, [teachers, searchTeacherQuery]);

  return (
    <PageContainer>
      <div className="space-y-6 w-full text-slate-800 dark:text-slate-100 animate-fade-in">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              <span>Academic Programs & Curriculum Tracks</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enterprise administration of educational tracks, degree programs, and curriculum blueprints.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all border-none cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Program Track</span>
            </button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Active Tracks</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.active}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><BookOpen className="w-6 h-6" /></div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Scholars Enrolled</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.scholars}</h3>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"><Users className="w-6 h-6" /></div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Linked Academic Sections</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.sections}</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><Layers className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search academic program track, code, or department..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Programs List Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-2 animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-555" />
            <span>Loading academic programs from Strapi...</span>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm italic">No programs found matching your filters.</div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(100vh-340px)] pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
              {filteredPrograms.map((prog) => (
                <div 
                  key={prog.id} 
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-between shadow-sm group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-805 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-255 dark:border-emerald-900/30">
                          {prog.code || 'UNCODED'}
                        </span>
                        {prog.isFeatured && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 rounded text-[9px] font-bold border border-amber-255 dark:border-amber-900/30">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>Featured</span>
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                        prog.active 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-255 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                          : "bg-slate-100 text-slate-700 border-slate-250 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800"
                      )}>
                        {prog.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors leading-tight">
                      {prog.title}
                    </h3>
                    <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Department:</span>
                      <span className="text-slate-750 dark:text-slate-205 font-semibold">{prog.department?.title || 'General Education'}</span>
                    </p>
                    
                    <p className="text-slate-550 dark:text-slate-400 text-xs mt-3 leading-relaxed line-clamp-3">
                      {prog.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-150 dark:border-slate-850/80 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[9px]">Duration / Cycle</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5 block">{prog.duration || 'Full Academic Year'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[9px]">Academic Sections</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5 block">{prog.sectionsList?.length || 0} active divisions</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-150 dark:border-slate-850/60">
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-450" /> 
                      <span>{prog.studentsList?.length || 0} enrolled scholars</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenInspect(prog)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-505 dark:text-slate-305 border-none cursor-pointer"
                        title="Inspect Track Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(prog)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-505 dark:text-slate-305 border-none cursor-pointer"
                        title="Edit Track"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prog)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-rose-600 border-none cursor-pointer"
                        title="Delete Track"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INSPECT PROGRAM DETAILS MODAL ────────────────────────────── */}
        {showInspectModal && selectedProgram && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-6xl p-6 rounded-3xl shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto relative animate-slide-up text-xs text-slate-800 dark:text-slate-205">
              
              <button
                onClick={() => {
                  setShowInspectModal(false);
                  setSelectedProgram(null);
                }}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-450 font-mono">
                  {selectedProgram.code || 'UNCODED TRACK'}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight mt-0.5">{selectedProgram.title}</h3>
                <p className="text-slate-500 text-[10px] mt-0.5">{selectedProgram.description}</p>
              </div>

              {/* Roster Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-bold uppercase mb-0.5">Faculty Department</span>
                  <strong className="text-slate-700 dark:text-slate-350 text-sm">
                    {selectedProgram.department?.title || 'General Education'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase mb-0.5">Roster Capacity</span>
                  <strong className="text-slate-700 dark:text-slate-350 text-sm">{selectedProgram.studentsList?.length || 0} active scholars</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase mb-0.5">Sections Mapped</span>
                  <strong className="text-slate-700 dark:text-slate-350 text-sm">{selectedProgram.sectionsList?.length || 0} homerooms</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase mb-0.5">Featured Status</span>
                  <strong className={cn(
                    "text-sm font-bold uppercase",
                    selectedProgram.isFeatured ? "text-amber-500" : "text-slate-500"
                  )}>
                    {selectedProgram.isFeatured ? 'Featured' : 'Standard'}
                  </strong>
                </div>
              </div>

              {/* 4 Columns List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
                
                {/* Column 1: Objectives & Requirements */}
                <div className="space-y-4 md:col-span-2">
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <Award className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Learning Objectives & Syllabus Targets</span>
                    </h4>
                    <p className="text-[11px] leading-relaxed whitespace-pre-line text-slate-650 dark:text-slate-350 max-h-[150px] overflow-y-auto pr-1">
                      {selectedProgram.objectives || 'No objectives specified.'}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <Briefcase className="w-3.5 h-3.5 text-sky-500" />
                      <span>Enrollment Prerequisites & Requirements</span>
                    </h4>
                    <p className="text-[11px] leading-relaxed whitespace-pre-line text-slate-650 dark:text-slate-350 max-h-[150px] overflow-y-auto pr-1">
                      {selectedProgram.requirements || 'No prerequisites documented.'}
                    </p>
                  </div>
                </div>

                {/* Column 2: Mapped Academic Sections */}
                <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span>Mapped Academic Sections</span>
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-955 text-amber-700 dark:text-amber-300 rounded text-[10px] font-bold">
                      {selectedProgram.sectionsList?.length || 0}
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
                    {!selectedProgram.sectionsList || selectedProgram.sectionsList.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic py-4 text-center">No mapped sections.</p>
                    ) : (
                      selectedProgram.sectionsList.map((sec: any) => (
                        <div key={sec.id} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-0.5">
                          <strong className="text-slate-800 dark:text-slate-200 block text-[11px]">{sec.name}</strong>
                          <span className="text-slate-400 font-mono block text-[9px]">{sec.code}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 3: Enrolled Scholars & Teachers */}
                <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span>Roster Scholars</span>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-955 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold">
                      {selectedProgram.studentsList?.length || 0}
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
                    {!selectedProgram.studentsList || selectedProgram.studentsList.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic py-4 text-center">No enrolled scholars.</p>
                    ) : (
                      selectedProgram.studentsList.map((stud: any) => (
                        <div key={stud.id} className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg">
                          <span className="font-semibold text-slate-750 dark:text-slate-205 block text-[10px]">{stud.name}</span>
                          <span className="text-[9px] font-mono text-slate-400">{stud.schoolId || `ID: #${stud.id}`}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ── CREATE / EDIT WIZARD FORM MODAL ────────────────────────── */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl p-6 rounded-3xl shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto relative animate-slide-up text-xs text-slate-800 dark:text-slate-200">
              
              <button
                onClick={() => setShowFormModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Academic Program Details' : 'Create New Academic Program Track'}
                </h3>
                <p className="text-slate-500 text-[10px] mt-0.5">Specify track details, degree parameters, syllabus topics, and link departments.</p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                
                {/* 1. Core attributes grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Program Track Title *</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      placeholder="e.g. Hifz & Qur'anic Memorization Track"
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Track Slug *</label>
                    <input
                      type="text"
                      required
                      value={formSlug}
                      placeholder="hifz-memorization"
                      onChange={(e) => setFormSlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Track Code</label>
                    <input
                      type="text"
                      value={formCode}
                      placeholder="e.g. HI-QUR"
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Duration / Cycle</label>
                    <input
                      type="text"
                      value={formDuration}
                      placeholder="e.g. 2 Semesters / Annual Track"
                      onChange={(e) => setFormDuration(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                    <select
                      value={formDepartmentId}
                      onChange={(e) => setFormDepartmentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.title || d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Overview Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={formDescription}
                    placeholder="Enter overview and syllabus details..."
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Objectives & Targets</label>
                    <textarea
                      rows={3}
                      value={formObjectives}
                      placeholder="Outline learning outcomes..."
                      onChange={(e) => setFormObjectives(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Track Prerequisites</label>
                    <textarea
                      rows={3}
                      value={formRequirements}
                      placeholder="Specify requirements..."
                      onChange={(e) => setFormRequirements(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-[11px]"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="activeToggle"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="activeToggle" className="font-bold text-slate-700 dark:text-slate-350 cursor-pointer select-none">
                      Active Program Track
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featuredToggle"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="featuredToggle" className="font-bold text-slate-700 dark:text-slate-350 cursor-pointer select-none">
                      Featured Program
                    </label>
                  </div>
                </div>

                {/* 3. Assigning Rosters Grid (Sections / Scholars) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  
                  {/* Sections Mapped */}
                  <div className="space-y-2 flex flex-col">
                    <label className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                      Map Academic Sections ({selectedSectionIds.length})
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search sections..."
                        value={searchSectionQuery}
                        onChange={(e) => setSearchSectionQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[10px] focus:outline-none"
                      />
                    </div>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 max-h-[160px] overflow-y-auto space-y-1 bg-slate-50/20">
                      {filteredSectionsList.length === 0 ? (
                        <p className="text-[9px] text-slate-550 italic text-center py-4">No sections matched.</p>
                      ) : (
                        filteredSectionsList.map(s => {
                          const checked = selectedSectionIds.includes(s.id);
                          return (
                            <div 
                              key={s.id}
                              onClick={() => toggleSectionSelection(s.id)}
                              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 cursor-pointer hover:border-emerald-500/50"
                            >
                              <div className="min-w-0 leading-tight">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 block text-[10px]">{s.name}</span>
                                <span className="text-[9px] text-slate-400 font-mono block">{s.code}</span>
                              </div>
                              {checked ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-350" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Students Roster */}
                  <div className="space-y-2 flex flex-col sm:col-span-2">
                    <label className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                      Enroll Scholars ({selectedStudentIds.length})
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchStudentQuery}
                        onChange={(e) => setSearchStudentQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[10px] focus:outline-none"
                      />
                    </div>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 max-h-[160px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/20">
                      {filteredStudentsList.length === 0 ? (
                        <p className="text-[9px] text-slate-550 italic text-center py-4 col-span-2">No students matched.</p>
                      ) : (
                        filteredStudentsList.map(s => {
                          const checked = selectedStudentIds.includes(s.id);
                          return (
                            <div 
                              key={s.id}
                              onClick={() => toggleStudentSelection(s.id)}
                              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 cursor-pointer hover:border-emerald-500/50"
                            >
                              <div className="min-w-0 leading-tight">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 block text-[10px] truncate">{s.name}</span>
                                <span className="text-[9px] text-slate-400 font-mono block">{s.schoolId || `ID: #${s.id}`}</span>
                              </div>
                              {checked ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md disabled:opacity-50 cursor-pointer border-none"
                  >
                    {isSaving ? 'Saving Track...' : 'Save Program Track'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
