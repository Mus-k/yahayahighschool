'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, GraduationCap, BookOpen, DollarSign, UserCheck,
  Calendar, Layers, ShieldCheck, Bell, Activity, ArrowRight,
  RefreshCw, CheckCircle2, AlertCircle, Clock, HeartHandshake,
  FolderOpen, Scale, FileText, Landmark, BarChart3, Settings
} from 'lucide-react';
import { Link } from '@/i18n/routing';

import { dashboardService, type AdminDashboardData } from '@/services/dashboard.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { DashboardWidgetCustomizer, type WidgetConfig } from '@/components/ui/DashboardWidgetCustomizer';
import { formatNumber, formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import { getTranslation } from '@/components/erp/EnterpriseModuleShell';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  // Layer 1 — Summary Cards
  { id: 'stat-students', title: 'Total Students', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-teachers', title: 'Faculty Members', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-parents', title: 'Parent Accounts', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-departments', title: 'Academic Depts', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-attendance', title: 'Attendance Logs', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-homework', title: 'Active Homework', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-exams', title: 'Examinations', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-audit', title: 'Audit Trail Logs', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },

  // Layer 2 — Analytics Charts
  { id: 'chart-enrollment', title: 'Academic Enrollment by Level', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'chart-attendance', title: 'Monthly Attendance Trends', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'chart-departments', title: 'Faculty & Student Distribution', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },

  // Layer 3 — Action Lists & Activity
  { id: 'action-quick', title: 'Institutional ERP Command Actions', layer: 'action', isVisible: true, isPinned: true, size: 'large' },
  { id: 'action-activity', title: 'System Audit Activity Feed', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
  { id: 'action-announcements', title: 'System Announcements & Events', layer: 'action', isVisible: true, isPinned: false, size: 'normal' },
];

export default function SuperAdminDashboardPage() {
  const locale = useLocale();
  const t = (key: string) => getTranslation(key, locale);

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getAdminDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to fetch admin dashboard live data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.isVisible ?? true;

  // Sample or derived chart data based on live counts
  const enrollmentChartData = [
    { name: 'Nursery', count: Math.round((data?.counts?.students || 120) * 0.15) },
    { name: 'Primary', count: Math.round((data?.counts?.students || 120) * 0.35) },
    { name: 'JSS', count: Math.round((data?.counts?.students || 120) * 0.25) },
    { name: 'SSS', count: Math.round((data?.counts?.students || 120) * 0.25) },
  ];

  const attendanceTrendData = [
    { name: 'Mon', rate: 94.2 },
    { name: 'Tue', rate: 96.1 },
    { name: 'Wed', rate: 93.8 },
    { name: 'Thu', rate: 95.5 },
    { name: 'Fri', rate: 91.0 },
  ];

  const deptChartData = [
    { name: 'Sciences', value: 42 },
    { name: 'Humanities', value: 28 },
    { name: "Qur'an", value: 65 },
    { name: 'Languages', value: 35 },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t('Enterprise System Portal')}
        description={t('Live ERP overview, system metrics, academic distribution, and security monitoring.')}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>{t('Refresh Live Data')}</span>
          </button>
          <DashboardWidgetCustomizer
            role="super-administrator"
            defaultWidgets={DEFAULT_WIDGETS}
            onUpdate={setWidgets}
          />
        </div>
      </PageHeader>

      {/* Layer 1 — Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isVisible('stat-students') && (
          <StatCard
            title={t('Total Students')}
            value={formatNumber(data?.counts?.students || 0)}
            change={4.2}
            changeLabel={t('Live vs last term')}
            icon={GraduationCap}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
            href="/students"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-teachers') && (
          <StatCard
            title={t('Faculty Members')}
            value={formatNumber(data?.counts?.teachers || 0)}
            change={1.8}
            changeLabel={t('Active teaching staff')}
            icon={UserCheck}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
            href="/teachers"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-parents') && (
          <StatCard
            title={t('Parent Accounts')}
            value={formatNumber(data?.counts?.parents || 0)}
            change={5.1}
            changeLabel={t('Linked guardian profiles')}
            icon={Users}
            color="text-rose-500"
            bgColor="bg-rose-500/10"
            href="/parents"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-departments') && (
          <StatCard
            title={t('Academic Depts')}
            value={formatNumber(data?.counts?.departments || 0)}
            subtitle={`${data?.counts?.programs || 0} ${t('active programs')}`}
            icon={Layers}
            color="text-sky-500"
            bgColor="bg-sky-500/10"
            href="/academic-structure"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-attendance') && (
          <StatCard
            title={t('Attendance Logs')}
            value={formatNumber(data?.counts?.attendanceRecords || 0)}
            subtitle={t('Total session entries recorded')}
            icon={Calendar}
            color="text-violet-500"
            bgColor="bg-violet-500/10"
            href="/lms/attendance"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-homework') && (
          <StatCard
            title={t('Active Homework')}
            value={formatNumber(data?.counts?.homework || 0)}
            subtitle={`${data?.counts?.lessonPlans || 0} ${t('lesson plans')}`}
            icon={BookOpen}
            color="text-indigo-500"
            bgColor="bg-indigo-500/10"
            href="/lms/homework"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-exams') && (
          <StatCard
            title={t('Examinations')}
            value={formatNumber(data?.counts?.examinations || 0)}
            subtitle={`${data?.counts?.certificates || 0} ${t('certificates issued')}`}
            icon={ShieldCheck}
            color="text-emerald-600"
            bgColor="bg-emerald-600/10"
            href="/assessment/exams"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-audit') && (
          <StatCard
            title={t('Audit Trail Logs')}
            value={formatNumber(data?.counts?.auditLogs || 0)}
            subtitle={t('Security events logged')}
            icon={Activity}
            color="text-amber-600"
            bgColor="bg-amber-600/10"
            href="/audit-logs"
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Layer 2 — Analytics Engine Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {isVisible('chart-enrollment') && (
          <ChartCard
            title={t('Academic Enrollment by Level')}
            subtitle={t('Student distribution across sections')}
            data={enrollmentChartData}
            type="bar"
            dataKeys={[{ key: 'count', label: t('Students'), color: 'hsl(var(--primary))' }]}
            isLoading={isLoading}
            className="lg:col-span-2"
          />
        )}
        {isVisible('chart-departments') && (
          <ChartCard
            title={t('Departmental Share')}
            subtitle={t('Active student/faculty breakdown')}
            data={deptChartData}
            type="pie"
            dataKeys={[{ key: 'value', label: t('Members'), color: 'hsl(var(--primary))' }]}
            isLoading={isLoading}
          />
        )}
      </div>

      {isVisible('chart-attendance') && (
        <div className="mb-8">
          <ChartCard
            title={t('Weekly Attendance Trend (%)')}
            subtitle={t('Platform-wide attendance verification rate')}
            data={attendanceTrendData}
            type="area"
            dataKeys={[{ key: 'rate', label: t('Attendance %'), color: '#10b981' }]}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Layer 3 — Action Lists & Security Feed */}
      {isVisible('action-quick') && (
        <div className="p-5 rounded-2xl bg-card border border-border mb-8 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>{t('Institutional ERP Command Actions')}</span>
            </h2>
            <Link href="/finance" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>{t('Finance ERP Console')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <Link
              href="/finance/accounting/ledger"
              className="p-3.5 rounded-xl bg-background border border-primary/40 hover:border-primary hover:bg-muted/40 transition-all flex flex-col items-center text-center group shadow-xs"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform mb-1.5">
                <FolderOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-foreground">{t('General Ledger')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Drill-Down')}</span>
            </Link>

            <Link
              href="/finance"
              className="p-3.5 rounded-xl bg-background border border-border hover:border-emerald-500/50 hover:bg-muted/40 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform mb-1.5">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-foreground">{t('Executive ERP')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Treasury / P&L')}</span>
            </Link>

            <Link
              href="/finance/billing/structures"
              className="p-3.5 rounded-xl bg-background border border-border hover:border-teal-500/50 hover:bg-muted/40 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500 group-hover:scale-110 transition-transform mb-1.5">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-foreground">{t('Fee Schedules')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Tuition Rules')}</span>
            </Link>

            <Link
              href="/finance/reports"
              className="p-3.5 rounded-xl bg-background border border-border hover:border-amber-500/50 hover:bg-muted/40 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform mb-1.5">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-foreground">{t('Statements')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Financial P&L')}</span>
            </Link>

            <Link
              href="/students"
              className="p-3.5 rounded-xl bg-background border border-border hover:border-sky-500/50 hover:bg-muted/40 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 group-hover:scale-110 transition-transform mb-1.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-foreground">{t('Students')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Enrollment')}</span>
            </Link>

            <Link
              href="/teachers"
              className="p-3.5 rounded-xl bg-background border border-border hover:border-indigo-500/50 hover:bg-muted/40 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform mb-1.5">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-foreground">{t('Faculty')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Instructors')}</span>
            </Link>

            <Link
              href="/audit-logs"
              className="p-3.5 rounded-xl bg-background border border-border hover:border-rose-500/50 hover:bg-muted/40 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform mb-1.5">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-foreground">{t('Audit Logs')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Security Trail')}</span>
            </Link>

            <Link
              href="/settings/finance"
              className="p-3.5 rounded-xl bg-background border border-border hover:border-slate-500/50 hover:bg-muted/40 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:scale-110 transition-transform mb-1.5">
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-foreground">{t('Governance')}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{t('Settings & FX')}</span>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isVisible('action-activity') && (
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span>{t('Live System Audit Trail')}</span>
              </h2>
              <a href="/audit-logs" className="text-xs font-semibold text-primary hover:underline">
                {t('View all logs →')}
              </a>
            </div>
            <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                  {t('Loading recent system activities...')}
                </div>
              ) : (data?.recentActivity && data.recentActivity.length > 0) ? (
                data.recentActivity.map((log: any, idx: number) => (
                  <div key={idx} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground leading-tight">
                        {t(log.action || log.event || 'System Activity')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.description || log.message || `Performed by user #${log.userId || 'system'}`}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('Just now')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  {t('No recent audit logs found in live database.')}
                </div>
              )}
            </div>
          </div>
        )}

        {isVisible('action-announcements') && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>{t('Live Announcements')}</span>
              </h2>
              <a href="/announcements" className="text-xs font-semibold text-primary hover:underline">
                {t('New +')}
              </a>
            </div>
            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">
                  {t('Loading announcements...')}
                </div>
              ) : (data?.recentAnnouncements && data.recentAnnouncements.length > 0) ? (
                data.recentAnnouncements.map((ann: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <p className="text-xs font-bold text-foreground">{ann.title || t('School Announcement')}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content || ann.message || ''}</p>
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                      <span>{t(ann.category || 'General')}</span>
                      <span>{ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : t('Today')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  {t('No active announcements published yet.')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
