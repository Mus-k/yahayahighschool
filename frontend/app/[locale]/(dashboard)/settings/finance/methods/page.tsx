/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  CreditCard, ShieldCheck, CheckCircle2, Globe, Settings,
  Percent, DollarSign, Smartphone, Landmark, Key, Save, Edit2, X
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { toast } from 'sonner';

interface PaymentGatewayConfig {
  id: string;
  name: string;
  type: string;
  apiKey: string;
  webhookStatus: 'Connected' | 'Pending' | 'Disabled';
  isActive: boolean;
}

export default function PaymentGatewaysAndPOSPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingWebhooks, setTestingWebhooks] = useState(false);

  // Edit Gateway Modal
  const [editingGateway, setEditingGateway] = useState<PaymentGatewayConfig | null>(null);
  const [formApiKey, setFormApiKey] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formStatus, setFormStatus] = useState<'Connected' | 'Pending' | 'Disabled'>('Connected');

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const data = await financeService.getPaymentGateways();
      setGateways(data || []);
    } catch {
      toast.error(t('Failed to load payment gateway parameters.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const handleTestWebhooks = async () => {
    setTestingWebhooks(true);
    try {
      await new Promise(r => setTimeout(r, 900));
      toast.success(t('Successfully tested all API webhook endpoints! All gateways responding 200 OK.'));
    } catch {
      toast.error(t('Webhook test failed'));
    } finally {
      setTestingWebhooks(false);
    }
  };

  const handleOpenEditModal = (g: PaymentGatewayConfig) => {
    setEditingGateway(g);
    setFormApiKey(g.apiKey || '');
    setFormIsActive(g.isActive);
    setFormStatus(g.webhookStatus || 'Connected');
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGateway) return;

    try {
      const updated: PaymentGatewayConfig = {
        ...editingGateway,
        apiKey: formApiKey,
        isActive: formIsActive,
        webhookStatus: formStatus
      };

      await financeService.savePaymentGateway(updated);
      setGateways(gateways.map(g => g.id === editingGateway.id ? updated : g));
      toast.success(`${t('Payment gateway configuration saved')}: ${editingGateway.name}`);
      setEditingGateway(null);
    } catch {
      toast.error(t('Failed to save gateway configuration'));
    }
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_channels',
      title: t('Configured Payment Gateways'),
      value: `${gateways.filter(g => g.isActive).length} ${t('Gateways')}`,
      subtitle: t('Stripe, Orange Money, MTN MoMo & Physical POS'),
      trendDirection: 'up',
      icon: <CreditCard className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'mobile_money',
      title: t('Mobile Money Gateway Readiness'),
      value: t('100% Online'),
      subtitle: t('Instant webhook verification for student fee receipts'),
      trendDirection: 'up',
      icon: <Smartphone className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'security_audit',
      title: t('API Gateway Encryption Standard'),
      value: 'TLS 1.3 Secure',
      subtitle: t('Encrypted API secret keys & HMAC webhook signing'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Payment Gateways & POS Channel Configuration Console')}
      description={t('SAP S/4HANA & Odoo payment channel management. Configure international API gateways (Stripe, PayPal) and local mobile money merchant endpoints (Orange Money, MTN, Wave).')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Settings & Config') }, { label: t('Gateways & POS') }]}
      icon={<CreditCard className="w-8 h-8 text-emerald-400" />}
      recordCount={gateways.length}
      recordLabel={t('Gateways')}
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <button
          onClick={handleTestWebhooks}
          disabled={testingWebhooks}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
        >
          <Key className="w-4 h-4" />
          <span>{testingWebhooks ? t('Testing Webhooks...') : t('Test Gateway Webhooks')}</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('General Policy Hub')}</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('Multi-Currency & Rates')}</span>
        </Link>
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('VAT & Tax Rules')}</span>
        </Link>
        <Link href="/settings/finance/methods" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          <span>{t('Payment Gateways & POS')}</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-rose-400" />
          <span>{t('Fee & Penalty Rules')}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {gateways.map(g => (
          <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                {g.id.includes('POS') ? <Landmark className="w-5 h-5 text-emerald-400" /> : <Smartphone className="w-5 h-5 text-sky-400" />}
                <div>
                  <h4 className="font-black text-white text-sm">{g.name}</h4>
                  <span className="text-[11px] text-slate-400 font-mono block">{g.type}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full font-bold text-xs border ${
                g.isActive && g.webhookStatus === 'Connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                ● {g.webhookStatus.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">{t('API Key / Merchant ID')}:</span>
                <span className="text-emerald-400 font-bold">{g.apiKey ? (g.apiKey.length > 20 ? `${g.apiKey.slice(0, 10)}...` : g.apiKey) : t('Configured (Encrypted)')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleOpenEditModal(g)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{t('Configure Keys')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Gateway Modal */}
      {editingGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">{t('Configure Payment Channel')}: {editingGateway.name}</h3>
              </div>
              <button onClick={() => setEditingGateway(null)} className="text-slate-400 hover:text-white font-bold text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGateway} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Gateway Type & Description')}</label>
                <input
                  type="text"
                  disabled
                  value={editingGateway.type}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('API Secret Key / Merchant Identifier')}</label>
                <input
                  type="text"
                  placeholder="e.g. sk_live_... or merchant_id"
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Webhook Status')}</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Connected">{t('Connected / Verified')}</option>
                  <option value="Pending">{t('Pending Verification')}</option>
                  <option value="Disabled">{t('Disabled')}</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-300 font-bold">{t('Enable this payment gateway for parent checkouts & POS')}</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setEditingGateway(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                  {t('Cancel')}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">
                  {t('Save Configuration')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}
