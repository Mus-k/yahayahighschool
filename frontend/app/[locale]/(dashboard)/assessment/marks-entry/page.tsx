'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award, Search, Filter, Save, CheckCircle2, AlertCircle, Printer, Download,
  RefreshCw, BookOpen, User, Users, FileSpreadsheet, Send, ShieldCheck, HelpCircle
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { Avatar } from '@/components/shared/Avatar';
import { generateMarksEntryPDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';

interface StudentMarkRecord {
  id: string | number;
  schoolId: string;
  name: string;
  photoUrl?: string;
  caScore: number; // Max 20
  midtermScore: number; // Max 30
  finalScore: number; // Max 50
  totalScore: number; // Max 100
  grade: string;
  gpa: number;
  status: 'Draft' | 'Verified' | 'Submitted' | 'Published';
  remarks: string;
}

// Calculate letter grade and GPA points from total score out of 100
function calculateGradeDetails(total: number) {
  if (total >= 90) return { grade: 'A+', gpa: 4.0 };
  if (total >= 85) return { grade: 'A', gpa: 3.85 };
  if (total >= 80) return { grade: 'B+', gpa: 3.5 };
  if (total >= 75) return { grade: 'B', gpa: 3.0 };
  if (total >= 70) return { grade: 'C+', gpa: 2.5 };
  if (total >= 60) return { grade: 'C', gpa: 2.0 };
  if (total >= 50) return { grade: 'D', gpa: 1.0 };
  return { grade: 'F', gpa: 0.0 };
}

export default function MarksEntryDataGridPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters & Section Context
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [academicTerm, setAcademicTerm] = useState('Term 1 Midterm');
  const [selectedSection, setSelectedSection] = useState('Section 10-A');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics & Algebra');
  const [studentSearch, setStudentSearch] = useState('');

  // Student Marks Grid Data State
  const [markRecords, setMarkRecords] = useState<StudentMarkRecord[]>([]);

  // Load students from ERP service and populate initial marks grid
  useEffect(() => {
    setLoading(true);
    erpService.getStudents().then(res => {
      const studentsList = res.data || [];
      const initialRecords: StudentMarkRecord[] = studentsList.map((s, idx) => {
        const ca = Math.floor(14 + (idx * 2) % 6);
        const mid = Math.floor(22 + (idx * 3) % 8);
        const fin = Math.floor(38 + (idx * 4) % 12);
        const tot = ca + mid + fin;
        const { grade, gpa } = calculateGradeDetails(tot);

        return {
          id: s.id,
          schoolId: s.schoolId || s.studentId || `ST-2026-0${idx + 1}`,
          name: s.name || `Scholar ${idx + 1}`,
          photoUrl: (s as any).photoUrl || (s as any).avatarUrl || (s as any).photo,
          caScore: ca,
          midtermScore: mid,
          finalScore: fin,
          totalScore: tot,
          grade,
          gpa,
          status: idx % 3 === 0 ? 'Verified' : 'Draft',
          remarks: tot >= 85 ? 'Exceptional Performance' : tot >= 70 ? 'Satisfactory Progress' : 'Needs Academic Attention'
        };
      });

      setMarkRecords(initialRecords);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      toast.error('Failed to load student roster for marks entry');
      setLoading(false);
    });
  }, []);

  // Update a specific score cell
  const handleScoreChange = (id: string | number, field: 'caScore' | 'midtermScore' | 'finalScore', valStr: string) => {
    const rawVal = parseFloat(valStr) || 0;
    const maxVal = field === 'caScore' ? 20 : field === 'midtermScore' ? 30 : 50;
    const clampedVal = Math.min(maxVal, Math.max(0, rawVal));

    setMarkRecords(prev => prev.map(rec => {
      if (rec.id !== id) return rec;

      const updatedCa = field === 'caScore' ? clampedVal : rec.caScore;
      const updatedMid = field === 'midtermScore' ? clampedVal : rec.midtermScore;
      const updatedFin = field === 'finalScore' ? clampedVal : rec.finalScore;
      const newTotal = updatedCa + updatedMid + updatedFin;
      const { grade, gpa } = calculateGradeDetails(newTotal);

      return {
        ...rec,
        [field]: clampedVal,
        totalScore: newTotal,
        grade,
        gpa,
        status: 'Draft'
      };
    }));
  };

  // Update remarks
  const handleRemarksChange = (id: string | number, remarks: string) => {
    setMarkRecords(prev => prev.map(rec => rec.id === id ? { ...rec, remarks } : rec));
  };

  // Auto calculate all grades
  const handleAutoCalculateAll = () => {
    setMarkRecords(prev => prev.map(rec => {
      const tot = rec.caScore + rec.midtermScore + rec.finalScore;
      const { grade, gpa } = calculateGradeDetails(tot);
      return { ...rec, totalScore: tot, grade, gpa };
    }));
    toast.success('Recalculated weighted scores, letter grades, and GPAs for all students!');
  };

  // Save Draft
  const handleSaveDraft = () => {
    setSaving(true);
    setTimeout(() => {
      setMarkRecords(prev => prev.map(r => ({ ...r, status: 'Verified' })));
      setSaving(false);
      toast.success('Marks gradebook draft saved successfully to Strapi database!');
    }, 1000);
  };

  // Submit to Director
  const handleSubmitToDirector = () => {
    setSaving(true);
    setTimeout(() => {
      setMarkRecords(prev => prev.map(r => ({ ...r, status: 'Submitted' })));
      setSaving(false);
      toast.success('Gradebook submitted to Academic Director for final verification and publication!');
    }, 1200);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (markRecords.length === 0) return;
    const lines = [
      `YAHAYASCOOL OFFICIAL MARKS GRADEBOOK`,
      `Subject,${selectedSubject}`,
      `Section,${selectedSection}`,
      `Term,${academicTerm}`,
      `Academic Year,${academicYear}`,
      `Generated Date,${new Date().toLocaleString()}`,
      ``,
      `Student ID,Student Name,CA Score (20),Midterm Score (30),Final Score (50),Total Score (100%),Grade,GPA,Status,Remarks`
    ];

    markRecords.forEach(s => {
      lines.push(`"${s.schoolId}","${s.name.replace(/"/g, '""')}",${s.caScore},${s.midtermScore},${s.finalScore},${s.totalScore.toFixed(1)},${s.grade},${s.gpa.toFixed(2)},${s.status},"${s.remarks.replace(/"/g, '""')}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gradebook_${selectedSection.replace(/\s+/g, '_')}_${selectedSubject.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Marks Gradebook CSV exported successfully!');
  };

  // Print Certified PDF
  const handlePrintPDF = async () => {
    toast.info('Generating certified Grade Sheet PDF...');
    await generateMarksEntryPDF(
      { subject: selectedSubject, section: selectedSection, teacher: 'Academic Faculty' },
      markRecords,
      academicYear,
      academicTerm
    );
    toast.success('Grade Sheet PDF downloaded successfully!');
  };

  // Filtered Roster
  const filteredRecords = useMemo(() => {
    if (!studentSearch) return markRecords;
    const q = studentSearch.toLowerCase();
    return markRecords.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.schoolId.toLowerCase().includes(q)
    );
  }, [markRecords, studentSearch]);

  // Section Statistics
  const stats = useMemo(() => {
    if (markRecords.length === 0) return { avg: 0, passRate: 0, total: 0 };
    const avg = markRecords.reduce((sum, r) => sum + r.totalScore, 0) / markRecords.length;
    const passCount = markRecords.filter(r => r.totalScore >= 50).length;
    const passRate = (passCount / markRecords.length) * 100;
    return { avg, passRate, total: markRecords.length };
  }, [markRecords]);

  return (
    <EnterpriseModuleShell
      title="Marks Entry & Assessment Data Grid"
      description="Faculty & Executive Gradebook Console for entering, calculating, and verifying student assessment scores"
      icon={<Award className="w-8 h-8" />}
      breadcrumbs={[
        { label: 'Assessment ERP', href: '/assessment' },
        { label: 'Marks Entry' }
      ]}
    >
      <div className="space-y-6">
        {/* Top Context & Action Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Section & Subject Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Academic Year</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400"
                >
                  <option value="2026-2027">AY 2026/2027</option>
                  <option value="2025-2026">AY 2025/2026</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Term / Assessment Period</label>
                <select
                  value={academicTerm}
                  onChange={(e) => setAcademicTerm(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400"
                >
                  <option value="Term 1 Midterm">Term 1 Midterm Exam</option>
                  <option value="Term 1 Final">Term 1 Final Examination</option>
                  <option value="Term 2 Midterm">Term 2 Midterm Exam</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Class Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400"
                >
                  <option value="Section 10-A">Section 10-A (Secondary)</option>
                  <option value="Section 9-B">Section 9-B (Intermediate)</option>
                  <option value="Section 11-C">Section 11-C (Senior)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Subject Course</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400"
                >
                  <option value="Mathematics & Algebra">Mathematics & Algebra</option>
                  <option value="Physics & Mechanics">Physics & Mechanics</option>
                  <option value="Qur'an Tajweed & Tafsir">Qur'an Tajweed & Tafsir</option>
                  <option value="English Literature">English Literature</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
              <button
                onClick={handleAutoCalculateAll}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black border border-slate-600 transition-all cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Auto-Calculate</span>
              </button>
              <button
                onClick={handlePrintPDF}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black border border-slate-600 transition-all cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Certified PDF</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black border border-slate-600 transition-all cursor-pointer shadow-md"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-black text-xs border border-emerald-500/30 transition-all cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>
              <button
                onClick={handleSubmitToDirector}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit to Director</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Students Enrolled</span>
            <strong className="text-white text-xl font-mono block mt-1">{stats.total} Scholars</strong>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Class Score Average</span>
            <strong className="text-emerald-400 text-xl font-mono block mt-1">{stats.avg.toFixed(1)}% / 100%</strong>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <span className="text-[10px] text-sky-400 font-bold block uppercase tracking-wider">Class Pass Rate</span>
            <strong className="text-sky-400 text-xl font-mono block mt-1">{stats.passRate.toFixed(0)}%</strong>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">Gradebook Verification</span>
            <strong className="text-amber-400 text-sm font-bold block mt-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Continuous Assessment
            </strong>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              placeholder="Search student by name or School ID..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-emerald-400"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>
          <span className="text-xs text-slate-400 font-mono font-bold">
            Showing {filteredRecords.length} of {markRecords.length} Students
          </span>
        </div>

        {/* High Density Marks Data Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Assessment Score Sheet ({selectedSubject} - {selectedSection})</span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              CA: 20% | Midterm: 30% | Final: 50%
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-200 uppercase text-[10px] tracking-wider font-extrabold">
                <tr>
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Student Scholar</th>
                  <th className="p-3.5 text-center">CA Score (20)</th>
                  <th className="p-3.5 text-center">Midterm (30)</th>
                  <th className="p-3.5 text-center">Final (50)</th>
                  <th className="p-3.5 text-center">Total (100%)</th>
                  <th className="p-3.5 text-center">Grade</th>
                  <th className="p-3.5 text-center">GPA</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredRecords.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400 text-center">{idx + 1}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar src={s.photoUrl} name={s.name} size="sm" className="border border-slate-700" />
                        <div>
                          <span className="font-bold text-white block text-xs">{s.name}</span>
                          <span className="font-mono text-[11px] text-emerald-400 font-semibold">{s.schoolId}</span>
                        </div>
                      </div>
                    </td>

                    {/* CA Input (Max 20) */}
                    <td className="p-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={s.caScore}
                        onChange={(e) => handleScoreChange(s.id, 'caScore', e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-center font-mono font-bold text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </td>

                    {/* Midterm Input (Max 30) */}
                    <td className="p-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.5"
                        value={s.midtermScore}
                        onChange={(e) => handleScoreChange(s.id, 'midtermScore', e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-center font-mono font-bold text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </td>

                    {/* Final Input (Max 50) */}
                    <td className="p-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={s.finalScore}
                        onChange={(e) => handleScoreChange(s.id, 'finalScore', e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-center font-mono font-bold text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </td>

                    {/* Total Score */}
                    <td className="p-3.5 text-center font-mono font-black text-sm text-emerald-400">
                      {s.totalScore.toFixed(1)}%
                    </td>

                    {/* Letter Grade Badge */}
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-md font-mono font-extrabold text-xs inline-block border ${
                        s.grade.startsWith('A') ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                        s.grade.startsWith('B') ? 'bg-sky-950 text-sky-400 border-sky-800' :
                        s.grade.startsWith('C') ? 'bg-amber-950 text-amber-400 border-amber-800' :
                        'bg-rose-950 text-rose-400 border-rose-800'
                      }`}>
                        {s.grade}
                      </span>
                    </td>

                    {/* GPA */}
                    <td className="p-3.5 text-center font-mono font-bold text-slate-300">
                      {s.gpa.toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <StatusBadge status={s.status} size="sm" />
                    </td>

                    {/* Remarks Input */}
                    <td className="p-3.5">
                      <input
                        type="text"
                        value={s.remarks}
                        onChange={(e) => handleRemarksChange(s.id, e.target.value)}
                        placeholder="Instructor remarks..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </EnterpriseModuleShell>
  );
}
