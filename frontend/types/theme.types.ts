import type { DirectionEnum, LanguageEnum, ThemeModeEnum } from './enums';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Theme & UI Types
// ─────────────────────────────────────────────────────────────────────────────

/** Theme context state */
export interface ThemeState {
  mode: ThemeModeEnum;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeModeEnum) => void;
  toggle: () => void;
}

/** Language/i18n context state */
export interface I18nState {
  locale: LanguageEnum;
  direction: DirectionEnum;
  isRTL: boolean;
  setLocale: (locale: LanguageEnum) => void;
  availableLocales: LanguageEnum[];
}

/** Navigation item definition */
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string; // Lucide icon name
  badge?: number | string;
  children?: NavItem[];
  requiredRoles?: string[];
  isExternal?: boolean;
}

/** Navigation group */
export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

/** Breadcrumb segment */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Dashboard statistics card data */
export interface StatCardData {
  id: string;
  title: string;
  value: number | string;
  previousValue?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendPercentage?: number;
  icon: string;
  color: 'green' | 'gold' | 'blue' | 'purple' | 'orange' | 'red';
  suffix?: string;
  prefix?: string;
}

/** Chart data point */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/** Area/Line chart data series */
export interface ChartSeries {
  name: string;
  data: { x: string; y: number }[];
  color?: string;
}
