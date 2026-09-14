'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import { useTranslations } from 'next-intl';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color?: string;
  bgColor?: string;
  href?: string;
  isLoading?: boolean;
  delay?: number;
}

export function StatCard({
  id, title, value, subtitle, change, changeLabel,
  icon: Icon, color = 'text-primary', bgColor = 'bg-primary/10',
  href, isLoading = false, delay = 0,
}: StatCardProps) {
  const tD = useTranslations('dashboard');
  const tN = useTranslations('navigation');
  const tC = useTranslations('common');

  const getTranslatedText = (text: string | undefined): string => {
    if (!text) return '';
    const norm = text.toLowerCase().trim();

    // Mapping dictionary for dynamic translation lookups
    const keyMap: Record<string, { ns: 'dashboard' | 'navigation' | 'common'; key: string }> = {
      'total students': { ns: 'dashboard', key: 'totalStudents' },
      'faculty members': { ns: 'dashboard', key: 'totalTeachers' },
      'parent accounts': { ns: 'dashboard', key: 'totalParents' },
      'attendance logs': { ns: 'navigation', key: 'attendance' },
      'active homework': { ns: 'navigation', key: 'homework' },
      'examinations': { ns: 'navigation', key: 'exams' },
      'audit trail logs': { ns: 'navigation', key: 'auditLogs' },
      'dashboard': { ns: 'navigation', key: 'dashboard' },
      'users': { ns: 'navigation', key: 'users' },
      'students': { ns: 'navigation', key: 'students' },
      'teachers': { ns: 'navigation', key: 'teachers' },
      'parents': { ns: 'navigation', key: 'parents' },
      'staff': { ns: 'navigation', key: 'workers' },
      'finance': { ns: 'navigation', key: 'finance' },
      'hostel': { ns: 'navigation', key: 'hostel' },
      'exams': { ns: 'navigation', key: 'exams' },
      'attendance': { ns: 'navigation', key: 'attendance' },
      'timetable': { ns: 'navigation', key: 'timetable' },
      'events': { ns: 'navigation', key: 'events' },
      'messages': { ns: 'navigation', key: 'messages' },
      'notifications': { ns: 'navigation', key: 'notifications' },
      'audit logs': { ns: 'navigation', key: 'auditLogs' },
      'settings': { ns: 'navigation', key: 'settings' },
      'school profile': { ns: 'navigation', key: 'schoolProfile' },
      'roles & permissions': { ns: 'navigation', key: 'roles' },
      'reports': { ns: 'navigation', key: 'reports' },
    };

    const mapping = keyMap[norm];
    if (mapping) {
      if (mapping.ns === 'dashboard' && tD.has(mapping.key)) return tD(mapping.key);
      if (mapping.ns === 'navigation' && tN.has(mapping.key)) return tN(mapping.key);
      if (mapping.ns === 'common' && tC.has(mapping.key)) return tC(mapping.key);
    }

    // Secondary translation map for change labels and subtitles
    const phraseMap: Record<string, string> = {
      'live vs last term': 'الطلاب الحاليين مقابل الفصل الماضي',
      'active teaching staff': 'أعضاء هيئة التدريس النشطين',
      'registered guardians': 'الأوصياء المسجلين',
      'active classes': 'الفصول الدراسية النشطة',
      'marked today': 'تم رصد الحضور اليوم',
      'submissions pending': 'الواجبات المعلقة',
      'active exam cycles': 'الامتحانات الجارية',
      'security audit feed': 'سجل مراقبة الأمان',
    };

    const locale = tC('loading') === 'Loading...' ? 'en' : 'other';
    if (locale !== 'en' && phraseMap[norm]) {
      // Localized subtext values fallback (will fall back gracefully)
      const arMap: Record<string, string> = {
        'live vs last term': 'مقارنة بالفصل السابق',
        'active teaching staff': 'الكادر التعليمي النشط',
        'registered guardians': 'أولياء الأمور المسجلين',
        'active classes': 'الشعب الدراسية النشطة',
        'marked today': 'تم تسجيل الحضور اليوم',
        'submissions pending': 'واجبات في انتظار التقديم',
        'active exam cycles': 'دورات الامتحانات النشطة',
        'security audit feed': 'نشاط تدقيق النظام المباشر',
      };
      if (tC('confirm') === 'تأكيد' && arMap[norm]) return arMap[norm];
    }

    return text;
  };
  const trend = change === undefined ? null : change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={cn(
        'relative bg-card border border-border rounded-2xl p-5 overflow-hidden group',
        href && 'cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200'
      )}
    >
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-muted" />
            <div className="w-12 h-4 rounded bg-muted" />
          </div>
          <div className="w-20 h-7 rounded bg-muted" />
          <div className="w-32 h-4 rounded bg-muted" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bgColor)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            {trend !== null && (
              <div className="flex items-center gap-1">
                {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                {trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className={cn(
                  'text-xs font-medium',
                  trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
                  trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  {Math.abs(change!)}%
                </span>
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-foreground tracking-tight mb-0.5">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-sm font-medium text-foreground/70">{getTranslatedText(title)}</p>
          {(subtitle || changeLabel) && (
            <p className="text-[10px] text-muted-foreground mt-1">{getTranslatedText(subtitle ?? changeLabel)}</p>
          )}
          {href && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
          )}
        </>
      )}
    </motion.div>
  );

  return href ? <Link href={href} id={id}>{cardContent}</Link> : <div id={id}>{cardContent}</div>;
}
