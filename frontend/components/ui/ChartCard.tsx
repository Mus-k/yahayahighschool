'use client';

import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type ChartType = 'bar' | 'line' | 'area' | 'pie';

interface ChartDataKey { key: string; label: string; color: string; }

interface ChartCardProps {
  title: string;
  subtitle?: string;
  data: any[];
  type?: ChartType;
  dataKeys: ChartDataKey[];
  xKey?: string;
  height?: number;
  isLoading?: boolean;
  className?: string;
  delay?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl px-4 py-3">
      {label && <p className="text-xs font-semibold text-foreground mb-2">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export function ChartCard({
  title, subtitle, data, type = 'bar', dataKeys, xKey = 'name',
  height = 240, isLoading = false, className, delay = 0,
}: ChartCardProps) {
  const tD = useTranslations('dashboard');
  const tN = useTranslations('navigation');
  const tC = useTranslations('common');

  const getTranslatedText = (text: string | undefined): string => {
    if (!text) return '';
    const norm = text.toLowerCase().trim();

    // Mapping dictionary for common chart titles
    const keyMap: Record<string, { ns: 'dashboard' | 'navigation' | 'common'; key: string }> = {
      'academic enrollment by level': { ns: 'dashboard', key: 'totalStudents' },
      'monthly attendance trends': { ns: 'dashboard', key: 'attendanceToday' },
      'faculty & student distribution': { ns: 'dashboard', key: 'activeUsers' },
      'announcements': { ns: 'dashboard', key: 'announcements' },
      'recent activity': { ns: 'dashboard', key: 'recentActivity' },
      'upcoming events': { ns: 'dashboard', key: 'upcomingEvents' },
    };

    const mapping = keyMap[norm];
    if (mapping) {
      if (mapping.ns === 'dashboard' && tD.has(mapping.key)) return tD(mapping.key);
      if (mapping.ns === 'navigation' && tN.has(mapping.key)) return tN(mapping.key);
      if (mapping.ns === 'common' && tC.has(mapping.key)) return tC(mapping.key);
    }

    // Secondary translation map for chart subtitles
    const isAr = tC('confirm') === 'تأكيد';
    if (isAr) {
      const arMap: Record<string, string> = {
        'academic enrollment by level': 'توزيع تسجيل الطلاب حسب المستوى الأكاديمي',
        'monthly attendance trends': 'اتجاهات نسبة حضور الطلاب الشهرية',
        'faculty & student distribution': 'توزيع نسب أعضاء هيئة التدريس والطلاب',
        'live statistics': 'الإحصائيات المباشرة',
        'live telemetry feed': 'مراقبة النشاط المباشر للنظام',
        'live calendar feed': 'الأحداث والفعاليات المدرسية القادمة',
        'active school announcements': 'لوحة الإعلانات المدرسية النشطة',
      };
      if (arMap[norm]) return arMap[norm];
    }

    return text;
  };
  const axisStyle = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };
  const gridStyle = { strokeDasharray: '3 3', stroke: 'hsl(var(--border))' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn('bg-card border border-border rounded-2xl p-5 overflow-hidden', className)}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{getTranslatedText(title)}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{getTranslatedText(subtitle)}</p>}
      </div>
      {isLoading ? (
        <div className="animate-pulse rounded-xl bg-muted" style={{ height }} />
      ) : (
        <div style={{ width: '100%', height: height, minHeight: height, position: 'relative' }}>
          <ResponsiveContainer width="99%" height="100%">
            {type === 'pie' ? (
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey={dataKeys[0]?.key ?? 'value'}>
                  {data.map((_, i) => <Cell key={i} fill={dataKeys[i]?.color ?? `hsl(${i * 45}, 70%, 60%)`} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            ) : type === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey={xKey} tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip content={<CustomTooltip />} />
                {dataKeys.map(dk => <Line key={dk.key} type="monotone" dataKey={dk.key} name={dk.label} stroke={dk.color} strokeWidth={2} dot={false} />)}
              </LineChart>
            ) : type === 'area' ? (
              <AreaChart data={data}>
                <defs>
                  {dataKeys.map(dk => (
                    <linearGradient key={dk.key} id={`grad-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={dk.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey={xKey} tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip content={<CustomTooltip />} />
                {dataKeys.map(dk => <Area key={dk.key} type="monotone" dataKey={dk.key} name={dk.label} stroke={dk.color} fill={`url(#grad-${dk.key})`} strokeWidth={2} />)}
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey={xKey} tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip content={<CustomTooltip />} />
                {dataKeys.map(dk => <Bar key={dk.key} dataKey={dk.key} name={dk.label} fill={dk.color} radius={[4, 4, 0, 0]} />)}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
