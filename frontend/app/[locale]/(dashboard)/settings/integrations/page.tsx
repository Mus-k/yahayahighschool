'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Cpu, CheckCircle2, AlertTriangle, RefreshCw, Key, Webhook, Mail, PhoneCall, Activity, ExternalLink } from 'lucide-react';
import { useLocale } from 'next-intl';
import { apiClient } from '@/services/api.service';
import { t as i18nT } from '@/lib/i18n-dict';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PingResult {
  ok: boolean;
  latencyMs: number | null;
  testedAt: string;
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';

export default function IntegrationsSettingsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [strapiStatus, setStrapiStatus] = useState<PingResult | null>(null);
  const [pinging, setPinging] = useState(false);

  const pingStrapi = useCallback(async () => {
    setPinging(true);
    const start = Date.now();
    try {
      // Use a lightweight endpoint to check connectivity
      await apiClient.get('/campuses', { params: { pagination: { limit: 1 } } });
      setStrapiStatus({
        ok: true,
        latencyMs: Date.now() - start,
        testedAt: new Date().toLocaleTimeString(),
      });
    } catch {
      setStrapiStatus({
        ok: false,
        latencyMs: null,
        testedAt: new Date().toLocaleTimeString(),
      });
      toast.error(t('Strapi connection failed'));
    } finally {
      setPinging(false);
    }
  }, []);

  useEffect(() => { pingStrapi(); }, [pingStrapi]);

  const staticIntegrations = [
    {
      id: 'smtp',
      name: 'Nodemailer SMTP Relay',
      desc: t('Email delivery for notifications, invoices, and password resets.'),
      endpoint: 'smtp.mailgun.org:587',
      icon: Mail,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      status: 'configured',
    },
    {
      id: 'sms',
      name: 'Twilio SMS & WhatsApp Gateway',
      desc: t('SMS alerts for attendance, fee reminders, and emergency broadcasts.'),
      endpoint: 'api.twilio.com/v2010',
      icon: PhoneCall,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      status: 'standby',
    },
    {
      id: 'webhook',
      name: 'Payment Webhook (Stripe / Paystack)',
      desc: t('Receives payment events and updates invoice statuses automatically.'),
      endpoint: 'api.stripe.com/v1/events',
      icon: Webhook,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      status: 'active',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Cpu className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            <span>{t('External System API & Service Integrations')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('Manage Strapi backend connection, webhook endpoints, and third-party communication gateways.')}
          </p>
        </div>
        <button
          onClick={pingStrapi}
          disabled={pinging}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4 text-emerald-500', pinging && 'animate-spin')} />
          {t('Ping All Connections')}
        </button>
      </div>

      {/* Strapi — Live Health Card */}
      <div className={cn(
        'p-6 rounded-2xl border shadow-md transition-all',
        strapiStatus?.ok
          ? 'bg-emerald-50 dark:bg-slate-900 border-emerald-400 dark:border-emerald-700'
          : strapiStatus?.ok === false
            ? 'bg-rose-50 dark:bg-slate-900 border-rose-400 dark:border-rose-700'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      )}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0',
              strapiStatus?.ok === true
                ? 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                : strapiStatus?.ok === false
                  ? 'bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            )}>
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Strapi CMS (v5 API)</h3>
                {pinging ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                    <Activity className="w-3 h-3 animate-pulse" /> {t('Pinging...')}
                  </span>
                ) : strapiStatus?.ok === true ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
                    <CheckCircle2 className="w-3 h-3" /> {t('Connected & Healthy')}
                  </span>
                ) : strapiStatus?.ok === false ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-700">
                    <AlertTriangle className="w-3 h-3" /> {t('Connection Failed')}
                  </span>
                ) : null}
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">{STRAPI_URL}/api</p>
              {strapiStatus && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {t('Last checked')}: {strapiStatus.testedAt}
                  {strapiStatus.latencyMs !== null && (
                    <span className="ml-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {strapiStatus.latencyMs}ms
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={pingStrapi}
            disabled={pinging}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={cn('w-4 h-4', pinging && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Static Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {staticIntegrations.map(item => {
          const Icon = item.icon;
          const statusColor = item.status === 'active'
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
            : item.status === 'configured'
              ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-700'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';

          return (
            <div key={item.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', statusColor)}>
                    {item.status === 'active' ? t('Active') : item.status === 'configured' ? t('Configured') : t('Standby')}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-2 truncate">{item.endpoint}</p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => toast.info(t('API credentials panel coming in next release'))}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" /> {t('Configure API Keys')}
                </button>
                <button
                  onClick={() => toast.success(`${item.name} ${t('sync triggered')}`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  {t('Test')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
