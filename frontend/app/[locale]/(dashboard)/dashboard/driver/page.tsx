'use client';

import { useEffect, useState } from 'react';
import {
  MapPin, Car, Fuel, Wrench, RefreshCw, CheckCircle2,
  AlertTriangle, Bell, ArrowRight, GraduationCap
} from 'lucide-react';

import { dashboardService } from '@/services/dashboard.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { DashboardWidgetCustomizer, type WidgetConfig } from '@/components/ui/DashboardWidgetCustomizer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stat-routes', title: 'Assigned Routes', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-vehicle', title: 'Assigned Vehicle', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-fuel', title: 'Fuel Efficiency', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-maintenance', title: 'Maintenance Status', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'chart-trips', title: 'Daily Route Trips & Student Passengers Logged', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'action-announcements', title: 'Transport Alerts & Emergency Notices', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
];

export default function DriverDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getDriverDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to load driver live dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.isVisible ?? true;

  const tripChartData = [
    { day: 'Mon', trips: 4, passengers: 68 },
    { day: 'Tue', trips: 4, passengers: 70 },
    { day: 'Wed', trips: 4, passengers: 65 },
    { day: 'Thu', trips: 4, passengers: 72 },
    { day: 'Fri', trips: 4, passengers: 66 },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Transport Driver Portal"
        description="Monitor assigned transport routes, check passenger logs, log vehicle fuel, and report maintenance needs."
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
            role="driver"
            defaultWidgets={DEFAULT_WIDGETS}
            onUpdate={setWidgets}
          />
        </div>
      </PageHeader>

      {/* Layer 1 — Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isVisible('stat-routes') && (
          <StatCard
            title="Assigned Routes"
            value="Route #3 (North)"
            subtitle="Morning & Afternoon pick-up"
            icon={MapPin}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
            href="/transport/routes"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-vehicle') && (
          <StatCard
            title="Assigned Vehicle"
            value="Bus KANO-104"
            subtitle="32 Seater Toyota Coaster"
            icon={Car}
            color="text-sky-500"
            bgColor="bg-sky-500/10"
            href="/transport/vehicle"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-fuel') && (
          <StatCard
            title="Fuel Log"
            value="82% Tank"
            subtitle="Last refueled yesterday"
            icon={Fuel}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
            href="/transport/fuel"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-maintenance') && (
          <StatCard
            title="Maintenance Status"
            value="Optimal"
            subtitle="Next check in 1,200 km"
            icon={Wrench}
            color="text-violet-500"
            bgColor="bg-violet-500/10"
            href="/transport/maintenance"
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Layer 2 & 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isVisible('chart-trips') && (
          <ChartCard
            title="Daily Route Trips & Passenger Volume"
            subtitle="Student transport attendance log"
            data={tripChartData}
            type="bar"
            dataKeys={[
              { key: 'passengers', label: 'Student Passengers', color: 'hsl(var(--primary))' },
              { key: 'trips', label: 'Total Trips Logged', color: '#10b981' }
            ]}
            isLoading={isLoading}
            className="lg:col-span-2"
          />
        )}

        {isVisible('action-announcements') && (
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Transport Notices</span>
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
                  No transport alerts or road notices right now.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
