'use client';

import { useState, useEffect } from 'react';
import { Plus, BookOpen, Users, Award, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { FormBuilder, type FormFieldDef } from '@/components/ui/FormBuilder';
import { apiClient } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';

interface CourseOffering {
  id: number;
  documentId: string;
  name?: string;
  code?: string;
  subject?: { name: string };
  academicSection?: { name: string };
  gradeLevel?: { name: string };
}

interface QuranGroup {
  id: number;
  documentId: string;
  name: string;
  code: string;
  capacity: number;
  meetingSchedule: string;
  location: string;
  isActive: boolean;
  quran_program?: { title: string };
  students?: any[];
}

export default function QuranGroupsWorkspace() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const teacher = (user as any)?.profile;

  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);

  const [groups, setGroups] = useState<QuranGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<QuranGroup | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!teacher?.id) {
      setIsLoadingOfferings(false);
      return;
    }

    const loadOfferings = async () => {
      try {
        const res = await apiClient.get('/course-offerings', {
          params: {
            filters: { teacher: { id: { $eq: teacher.id } }, offeringStatus: { $eq: 'ACTIVE' } },
            populate: ['subject', 'academicSection', 'gradeLevel', 'academicTerm', 'academicYear'],
            pagination: { limit: 100 }
          }
        });
        const items = res.data?.data || [];
        setOfferings(items);
        if (items.length > 0) {
          setSelectedOfferingId(items[0].documentId);
        }
      } catch (error) {
        toast.error('Failed to load course offerings');
      } finally {
        setIsLoadingOfferings(false);
      }
    };

    loadOfferings();
  }, [authLoading, teacher?.id]);

  useEffect(() => {
    if (!selectedOfferingId || !teacher?.id) {
        setGroups([]);
        return;
    }

    const loadGroups = async () => {
      setIsLoadingGroups(true);
      try {
        const res = await apiClient.get('/quran-groups', {
          params: {
            filters: { 
              // courseOffering filter will work after Strapi restart (schema updated).
              // For now scope by teacher only to avoid 500 on unmigrated column.
              teacher: { id: { $eq: teacher.id } },
            },
            populate: {
                students: { populate: '*' },
                quran_program: { populate: '*' },
                courseOffering: { populate: '*' }
            },
            pagination: { limit: 100 }
          }
        });
        setGroups(res.data?.data || []);
      } catch (error) {
        toast.error('Failed to load Quran groups');
      } finally {
        setIsLoadingGroups(false);
      }
    };

    loadGroups();
  }, [selectedOfferingId, teacher?.id]);

  if (authLoading || isLoadingOfferings) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!offerings.length) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Quran Course Offerings Assigned</h3>
          <p className="text-slate-500 mt-2 max-w-sm text-sm">
            You have no active Quran course offerings. Ask an administrator to assign you a Course Offering.
          </p>
          <button onClick={() => router.push('/lms/offerings')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
            View Course Offerings
          </button>
        </div>
      </PageContainer>
    );
  }

  const selectedOffering = offerings.find(o => o.documentId === selectedOfferingId);

  const handleSave = async (formData: any) => {
    if (!teacher?.id || !selectedOffering) return;

    try {
      if (editingGroup) {
        await apiClient.put(`/quran-groups/${editingGroup.documentId}`, { 
            data: { ...formData, capacity: Number(formData.capacity) } 
        });
        toast.success("Quran group updated successfully");
      } else {
        await apiClient.post('/quran-groups', { 
            data: { 
                ...formData, 
                capacity: Number(formData.capacity),
                teacher: teacher.id, 
                courseOffering: selectedOffering.id 
            } 
        });
        toast.success("New Quran group created");
      }
      
      // reload groups
      setIsLoadingGroups(true);
      const res = await apiClient.get('/quran-groups', {
        params: {
          filters: { 
            teacher: { id: { $eq: teacher.id } },
            courseOffering: { documentId: { $eq: selectedOfferingId } }
          },
          populate: {
              students: { populate: '*' },
              quran_program: { populate: '*' },
              courseOffering: { populate: '*' }
          },
          pagination: { limit: 100 }
        }
      });
      setGroups(res.data?.data || []);
      
      setIsModalOpen(false);
      setEditingGroup(null);
    } catch (err: any) {
      toast.error(editingGroup ? 'Failed to update group' : 'Failed to create group');
    }
  };

  const handleToggleStatus = async (group: QuranGroup) => {
    try {
        await apiClient.put(`/quran-groups/${group.documentId}`, {
            data: { isActive: !group.isActive }
        });
        setGroups(prev => prev.map(g => g.id === group.id ? { ...g, isActive: !g.isActive } : g));
        toast.success(`Group ${group.isActive ? 'deactivated' : 'activated'}`);
    } catch (e) {
        toast.error('Failed to toggle status');
    }
  };

  const formFields: FormFieldDef[] = [
    { name: 'name', label: 'Group Name', type: 'text', required: true, placeholder: 'e.g. Halaqah A' },
    { name: 'code', label: 'Group Code', type: 'text', required: true, placeholder: 'e.g. HAL-A' },
    { name: 'capacity', label: 'Capacity', type: 'number', required: true, defaultValue: 15 },
    { name: 'meetingSchedule', label: 'Meeting Schedule', type: 'text', required: true, placeholder: 'e.g. Mon, Wed, Fri 08:00 AM' },
    { name: 'location', label: 'Location / Room', type: 'text', required: true, placeholder: 'e.g. Mosque Room 1' },
    { name: 'isActive', label: 'Is Active?', type: 'checkbox', defaultValue: true },
  ];

  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.isActive).length;
  const totalStudents = groups.reduce((acc, g) => acc + (g.students?.length || 0), 0);
  
  return (
    <PageContainer>
      <PageHeader
        title="Quran Groups Workspace"
        description="Manage your Quran halaqahs and student groups for each course offering."
      >
        <div className="flex items-center gap-2">
            <select
                className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 min-w-[200px]"
                value={selectedOfferingId}
                onChange={(e) => setSelectedOfferingId(e.target.value)}
            >
                {offerings.map(offering => (
                    <option key={offering.id} value={offering.documentId}>
                        {offering.name || offering.subject?.name || offering.code} - {offering.academicSection?.name} ({offering.gradeLevel?.name})
                    </option>
                ))}
            </select>
          <button
            onClick={() => {
              setEditingGroup(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                <BookOpen className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-slate-500">Total Groups</p>
                <p className="text-xl font-bold">{totalGroups}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-slate-500">Active Groups</p>
                <p className="text-xl font-bold">{activeGroups}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="p-3 bg-sky-50 dark:bg-sky-900/30 rounded-xl text-sky-600 dark:text-sky-400">
                <Users className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-slate-500">Total Students</p>
                <p className="text-xl font-bold">{totalStudents}</p>
            </div>
        </div>
      </div>

      {isLoadingGroups ? (
        <div className="animate-pulse h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Quran Groups Yet</h3>
          <p className="text-slate-500 mt-2 max-w-sm text-sm">
            You haven't created any groups for this course offering yet.
          </p>
          <button onClick={() => { setEditingGroup(null); setIsModalOpen(true); }} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(group => (
                <div key={group.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="font-bold text-lg">{group.name}</h3>
                            <p className="text-sm text-slate-500">{group.code}</p>
                        </div>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${group.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {group.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    <div className="space-y-2 mb-6 flex-1">
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <Users className="w-4 h-4 mr-2" />
                            {group.students?.length || 0} / {group.capacity || 0} Students
                        </div>
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <Calendar className="w-4 h-4 mr-2" />
                            {group.meetingSchedule || 'Not scheduled'}
                        </div>
                        {group.quran_program?.title && (
                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                <Award className="w-4 h-4 mr-2" />
                                {group.quran_program.title}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button 
                            onClick={() => router.push(`/qms/memorization?group=${group.documentId}`)}
                            className="flex-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                        >
                            Open Group
                        </button>
                        <button 
                            onClick={() => { setEditingGroup(group); setIsModalOpen(true); }}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => handleToggleStatus(group)}
                            title={group.isActive ? "Deactivate" : "Activate"}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                        >
                            {group.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground mb-1">
              {editingGroup ? 'Edit Quran Group' : "Create New Quran Group"}
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              Set up the halaqah details.
            </p>
            <FormBuilder
              fields={formFields}
              initialValues={editingGroup || { 
                  isActive: true, 
                  capacity: 15,
                  code: selectedOffering?.code ? `${selectedOffering.code}-HAL` : ''
              }}
              onSubmit={handleSave}
              submitLabel={editingGroup ? 'Update Group' : 'Create Group'}
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
