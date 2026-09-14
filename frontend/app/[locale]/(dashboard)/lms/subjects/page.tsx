'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { getSubjects } from '@/services/lms.service';
import type { Subject } from '@/types/lms.types';
import { BookOpen, Plus, Search, Layers, Clock, CheckCircle2, BookMarked, Edit3, Trash2 } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { FormBuilder, type FormFieldDef } from '@/components/ui/FormBuilder';
import { apiClient } from '@/services/api.service';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Core' | 'Elective' | 'Extracurricular'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const { user } = useAuth();
  const { userRole } = usePermissions();
  const canModify = userRole === 'super-administrator' || userRole === 'director';

  // Relation options states
  const [departmentsOptions, setDepartmentsOptions] = useState<{ label: string; value: string | number }[]>([]);
  const [programsOptions, setProgramsOptions] = useState<{ label: string; value: string | number }[]>([]);
  const [sectionsOptions, setSectionsOptions] = useState<{ label: string; value: string | number }[]>([]);
  const [teachersOptions, setTeachersOptions] = useState<{ label: string; value: string | number }[]>([]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const params: any = {};
      const roleType = userRole ? String(userRole).toLowerCase() : '';

      if (roleType === 'teacher' && user?.profile?.id) {
        params['filters[teachers][id][$eq]'] = user.profile.id;
      }

      const res = await getSubjects(params);
      setSubjects(res?.data || []);
    } catch (err) {
      toast.error('Failed to load academic subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [depRes, progRes, secRes, teachRes] = await Promise.all([
        apiClient.get('/departments?pagination[limit]=100'),
        apiClient.get('/programs?pagination[limit]=100'),
        apiClient.get('/sections?pagination[limit]=100'),
        apiClient.get('/teachers?pagination[limit]=100')
      ]);

      setDepartmentsOptions((depRes.data?.data || []).map((d: any) => ({ label: d.name || `Dept ${d.id}`, value: d.id })));
      setProgramsOptions((progRes.data?.data || []).map((p: any) => ({ label: p.name || `Program ${p.id}`, value: p.id })));
      setSectionsOptions((secRes.data?.data || []).map((s: any) => ({ label: s.name || `Section ${s.id}`, value: s.id })));
      setTeachersOptions((teachRes.data?.data || []).map((t: any) => ({ label: t.firstName ? `${t.firstName} ${t.lastName}` : t.schoolId || `Teacher ${t.id}`, value: t.id })));
    } catch (e) {
      console.warn('Failed to load options:', e);
    }
  };

  useEffect(() => {
    loadSubjects();
    if (canModify) {
      loadOptions();
    }
  }, [user, userRole]);

  const handleSave = async (formData: any) => {
    const payload = {
      name: formData.name,
      code: formData.code,
      subjectType: formData.subjectType,
      defaultWeeklyHours: parseInt(formData.defaultWeeklyHours) || 0,
      passingScore: parseInt(formData.passingScore) || 0,
      creditValue: parseInt(formData.creditValue) || 0,
      description: formData.description || '',
      color: formData.color || 'emerald',
      icon: formData.icon || 'book',
      activeStatus: formData.activeStatus !== undefined ? !!formData.activeStatus : true,
      department: formData.department ? parseInt(formData.department) : null,
      programs: formData.programs ? [parseInt(formData.programs)] : [],
      academicSection: formData.academicSection ? parseInt(formData.academicSection) : null,
      teachers: formData.teachers ? [parseInt(formData.teachers)] : [],
    };

    try {
      if (editingItem) {
        await apiClient.put(`/subjects/${editingItem.documentId || editingItem.id}`, { data: payload });
        toast.success('Subject updated successfully');
      } else {
        await apiClient.post('/subjects', { data: payload });
        toast.success('New subject added to registry');
      }
      setIsModalOpen(false);
      setEditingItem(null);
      loadSubjects();
    } catch (err: any) {
      toast.error('Failed to save subject record');
    }
  };

  const handleEditClick = (subject: any) => {
    setEditingItem({
      id: subject.id,
      documentId: subject.documentId,
      name: subject.name,
      code: subject.code,
      subjectType: subject.subjectType,
      defaultWeeklyHours: subject.defaultWeeklyHours,
      passingScore: subject.passingScore,
      creditValue: subject.creditValue,
      description: subject.description,
      color: subject.color,
      icon: subject.icon,
      activeStatus: subject.activeStatus,
      department: subject.department?.id || '',
      programs: subject.programs?.[0]?.id || '',
      academicSection: subject.academicSection?.id || '',
      teachers: subject.teachers?.[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: number | string, documentId?: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      await apiClient.delete(`/subjects/${documentId || id}`);
      toast.success('Subject deleted successfully');
      loadSubjects();
    } catch (e) {
      toast.error('Failed to delete subject');
    }
  };

  const getColorHex = (colorName: string) => {
    switch (colorName?.toLowerCase()) {
      case 'emerald': return '#10b981';
      case 'blue': return '#3b82f6';
      case 'amber': return '#f59e0b';
      case 'rose': return '#f43f5e';
      case 'purple': return '#8b5cf6';
      case 'indigo': return '#6366f1';
      default: return colorName || '#10b981';
    }
  };

  const filtered = subjects.filter(s => {
    if (selectedCategory !== 'All' && s.subjectType !== selectedCategory) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group filtered subjects by Academic Section
  const groupedSubjects = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filtered.forEach(s => {
      const sectionName = s.academicSection?.name || 'Unassigned Sections / General';
      if (!groups[sectionName]) {
        groups[sectionName] = [];
      }
      groups[sectionName].push(s);
    });
    return groups;
  }, [filtered]);

  const formFields: FormFieldDef[] = [
    {
      name: 'name',
      label: 'Subject Name',
      type: 'text',
      required: true,
      placeholder: 'e.g. Advanced Qur\'an Memorization & Hifz Track',
    },
    {
      name: 'code',
      label: 'Subject Code',
      type: 'text',
      required: true,
      placeholder: 'e.g. QUR-101',
    },
    {
      name: 'subjectType',
      label: 'Category Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Core', value: 'Core' },
        { label: 'Elective', value: 'Elective' },
        { label: 'Extracurricular', value: 'Extracurricular' },
      ],
    },
    {
      name: 'defaultWeeklyHours',
      label: 'Default Weekly Hours',
      type: 'number',
      required: true,
    },
    {
      name: 'passingScore',
      label: 'Passing Score (%)',
      type: 'number',
      required: true,
    },
    {
      name: 'creditValue',
      label: 'Credit Value',
      type: 'number',
      required: true,
    },
    {
      name: 'description',
      label: 'Track / Syllabus Description',
      type: 'textarea',
      placeholder: 'Describe the course syllabus, memorization targets, or core modules...',
    },
    {
      name: 'color',
      label: 'Display Color Tag',
      type: 'select',
      options: [
        { label: 'Emerald Green', value: 'emerald' },
        { label: 'Blue Sky', value: 'blue' },
        { label: 'Amber Orange', value: 'amber' },
        { label: 'Rose Red', value: 'rose' },
        { label: 'Purple Violet', value: 'purple' },
        { label: 'Indigo Navy', value: 'indigo' },
      ],
    },
    {
      name: 'icon',
      label: 'Display Icon Name',
      type: 'select',
      options: [
        { label: 'Book', value: 'book' },
        { label: 'Award / Star', value: 'award' },
        { label: 'Users', value: 'users' },
        { label: 'Clock', value: 'clock' },
        { label: 'Activity', value: 'activity' },
      ],
    },
    {
      name: 'department',
      label: 'Assigned Department',
      type: 'select',
      options: departmentsOptions,
    },
    {
      name: 'programs',
      label: 'Linked Academic Program',
      type: 'select',
      options: programsOptions,
    },
    {
      name: 'academicSection',
      label: 'Academic Section (Division) *',
      type: 'select',
      options: sectionsOptions,
      required: true,
    },
    {
      name: 'teachers',
      label: 'Primary Assigned Teacher',
      type: 'select',
      options: teachersOptions,
    },
    {
      name: 'activeStatus',
      label: 'Active & Enrolling',
      type: 'checkbox',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Academic Subjects & Classes Registry"
        description="Explore active institutional courses, Hifz tracks, weekly credit hours, and assigned curriculum modules."
      >
        {canModify && (
          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-primary/20 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Subject</span>
          </button>
        )}
      </PageHeader>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card shadow-2xs">
        <div className="flex items-center gap-2">
          {(['All', 'Core', 'Elective', 'Extracurricular'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedCategory(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border-none ${
                selectedCategory === tab
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {tab === 'All' ? 'All Subjects' : `${tab} Track`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subject code or title..."
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary" />
            <span>Total Taught: <strong className="text-foreground">{filtered.length} Courses</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <span>Weekly Workload: <strong className="text-foreground">{filtered.reduce((acc, s) => acc + (s.defaultWeeklyHours || 0), 0)} hrs</strong></span>
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-xs font-medium bg-card border border-border rounded-2xl shadow-2xs">
            Loading institutional academic subjects...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs font-medium bg-card border border-border rounded-2xl shadow-2xs">
            No subjects matched your filter criteria.
          </div>
        ) : (
          Object.entries(groupedSubjects).map(([sectionName, sectionSubjects]) => (
            <div key={sectionName} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <span className="w-1.5 h-5 rounded-full bg-indigo-600" />
                <h3 className="text-xs font-extrabold text-foreground tracking-wider uppercase font-mono">{sectionName}</h3>
                <span className="text-[9px] text-muted-foreground font-mono font-bold px-2 py-0.5 rounded-full bg-muted">
                  {sectionSubjects.length} {sectionSubjects.length === 1 ? 'Subject' : 'Subjects'}
                </span>
              </div>
              
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        <th className="px-6 py-4 font-extrabold text-foreground w-32">Course Code</th>
                        <th className="px-6 py-4 font-extrabold text-foreground">Subject Name & Track Description</th>
                        <th className="px-6 py-4 font-extrabold text-foreground w-28">Category</th>
                        <th className="px-6 py-4 font-extrabold text-foreground text-center w-32">Weekly Hours</th>
                        <th className="px-6 py-4 font-extrabold text-foreground text-center w-28">Passing Mark</th>
                        <th className="px-6 py-4 font-extrabold text-foreground text-center w-24">Status</th>
                        <th className="px-6 py-4 font-extrabold text-foreground text-right w-44">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sectionSubjects.map(s => (
                        <tr key={s.id} className="hover:bg-muted/30 transition">
                          <td className="px-6 py-4 font-mono font-extrabold text-primary">
                            {s.code}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getColorHex(s.color) }}></span>
                                <span className="font-bold text-foreground text-xs">{s.name}</span>
                              </div>
                              {s.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1 pl-5 font-normal">
                                  {s.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              s.subjectType === 'Core'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}>
                              {s.subjectType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-foreground">
                            {s.defaultWeeklyHours || 0} hrs/wk
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-bold text-muted-foreground">
                            {s.passingScore || 0}%
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              s.activeStatus
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{s.activeStatus ? 'Active' : 'Inactive'}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => toast.info(`Viewing curriculum syllabus for ${s.code}: ${s.name}`)}
                              className="text-primary hover:underline text-xs font-bold inline-flex items-center gap-1 cursor-pointer border-none bg-transparent"
                            >
                              <BookMarked className="w-3.5 h-3.5" />
                              <span>Syllabus</span>
                            </button>
                            {canModify && (
                              <>
                                <button
                                  onClick={() => handleEditClick(s)}
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 p-1 cursor-pointer inline-flex items-center border-none bg-transparent"
                                  title="Edit Subject"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(s.id, s.documentId)}
                                  className="text-rose-600 dark:text-rose-400 hover:text-rose-700 p-1 cursor-pointer inline-flex items-center border-none bg-transparent"
                                  title="Delete Subject"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-extrabold text-foreground mb-1">
              {editingItem ? 'Edit Subject Details' : 'Add New Subject'}
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              Define course attributes, credit weights, and map institutional relations below.
            </p>
            <FormBuilder
              fields={formFields}
              initialValues={editingItem || { 
                subjectType: 'Core', 
                defaultWeeklyHours: 5,
                passingScore: 70,
                creditValue: 3,
                activeStatus: true,
                color: 'emerald',
                icon: 'book'
              }}
              onSubmit={handleSave}
              draftKey="subject_form"
              submitLabel={editingItem ? 'Update Subject' : 'Add Subject'}
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
