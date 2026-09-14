'use client';

import { useEffect, useState } from 'react';
import {
  ClipboardList, CheckCircle2, Calendar, Wallet, RefreshCw,
  Bell, FolderOpen, ArrowRight, UserCog
} from 'lucide-react';

import { dashboardService, type WorkerDashboardData } from '@/services/dashboard.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { DashboardWidgetCustomizer, type WidgetConfig } from '@/components/ui/DashboardWidgetCustomizer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stat-tasks', title: 'Assigned Tasks', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-attendance', title: 'My Attendance', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-leave', title: 'Leave Days Available', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-salary', title: 'Next Payroll Date', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'chart-tasks', title: 'Task Completion & Work History', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'action-announcements', title: 'Staff Notices & Directives', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
];

export default function WorkerDashboardPage() {
  const [data, setData] = useState<WorkerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getWorkerDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to load worker live dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.isVisible ?? true;

  const taskChartData = [
    { week: 'Wk 1', completed: 8, pending: 1 },
    { week: 'Wk 2', completed: 10, pending: 0 },
    { week: 'Wk 3', completed: 7, pending: 2 },
    { week: 'Wk 4', completed: 9, pending: 1 },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Worker Portal"
        description="Check your assigned duties, log attendance, request leave, and view staff notices."
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
            role="worker"
            defaultWidgets={DEFAULT_WIDGETS}
            onUpdate={setWidgets}
          />
        </div>
      </PageHeader>

      {/* Layer 1 — Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isVisible('stat-tasks') && (
          <StatCard
            title="Assigned Tasks"
            value="3 Tasks"
            subtitle="Pending today"
            icon={ClipboardList}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
            href="/tasks"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-attendance') && (
          <StatCard
            title="My Attendance"
            value="100%"
            subtitle="Current month log"
            icon={CheckCircle2}
            color="text-sky-500"
            bgColor="bg-sky-500/10"
            href="/lms/attendance"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-leave') && (
          <StatCard
            title="Leave Balance"
            value="14 Days"
            subtitle="Annual allocation"
            icon={Calendar}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
            href="/leave"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-salary') && (
          <StatCard
            title="Payroll Cycle"
            value="28th Monthly"
            subtitle="Direct bank deposit"
            icon={Wallet}
            color="text-violet-500"
            bgColor="bg-violet-500/10"
            href="/finance/payroll"
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Layer 2 & 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isVisible('chart-tasks') && (
          <ChartCard
            title="Weekly Task Completion Rate"
            subtitle="Completed vs Pending duties over past month"
            data={taskChartData}
            type="bar"
            dataKeys={[
              { key: 'completed', label: 'Completed Tasks', color: '#10b981' },
              { key: 'pending', label: 'Pending Tasks', color: '#f59e0b' }
            ]}
            isLoading={isLoading}
            className="lg:col-span-2"
          />
        )}

        {isVisible('action-announcements') && (
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span>Staff Notices</span>
            </h2>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px]">
              {(data?.announcements && data.announcements.length > 0) ? (
                data.announcements.map((ann: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <p className="text-xs font-bold text-foreground">{ann.title || 'Notice'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ann.content || ann.message || ''}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No staff notices right now.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
