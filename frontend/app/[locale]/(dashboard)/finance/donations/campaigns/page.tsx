/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Heart, Award, ShieldCheck, DollarSign, ArrowRight,
  Clock, CheckCircle2, Plus, Users, PieChart
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { apiClient } from '@/services/api.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface CampaignSummary {
  id: string;
  name: string;
  targetAmount: number;
  raisedAmount: number;
  donorsCount: number;
  status: 'active' | 'completed' | 'on_hold';
}

export default function DonationCampaignsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/donation-campaigns?populate=*');
        const raw = res.data?.data || [];
        if (raw.length > 0) {
          const mapped: CampaignSummary[] = raw.map((c: any) => ({
            id: c.documentId || String(c.id),
            name: c.title || 'Institutional Campaign',
            targetAmount: Number(c.targetAmount || 0),
            raisedAmount: Number(c.raisedAmount || 0),
            donorsCount: Number(c.donorsCount || 0),
            status: Number(c.raisedAmount || 0) >= Number(c.targetAmount || 0) && Number(c.targetAmount || 0) > 0 ? 'completed' : 'active'
          }));
          setCampaigns(mapped);
        } else {
          setCampaigns([]);
        }
      } catch {
        toast.error(t('Failed to load campaigns.'));
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [locale]);

  const totalTarget = useMemo(() => campaigns.reduce((s, c) => s + c.targetAmount, 0), [campaigns]);
  const totalRaised = useMemo(() => campaigns.reduce((s, c) => s + c.raisedAmount, 0), [campaigns]);
  const totalDonors = useMemo(() => campaigns.reduce((s, c) => s + c.donorsCount, 0), [campaigns]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_target',
      title: t('Institutional Campaign Target'),
      value: `$${totalTarget.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${campaigns.length} ${t('fundraising drives configured')}`,
      trendDirection: 'up',
      icon: <Heart className="w-5 h-5 text-rose-400" />
    },
    {
      id: 'total_raised',
      title: t('Cumulative Endowment Capital Raised'),
      value: `$${totalRaised.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${totalTarget > 0 ? ((totalRaised / totalTarget) * 100).toFixed(1) : '100'}% ${t('of institutional goals achieved')}`,
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'donors_engaged',
      title: t('Unique Benefactors Engaged'),
      value: `${totalDonors} ${t('Benefactors')}`,
      subtitle: t('Alumni, parents, organizations & Waqf trustees'),
      trendDirection: 'up',
      icon: <Users className="w-5 h-5 text-sky-400" />
    }
  ];

  const columns: ColumnDef<CampaignSummary, any>[] = [
    {
      accessorKey: 'name',
      header: t('Campaign Destination & Fund Title'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-white text-xs sm:text-sm block">{row.original.name}</span>
          <span className="text-[11px] font-mono text-slate-400">ID: {row.original.id} • {row.original.donorsCount} {t('benefactors')}</span>
        </div>
      )
    },
    {
      accessorKey: 'targetAmount',
      header: `${t('Goal Target vs Raised')} ($)`,
      cell: ({ row }) => {
        const c = row.original;
        const pct = c.targetAmount > 0 ? (c.raisedAmount / c.targetAmount) * 100 : 100;
        return (
          <div className="space-y-1.5 w-full max-w-xs">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-emerald-400 font-bold">${c.raisedAmount.toLocaleString()} {t('raised')}</span>
              <span className="text-slate-300 font-black">{t('Goal')}: ${c.targetAmount.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all rounded-full ${
                  pct >= 100 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-sky-600 to-emerald-400'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status === 'active' ? 'active' : 'closed'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <button
          onClick={() => toast.info(`${t('Inspecting endowment ledger for')} ${row.original.name}`)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
        >
          {t('Inspect Ledger →')}
        </button>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Endowment Campaigns & Fundraising Target Control')}
      description={t('Monitor institutional capital drives, track construction fund milestones, and oversee student Waqf sponsorship targets.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Donations & Audit') }, { label: t('Donation Campaigns') }]}
      icon={<Heart className="w-8 h-8 text-rose-400" />}
      recordCount={campaigns.length}
      recordLabel={t('Campaigns')}
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <Link
          href="/finance/donations"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <span>← {t('Back to Donations Console')}</span>
        </Link>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseDataGrid
        data={campaigns}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: t('No Active Campaigns'),
          description: t('No fundraising drives configured.'),
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}
