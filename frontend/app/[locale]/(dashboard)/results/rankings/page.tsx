'use client';

import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Award, 
  TrendingUp, 
  Users, 
  UserMinus, 
  BookOpen, 
  Sliders, 
  Download, 
  Brain, 
  UserCheck, 
  Calendar,
  AlertTriangle,
  Percent,
  Search,
  Activity,
  Briefcase
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { toast } from 'sonner';

// Mock data for graphs
const gpaDistributionData = [
  { name: '4.0 (A+)', students: 12 },
  { name: '3.5-3.9 (A)', students: 28 },
  { name: '3.0-3.4 (B)', students: 45 },
  { name: '2.5-2.9 (C)', students: 30 },
  { name: '2.0-2.4 (D)', students: 15 },
  { name: '0.0-1.9 (F)', students: 8 }
];

const attendanceVsGpaData = [
  { attendance: 95, gpa: 3.8, name: 'Active' },
  { attendance: 90, gpa: 3.4, name: 'Active' },
  { attendance: 85, gpa: 2.9, name: 'Warning' },
  { attendance: 80, gpa: 2.2, name: 'Risk' },
  { attendance: 75, gpa: 1.8, name: 'Critical' },
  { attendance: 99, gpa: 3.95, name: 'Active' }
];

const boardingVsDayData = [
  { subject: 'Qur\'an Hifz', Boarding: 89, DayScholar: 82 },
  { subject: 'Mathematics', Boarding: 82, DayScholar: 79 },
  { subject: 'Physics', Boarding: 78, DayScholar: 74 },
  { subject: 'English Language', Boarding: 85, DayScholar: 83 },
  { subject: 'Chemistry', Boarding: 75, DayScholar: 71 }
];

const subjectDifficultyData = [
  { name: 'Chemistry', failRate: 18, color: '#EF4444' },
  { name: 'Calculus', failRate: 15, color: '#F59E0B' },
  { name: 'Physics', failRate: 12, color: '#3B82F6' },
  { name: 'Arabic Grammar', failRate: 8, color: '#10B981' }
];

interface RankStudent {
  rank: number;
  name: string;
  schoolId: string;
  gender: 'Male' | 'Female';
  program: string;
  gpa: number;
  credits: number;
}

export default function AcademicAnalyticsPage() {
  const [rankCategory, setRankCategory] = useState<'Overall' | 'Class' | 'Program' | 'Gender'>('Overall');
  const [searchVal, setSearchVal] = useState<string>('');

  const rankStudents: RankStudent[] = [
    { rank: 1, name: 'Fatima Zahra Ibrahim', schoolId: 'AC-2026-0012', gender: 'Female', program: 'Islamic Studies Track', gpa: 3.98, credits: 138 },
    { rank: 2, name: 'Zainab Abubakar Bello', schoolId: 'AC-2026-0089', gender: 'Female', program: 'Science Track', gpa: 3.95, credits: 142 },
    { rank: 3, name: 'Ahmad Abdullahi Musa', schoolId: 'AC-2026-0004', gender: 'Male', program: 'Science Track', gpa: 3.92, credits: 140 },
    { rank: 4, name: 'Maryam Usman Al-Faruq', schoolId: 'AC-2026-0105', gender: 'Female', program: 'Islamic Studies Track', gpa: 3.86, credits: 135 },
    { rank: 5, name: 'Bilal Umar Faruq', schoolId: 'AC-2026-0122', gender: 'Male', program: 'Arts & Languages', gpa: 3.78, credits: 136 }
  ];

  const handleExport = (format: 'PDF' | 'Excel' | 'PPT') => {
    toast.info(`Preparing Executive Registrar Analytics presentation in ${format} format...`);
    setTimeout(() => {
      toast.success(`Export successful! Academic_Report_Q3.${format.toLowerCase()} downloaded.`);
    }, 1500);
  };

  const filteredRank = rankStudents.filter(s => 
    s.name.toLowerCase().includes(searchVal.toLowerCase()) || 
    s.schoolId.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <PageContainer>
      <PageHeader
        title="Executive Academic Analytics & AI Insights"
        description="Review institutional performance stats, monitor teacher grading workloads, and access deterministic AI academic risk models."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('Excel')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-250 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel Logs</span>
          </button>
          <button
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Executive PDF Report</span>
          </button>
        </div>
      </PageHeader>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[
          { title: 'Cohort Passing Rate', value: '92.4%', desc: '+1.2% from previous term', icon: Percent, color: 'text-emerald-500 bg-emerald-500/10' },
          { title: 'Average CGPA Points', value: '3.24 / 4.00', desc: 'Weighted credit standard', icon: Award, color: 'text-amber-500 bg-amber-500/10' },
          { title: 'Active Risk Students', value: '8 Students', desc: 'Attendance & CA warnings', icon: AlertTriangle, color: 'text-rose-500 bg-rose-500/10' },
          { title: 'Hifz Completion Rate', value: '88%', desc: 'Juz 30 target cohort', icon: BookOpen, color: 'text-indigo-500 bg-indigo-500/10' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{card.title}</span>
                <span className="text-xl font-black text-slate-850 dark:text-white block">{card.value}</span>
                <span className="text-[10px] text-slate-500 block">{card.desc}</span>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* GPA Distribution Chart */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">GPA Distribution Cohort</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gpaDistributionData} margin={{ left: -25, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="students" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Boarding vs Day Scholar Chart */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Boarding vs Day-Scholar grades</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={boardingVsDayData} margin={{ left: -25, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" stroke="#94A3B8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Boarding" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="DayScholar" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Difficulty & Fail Rates */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subject Fail Indexes</h3>
          <div className="h-64 flex flex-col justify-around">
            {subjectDifficultyData.map((sub, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-200">{sub.name}</span>
                  <span className="text-rose-500">{sub.failRate}% Fail Rate</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${sub.failRate * 4}%`, backgroundColor: sub.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Rank Engine */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Academic Rank Engine</h3>
              <p className="text-xs text-slate-500 mt-0.5">Filter the institutional honors rank log</p>
            </div>

            <div className="flex items-center gap-2">
              <select 
                value={rankCategory}
                onChange={(e) => setRankCategory(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="Overall">Overall School</option>
                <option value="Class">Class Section</option>
                <option value="Program">Academic Program</option>
                <option value="Gender">Gender Division</option>
              </select>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
                <Search className="w-3.5 h-3.5 text-slate-450" />
                <input 
                  type="text" 
                  placeholder="Filter name..." 
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="bg-transparent border-none text-xs focus:outline-none w-28"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 p-2.5 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                  <th className="px-4 py-2 w-16 text-center">Rank</th>
                  <th className="px-4 py-2">Student Scholar</th>
                  <th className="px-4 py-2">Gender</th>
                  <th className="px-4 py-2">Program Track</th>
                  <th className="px-4 py-2">CGPA</th>
                  <th className="px-4 py-2">Credits completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredRank.map((student) => (
                  <tr key={student.rank} className="hover:bg-slate-55">
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[10px] font-black ${
                        student.rank === 1 ? 'bg-amber-500/20 text-amber-600' :
                        student.rank === 2 ? 'bg-slate-300 text-slate-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        #{student.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      <p>{student.name}</p>
                      <p className="text-[10px] text-slate-450">{student.schoolId}</p>
                    </td>
                    <td className="px-4 py-3">{student.gender}</td>
                    <td className="px-4 py-3 font-semibold text-slate-650">{student.program}</td>
                    <td className="px-4 py-3 font-black text-emerald-600">{student.gpa.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-500">{student.credits} Cr.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Section: Academic Intelligence Dashboard */}
        <div className="lg:col-span-1 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
          
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-5 h-5 text-indigo-500" />
              <span>Academic Intelligence Dashboard</span>
            </h3>
            <p className="text-[10px] text-slate-450">Deterministic risk analysis models and qualifier audits</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Risk Box */}
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
              <h4 className="font-bold text-rose-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>High Academic Fail Risk</span>
              </h4>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex justify-between">
                  <span>Yusuf Sani (JSS3)</span>
                  <span className="font-bold text-rose-500">82% Risk Score</span>
                </li>
                <li className="flex justify-between">
                  <span>Usman Lawal (SS1)</span>
                  <span className="font-bold text-rose-500">74% Risk Score</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-rose-500/10 text-[10px] text-rose-600 font-bold">
                Recommended intervention: Schedule parent-teacher warning conference.
              </div>
            </div>

            {/* Scholarship Qualifier Box */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <h4 className="font-bold text-emerald-600 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>Scholarship Eligible Audits</span>
              </h4>
              <ul className="space-y-1 text-slate-650 font-semibold">
                <li>• Fatima Zahra (GPA: 3.98)</li>
                <li>• Zainab Abubakar (GPA: 3.95)</li>
              </ul>
            </div>

            {/* Teacher Workload Index */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-500" />
                <span>Teacher Workload Audits</span>
              </h4>
              <div className="space-y-2 text-[11px] text-slate-550">
                <div className="flex justify-between">
                  <span>Ustadh Muhammad</span>
                  <span className="font-bold text-slate-700">120 assignments (0 pending)</span>
                </div>
                <div className="flex justify-between">
                  <span>Dr. Aisha Al-Hassan</span>
                  <span className="font-bold text-rose-500">90 assignments (14 late grades)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
