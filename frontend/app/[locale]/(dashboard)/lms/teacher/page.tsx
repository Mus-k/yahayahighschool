'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BookOpen, Calendar, ClipboardList, PenTool, ArrowRight, BookCheck, Users
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { getSubjects, getHomeworks, getTimetables } from '@/services/lms.service';
import type { Subject, Homework, TimetableSlot } from '@/types/lms.types';
import { toast } from 'sonner';

export default function TeacherDashboardPage() {
  const t = useTranslations('dashboard');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [timetables, setTimetables] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLMS() {
      try {
        const [subRes, hwRes, ttRes]: any = await Promise.all([
          getSubjects().catch(() => []),
          getHomeworks().catch(() => []),
          getTimetables().catch(() => [])
        ]);
        const subList = Array.isArray(subRes) ? subRes : Array.isArray(subRes?.data) ? subRes.data : Array.isArray(subRes?.data?.data) ? subRes.data.data : [];
        const hwList = Array.isArray(hwRes) ? hwRes : Array.isArray(hwRes?.data) ? hwRes.data : Array.isArray(hwRes?.data?.data) ? hwRes.data.data : [];
        const ttList = Array.isArray(ttRes) ? ttRes : Array.isArray(ttRes?.data) ? ttRes.data : Array.isArray(ttRes?.data?.data) ? ttRes.data.data : [];
        setSubjects(subList);
        setHomeworks(hwList);
        setTimetables(ttList);
      } catch (err) {
        toast.error('Failed to load LMS data');
      } finally {
        setLoading(false);
      }
    }
    loadLMS();
  }, []);

  const stats = [
    { label: 'My Subjects', value: subjects.length, icon: BookOpen, color: 'bg-emerald-500' },
    { label: "Today's Lessons", value: timetables.filter(t => t.dayOfWeek === 'Monday').length, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Pending Homework', value: homeworks.length, icon: PenTool, color: 'bg-amber-500' },
    { label: 'Ungraded Submissions', value: 0, icon: BookCheck, color: 'bg-rose-500' },
  ];

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-8 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                <div className="h-2 bg-slate-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Teacher Academic Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to the LMS Core. Manage your subjects, curriculum, and lesson delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl text-white ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="text-emerald-500" /> Assigned Subjects
              </h2>
              <Link href="/lms/subjects" className="text-sm text-primary flex items-center gap-1 hover:underline">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="divide-y border rounded-xl overflow-hidden">
              {subjects.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No subjects assigned yet.</div>
              ) : (
                subjects.map(sub => (
                  <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                        {sub.code.substring(0,2)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{sub.name}</h3>
                        <p className="text-xs text-slate-500">{sub.subjectType} &bull; {sub.creditValue} Credits</p>
                      </div>
                    </div>
                    <Link href={`/lms/subjects/${sub.id}`} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                      Curriculum
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Calendar className="w-32 h-32" />
            </div>
            <h2 className="text-xl font-bold relative z-10">Today's Schedule</h2>
            <div className="space-y-4 relative z-10">
              {timetables.filter(t => t.dayOfWeek === 'Monday').length === 0 ? (
                <p className="text-slate-400 text-sm">No classes scheduled for today.</p>
              ) : (
                timetables.filter(t => t.dayOfWeek === 'Monday').map(t => (
                  <div key={t.id} className="flex gap-4 p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <div className="flex flex-col items-center justify-center border-r border-slate-700 pr-4">
                      <span className="font-bold">{t.startTime.substring(0,5)}</span>
                      <span className="text-xs text-slate-400">AM</span>
                    </div>
                    <div>
                      <p className="font-semibold">{t.subject?.name || 'Subject'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Users className="w-3 h-3"/> {t.section?.name || 'Section'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
