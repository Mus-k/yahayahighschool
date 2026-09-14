"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { Calendar, Clock, ExternalLink, MapPin, User } from "lucide-react";
import Link from "next/link";

interface TimetableSlot {
  documentId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  courseOffering?: {
    subject?: { name: string; color?: string };
    teacher?: { name: string; displayName?: string };
    room?: { name: string };
    gradeLevel?: { name: string };
  };
}

export default function TimetablePage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  
  const { section, isLoading: sectionLoading } = useSection();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterGrade, setFilterGrade] = useState("");

  useEffect(() => {
    async function fetchTimetable() {
      try {
        setIsLoading(true);
        const res = await apiClient.get("/timetable-slots", {
          params: {
            filters: { courseOffering: { academicSection: { documentId: { $eq: sectionId } } } },
            populate: ["courseOffering.subject", "courseOffering.teacher", "courseOffering.room", "courseOffering.gradeLevel"],
          },
        });
        setSlots(res.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch timetable", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTimetable();
  }, [sectionId]);

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const hasData = slots.length > 0;
  
  const filteredSlots = slots.filter(s => {
    if (filterGrade && s.courseOffering?.gradeLevel?.name !== filterGrade) return false;
    return true;
  });

  // Normalise time strings so sort works even without leading zeros (e.g. "9:00" vs "10:00")
  const normaliseTime = (t: string) => t ? t.padStart(8, '0') : '00:00:00';

  const uniqueGrades = Array.from(new Set(slots.map(s => s.courseOffering?.gradeLevel?.name).filter(Boolean)));

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-indigo-500" />
              Timetable
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Weekly class schedule for {section?.name || "this section"}.
            </p>
          </div>
          <Link
            href="/lms/timetables"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Timetables
          </Link>
        </div>

        <SectionSubNav activeTab="timetable" sectionId={sectionId} />

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
          <select 
            value={filterGrade} 
            onChange={e => setFilterGrade(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-white w-full md:w-[250px]"
          >
            <option value="">All Grade Levels</option>
            {uniqueGrades.map((g: any) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <Clock className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Timetable Configured</h3>
            <p className="text-slate-500 mt-2 mb-6 max-w-md">There are no schedule slots mapped to this section yet.</p>
            <Link
              href="/lms/timetables"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              Go to Timetable Console
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {DAYS.map(day => {
              const daySlots = filteredSlots
                .filter(s => s.dayOfWeek === day)
                .sort((a, b) => normaliseTime(a.startTime).localeCompare(normaliseTime(b.startTime)));
              if (daySlots.length === 0) return null;
              
              return (
                <div key={day} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 px-6 py-3">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{day}</h3>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {daySlots.map(slot => (
                      <div key={slot.documentId} className="flex flex-col md:flex-row md:items-center p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="md:w-48 mb-3 md:mb-0">
                          <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                            <Clock className="h-4 w-4 mr-2 text-indigo-500" />
                            {slot.startTime.substring(0,5)} - {slot.endTime.substring(0,5)}
                          </div>
                          <span className="inline-flex items-center mt-2 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                            {slot.courseOffering?.gradeLevel?.name}
                          </span>
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{slot.courseOffering?.subject?.name}</p>
                          </div>
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <User className="h-4 w-4 mr-2" />
                            {slot.courseOffering?.teacher?.displayName || slot.courseOffering?.teacher?.name || "TBA"}
                          </div>
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <MapPin className="h-4 w-4 mr-2" />
                            {slot.courseOffering?.room?.name || "TBA"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
