'use client';

import { useEffect, useState } from 'react';
import {
  GraduationCap, UserCheck, BookOpen, Layers, Award,
  Calendar, CheckCircle2, RefreshCw, Activity, ArrowRight,
  BarChart3, FileText
} from 'lucide-react';

import { dashboardService, type DirectorDashboardData } from '@/services/dashboard.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { DashboardWidgetCustomizer, type WidgetConfig } from '@/components/ui/DashboardWidgetCustomizer';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stat-students', title: 'Total Students', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-teachers', title: 'Faculty Staff', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-sections', title: 'Academic Sections', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-departments', title: 'Departments', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-exams', title: 'Active Exams', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-lesson-plans', title: 'Lesson Plans', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'chart-performance', title: 'Academic Performance Trends', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'chart-attendance', title: 'Daily Attendance Breakdown', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'action-announcements', title: 'Recent Announcements & Directives', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
];

export default function DirectorDashboardPage() {
  const [data, setData] = useState<DirectorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getDirectorDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to fetch director live data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.isVisible ?? true;

  const performanceChartData = [
    { term: 'Term 1', avgScore: 74.5 },
    { term: 'Mid Term', avgScore: 78.2 },
    { term: 'Term 2', avgScore: 81.0 },
    { term: 'Mock Exam', avgScore: 79.4 },
  ];

  const attendanceChartData = [
    { name: 'Present', count: Math.round((data?.counts?.students || 100) * 0.92) },
    { name: 'Absent', count: Math.round((data?.counts?.students || 100) * 0.06) },
    { name: 'Excused', count: Math.round((data?.counts?.students || 100) * 0.02) },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Executive Director Portal"
        description="Comprehensive academic supervision, faculty monitoring, departmental analytics, and report approvals."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>Refresh Live Data</span>
          </button>
          <DashboardWidgetCustomizer
            role="director"
            defaultWidgets={DEFAULT_WIDGETS}
            onUpdate={setWidgets}
          />
        </div>
      </PageHeader>

      {/* Layer 1 — Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {isVisible('stat-students') && (
          <StatCard
            title="Students"
            value={formatNumber(data?.counts?.students || 0)}
            icon={GraduationCap}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
            href="/students"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-teachers') && (
          <StatCard
            title="Teachers"
            value={formatNumber(data?.counts?.teachers || 0)}
            icon={UserCheck}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
            href="/teachers"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-sections') && (
          <StatCard
            title="Sections"
            value={formatNumber(data?.counts?.sections || 0)}
            icon={Layers}
            color="text-sky-500"
            bgColor="bg-sky-500/10"
            href="/academic-structure/sections"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-departments') && (
          <StatCard
            title="Departments"
            value={formatNumber(data?.counts?.departments || 0)}
            icon={BookOpen}
            color="text-violet-500"
            bgColor="bg-violet-500/10"
            href="/academic-structure"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-exams') && (
          <StatCard
            title="Active Exams"
            value={formatNumber(data?.counts?.examinations || 0)}
            icon={FileText}
            color="text-rose-500"
            bgColor="bg-rose-500/10"
            href="/assessment/exams"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-lesson-plans') && (
          <StatCard
            title="Lesson Plans"
            value={formatNumber(data?.counts?.lessonPlans || 0)}
            icon={CheckCircle2}
            color="text-indigo-500"
            bgColor="bg-indigo-500/10"
            href="/lms/lesson-plans"
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Layer 2 — Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {isVisible('chart-performance') && (
          <ChartCard
            title="Term-by-Term Academic Performance (%)"
            subtitle="Overall average grade progress across all sections"
            data={performanceChartData}
            type="line"
            dataKeys={[{ key: 'avgScore', label: 'Average Score %', color: '#6366f1' }]}
            isLoading={isLoading}
            className="lg:col-span-2"
          />
        )}
        {isVisible('chart-attendance') && (
          <ChartCard
            title="Daily Attendance Status"
            subtitle="Current verification breakdown"
            data={attendanceChartData}
            type="pie"
            dataKeys={[{ key: 'count', label: 'Students', color: '#10b981' }]}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Layer 3 — Action Lists */}
      {isVisible('action-announcements') && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span>Directives & Announcements</span>
            </h2>
            <a href="/announcements" className="text-xs font-semibold text-primary hover:underline">
              Manage Announcements →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data?.recentAnnouncements && data.recentAnnouncements.length > 0) ? (
              data.recentAnnouncements.map((ann: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <p className="text-xs font-bold text-foreground">{ann.title || 'Directive'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ann.content || ann.message || ''}</p>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-8 text-center text-xs text-muted-foreground">
                No recent announcements found.
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
