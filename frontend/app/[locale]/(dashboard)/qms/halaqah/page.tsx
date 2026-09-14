'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { BookOpen, Calendar, Clock, Edit2, Eye, Plus, Users, AlertCircle, X, Check, Search } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, parseISO } from 'date-fns';

interface CourseOffering {
  id: string | number;
  documentId: string;
  name: string;
}

interface QuranGroup {
  id: string | number;
  documentId: string;
  name: string;
  students: any[];
  courseOffering: CourseOffering;
}

interface Halaqah {
  id: string | number;
  documentId: string;
  topic: string;
  date: string;
  versesCovered: string;
  corrections: string;
  teacherNotes: string;
  students: any[];
  quran_group: QuranGroup;
}

export default function HalaqahPage() {
  const { user, isLoading: authLoading } = useAuth();
  const teacher = (user as any)?.profile;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<string>('');
  
  const [quranGroups, setQuranGroups] = useState<QuranGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  
  const [sessions, setSessions] = useState<Halaqah[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Halaqah | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    quran_group: '',
    topic: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    versesCovered: '',
    corrections: '',
    teacherNotes: '',
    students: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!teacher?.id) {
      setIsLoading(false);
      return;
    }
    loadInitialData();
  }, [authLoading, teacher?.id]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      // Load offerings
      const offeringsRes = await apiClient.get('/course-offerings', {
        params: {
          filters: { teacher: { id: { $eq: teacher.id } }, offeringStatus: { $eq: 'ACTIVE' } },
          pagination: { limit: 100 }
        }
      });
      setOfferings(offeringsRes.data?.data || []);

      // Load groups
      const groupsRes = await apiClient.get('/quran-groups', {
        params: {
          filters: { teacher: { id: { $eq: teacher.id } } },
          populate: ['students', 'courseOffering'],
          pagination: { limit: 100 }
        }
      });
      setQuranGroups(groupsRes.data?.data || []);
      
      await loadSessions();
    } catch (error) {
      toast.error('Failed to load halaqah data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async (groupId?: string) => {
    try {
      const filters: any = { teacher: { id: { $eq: teacher?.id } } };
      if (groupId) {
        filters.quran_group = { documentId: { $eq: groupId } };
      }
      
      const res = await apiClient.get('/halaqahs', {
        params: {
          filters,
          populate: ['students', 'quran_group'],
          sort: 'date:desc',
          pagination: { limit: 100 }
        }
      });
      setSessions(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to load sessions');
    }
  };

  useEffect(() => {
    if (!isLoading && teacher?.id) {
      loadSessions(selectedGroup);
    }
  }, [selectedGroup]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quran_group || !formData.topic || !formData.date) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const group = quranGroups.find(g => g.documentId === formData.quran_group);
      
      await apiClient.post('/halaqahs', {
        data: {
          topic: formData.topic,
          date: formData.date,
          versesCovered: formData.versesCovered,
          corrections: formData.corrections,
          teacherNotes: formData.teacherNotes,
          teacher: teacher.documentId, // or teacher.id depending on setup, but typically documentId for relations
          quran_group: formData.quran_group,
          students: formData.students
        }
      });
      toast.success('Halaqah session recorded successfully');
      setIsModalOpen(false);
      loadSessions(selectedGroup);
      
      // Reset form
      setFormData({
        quran_group: '',
        topic: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        versesCovered: '',
        corrections: '',
        teacherNotes: '',
        students: []
      });
    } catch (error) {
      toast.error('Failed to save session');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewDetails = (session: Halaqah) => {
    setSelectedSession(session);
    setIsDetailModalOpen(true);
  };

  if (authLoading || isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!teacher?.id || offerings.length === 0) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
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

  // Calculate stats
  const totalSessions = sessions.length;
  const totalVersesCovered = sessions.filter(s => s.versesCovered).length; // rough stat
  const recentSession = sessions[0];

  return (
    <PageContainer>
      <PageHeader 
        title="Halaqah Sessions Workspace" 
        description="Manage your Quran groups and teaching sessions"
      />

      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <select 
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 w-full md:w-64"
            value={selectedOffering}
            onChange={(e) => setSelectedOffering(e.target.value)}
          >
            <option value="">All Offerings</option>
            {offerings.map(o => (
              <option key={o.documentId} value={o.documentId}>{o.name}</option>
            ))}
          </select>

          <select 
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 w-full md:w-64"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">All Quran Groups</option>
            {quranGroups.map(g => (
              <option key={g.documentId} value={g.documentId}>{g.name}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Record Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Sessions</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalSessions}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Groups</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{quranGroups.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Last Session</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {recentSession ? format(parseISO(recentSession.date), 'MMM d, yyyy') : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
            No halaqah sessions found for the selected criteria.
          </div>
        ) : (
          sessions.map(session => (
            <div key={session.documentId} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row gap-6 shadow-sm hover:border-indigo-300 transition-colors">
              <div className="flex flex-col justify-center items-center md:items-start min-w-[120px] md:border-r border-slate-200 dark:border-slate-800 pr-4">
                <span className="text-xs font-semibold text-slate-500 uppercase">{format(parseISO(session.date), 'MMM')}</span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{format(parseISO(session.date), 'dd')}</span>
                <span className="text-xs text-slate-500">{format(parseISO(session.date), 'yyyy')}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 mb-2">
                      {session.quran_group?.name || 'Unknown Group'}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{session.topic}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => viewDetails(session)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span className="truncate">Verses: {session.versesCovered || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Attendees: {session.students?.length || 0}</span>
                  </div>
                  {session.teacherNotes && (
                    <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                      <Edit2 className="w-4 h-4 text-slate-400" />
                      <span className="truncate">Notes: {session.teacherNotes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold">Record Halaqah Session</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quran Group *</label>
                    <select 
                      required
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                      value={formData.quran_group}
                      onChange={(e) => {
                        setFormData({...formData, quran_group: e.target.value});
                      }}
                    >
                      <option value="">Select Group...</option>
                      {quranGroups.map(g => (
                        <option key={g.documentId} value={g.documentId}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input 
                      type="date"
                      required
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Topic *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Al-Baqarah 1-20"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Verses Covered</label>
                  <input 
                    type="text"
                    placeholder="e.g. 15 verses"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                    value={formData.versesCovered}
                    onChange={(e) => setFormData({...formData, versesCovered: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Corrections (Common Mistakes)</label>
                  <textarea 
                    rows={2}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                    value={formData.corrections}
                    onChange={(e) => setFormData({...formData, corrections: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Teacher Notes</label>
                  <textarea 
                    rows={2}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900"
                    value={formData.teacherNotes}
                    onChange={(e) => setFormData({...formData, teacherNotes: e.target.value})}
                  />
                </div>

                {/* Attendees - simple multi select logic */}
                {formData.quran_group && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Attendees</label>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                      {quranGroups.find(g => g.documentId === formData.quran_group)?.students?.map((student: any) => (
                        <label key={student.documentId} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={formData.students.includes(student.documentId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({...formData, students: [...formData.students, student.documentId]});
                              } else {
                                setFormData({...formData, students: formData.students.filter(id => id !== student.documentId)});
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <span className="text-sm font-medium">{student.firstName} {student.lastName}</span>
                        </label>
                      )) || <span className="text-sm text-slate-500">No students found in this group</span>}
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <button 
                        type="button"
                        className="text-xs text-indigo-600 font-medium"
                        onClick={() => {
                          const groupStudents = quranGroups.find(g => g.documentId === formData.quran_group)?.students?.map((s: any) => s.documentId) || [];
                          setFormData({...formData, students: groupStudents});
                        }}
                      >Select All</button>
                      <button 
                        type="button"
                        className="text-xs text-slate-500 font-medium"
                        onClick={() => setFormData({...formData, students: []})}
                      >Clear</button>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Session'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {isDetailModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold">Session Details</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Topic</span>
                <p className="text-lg font-medium text-slate-900 dark:text-white">{selectedSession.topic}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Date</span>
                  <p className="text-sm text-slate-900 dark:text-white">{format(parseISO(selectedSession.date), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Group</span>
                  <p className="text-sm text-slate-900 dark:text-white">{selectedSession.quran_group?.name}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Verses Covered</span>
                  <p className="text-sm text-slate-900 dark:text-white">{selectedSession.versesCovered || 'None specified'}</p>
                </div>
              </div>
              
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Corrections</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                  {selectedSession.corrections || 'No corrections recorded.'}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Teacher Notes</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                  {selectedSession.teacherNotes || 'No notes.'}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Attendees ({selectedSession.students?.length || 0})</span>
                <ul className="space-y-2">
                  {selectedSession.students?.map((student: any) => (
                    <li key={student.documentId} className="flex items-center gap-2 text-sm bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </div>
                      <span className="font-medium">{student.firstName} {student.lastName}</span>
                    </li>
                  ))}
                  {!selectedSession.students?.length && (
                    <p className="text-sm text-slate-500 italic">No attendees recorded.</p>
                  )}
                </ul>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
