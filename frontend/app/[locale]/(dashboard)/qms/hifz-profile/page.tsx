/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Book, Compass, Award, CheckCircle2, RefreshCw, Layers,
  Activity, Star, User, BookOpen, Scroll, ChevronRight
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function QmsProfilePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | number>('');
  const [hifzData, setHifzData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Muraja'ah checklists logs
  const [murajahLogs, setMurajahLogs] = useState<any[]>([
    { id: 1, date: '2026-07-27', surah: 'Al-Mulk', startAyah: 1, endAyah: 30, rating: 'Excellent' },
    { id: 2, date: '2026-07-26', surah: 'Al-Waqi\'ah', startAyah: 1, endAyah: 96, rating: 'Good' },
    { id: 3, date: '2026-07-25', surah: 'Ar-Rahman', startAyah: 1, endAyah: 78, rating: 'Excellent' }
  ]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/students', {
        params: {
          'pagination[limit]': 100
        }
      });
      const data = res.data?.data || [];
      setStudents(data);
      if (data.length > 0) {
        setSelectedStudentId(data[0].id);
      }
    } catch (e) {
      toast.error('Failed to load student registry');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHifzProfile = async () => {
    if (!selectedStudentId) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get('/islamic-extensions', {
        params: {
          'filters[student][id][$eq]': selectedStudentId,
          'pagination[limit]': 1
        }
      });
      const data = res.data?.data || [];
      if (data.length > 0) {
        setHifzData(data[0]);
      } else {
        // Return default mock values if no extension schema seeded yet
        setHifzData({
          currentJuz: 12,
          currentSurah: 'Yusuf',
          currentAyah: 45,
          tajweedCompetency: 'Intermediate',
          ijazahEarned: true,
          sanadChain: 'Linked from Sheikh Mahmoud to Hafs \'an \'Asim'
        });
      }
    } catch (e) {
      toast.error('Failed to query Islamic Hifz progress profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadHifzProfile();
    }
  }, [selectedStudentId]);

  return (
    <PageContainer>
      <PageHeader
        title="Qur'an Memorization (Hifz) & Tajweed Profile"
        description="Monitor scholar memorization progress, audit Surah/Juz logs, track revision (Muraja'ah), and issue Ijazah records."
      >
        <div className="flex items-center gap-3">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-card text-foreground focus:outline-none text-xs font-bold w-60 cursor-pointer"
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.schoolId || `ID ${s.id}`})
              </option>
            ))}
          </select>

          <button
            onClick={loadHifzProfile}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-805 dark:text-slate-100 font-bold">
        
        {/* Left Side: Juz map progress */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-4">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Book className="w-5 h-5 text-indigo-505" />
              <span>Memorization Summary</span>
            </h3>

            {hifzData && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-center space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase">Juz Memorized</span>
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono block">
                    {hifzData.currentJuz || 0} / 30
                  </span>
                  <span className="text-[10px] text-indigo-500/80 block font-bold">
                    Syllabus progress: {((hifzData.currentJuz || 0) / 30 * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-3 font-semibold border-t border-border pt-4">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Current Lesson Target</span>
                    <span className="text-foreground">Surah {hifzData.currentSurah || 'Al-Baqarah'} : Ayah {hifzData.currentAyah || 1}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Tajweed Competency Tiers</span>
                    <span className="inline-flex px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 font-bold mt-1">
                      {hifzData.tajweedCompetency || 'Beginner'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ijazah and Sanad verification */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-4">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Scroll className="w-5 h-5 text-indigo-505" />
              <span>Ijazah / Sanad Registry</span>
            </h3>

            {hifzData?.ijazahEarned ? (
              <div className="p-3.5 rounded-xl border border-emerald-250 bg-emerald-50/20 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-450 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-black text-xs">VERIFIED IJAZAH HOLDER</span>
                </div>
                <p className="text-[11px] font-normal leading-relaxed text-slate-500">{hifzData.sanadChain}</p>
              </div>
            ) : (
              <p className="text-muted-foreground italic font-normal text-center p-4">Ijazah not yet certified for this student profile.</p>
            )}
          </div>
        </div>

        {/* Right Side: Revision (Muraja'ah) history */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-505" />
            <span>Muraja'ah (Revision Logs)</span>
          </h3>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-6 py-3.5 font-extrabold text-foreground">Log Date</th>
                  <th className="px-6 py-3.5 font-extrabold text-foreground">Surah name</th>
                  <th className="px-6 py-3.5 font-extrabold text-foreground text-center">Ayahs Checked</th>
                  <th className="px-6 py-3.5 font-extrabold text-foreground text-center">Competency Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {murajahLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/15 transition">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-500">{log.date}</td>
                    <td className="px-6 py-4 text-primary font-bold">{log.surah}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold">
                      Ayah {log.startAyah} - {log.endAyah}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded text-[10px] font-bold border",
                        log.rating === 'Excellent' ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-250/50" : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border-indigo-250/50"
                      )}>
                        {log.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
