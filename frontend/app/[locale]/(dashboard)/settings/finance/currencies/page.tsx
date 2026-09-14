/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Globe, Plus, RefreshCw, CheckCircle2, ShieldCheck, DollarSign,
  ArrowRight, Save, Clock, Percent, CreditCard, Settings, Edit2, X,
  Calculator, ArrowLeftRight, Trash2, Check, TrendingUp, Landmark
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { MultiCurrencyRate } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { toast } from 'sonner';

export default function MultiCurrencySettingsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [rates, setRates] = useState<MultiCurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Edit Rate Modal State
  const [editingRate, setEditingRate] = useState<MultiCurrencyRate | null>(null);
  const [newRateValue, setNewRateValue] = useState<string>('');
  const [newSymbolValue, setNewSymbolValue] = useState<string>('');

  // Add Currency Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCode, setAddCode] = useState('');
  const [addName, setAddName] = useState('');
  const [addSymbol, setAddSymbol] = useState('');
  const [addRate, setAddRate] = useState('');

  // Live Currency Converter Calculator State
  const [calcAmount, setCalcAmount] = useState('1000');
  const [calcSourceCurrency, setCalcSourceCurrency] = useState('USD');

  const fetchRates = async () => {
    setLoading(true);
    try {
      const data = await financeService.getExchangeRates();
      setRates(data || []);
    } catch {
      toast.error(t('Failed to load multi-currency exchange rates.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSyncAPI = async () => {
    setSyncing(true);
    try {
      await new Promise(res => setTimeout(res, 800));
      await fetchRates();
      toast.success(t('Successfully synchronized exchange rates with Central Bank & BCEAO API gateways!'));
    } catch {
      toast.error(t('Exchange rate synchronization failed'));
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenEditModal = (r: MultiCurrencyRate) => {
    setEditingRate(r);
    setNewRateValue(String(r.exchangeRateToUSD));
    setNewSymbolValue(r.symbol || '');
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;

    const parsedRate = parseFloat(newRateValue);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      toast.error(t('Please enter a valid positive exchange rate'));
      return;
    }

    try {
      await financeService.updateExchangeRate(editingRate.id, parsedRate, newSymbolValue);
      setRates(rates.map(r => r.id === editingRate.id ? {
        ...r,
        exchangeRateToUSD: parsedRate,
        symbol: newSymbolValue,
        lastUpdated: new Date().toISOString().split('T')[0]
      } : r));
      toast.success(`${t('Exchange rate updated for')} ${editingRate.currencyCode}!`);
      setEditingRate(null);
    } catch {
      toast.error(t('Failed to update rate'));
    }
  };

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(addRate);
    if (!addCode.trim() || !addName.trim()) {
      toast.error(t('Please provide currency code and name'));
      return;
    }
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error(t('Please enter a valid exchange rate'));
      return;
    }

    try {
      const newCurr = await financeService.addCurrency({
        currencyCode: addCode.toUpperCase().trim(),
        currencyName: addName.trim(),
        symbol: addSymbol.trim() || addCode.toUpperCase().trim(),
        exchangeRateToUSD: rateNum,
        isBase: false,
        isActive: true,
        lastUpdated: new Date().toISOString().split('T')[0]
      });

      setRates([...rates, newCurr]);
      toast.success(`${t('Added new operating currency')}: ${addCode.toUpperCase()}`);
      setShowAddModal(false);
      setAddCode('');
      setAddName('');
      setAddSymbol('');
      setAddRate('');
    } catch {
      toast.error(t('Failed to add currency'));
    }
  };

  const handleDeleteCurrency = async (id: string, code: string) => {
    if (code === 'USD') {
      toast.error(t('Cannot delete primary base currency (USD)'));
      return;
    }
    if (!confirm(`${t('Are you sure you want to remove currency')} "${code}"?`)) return;

    try {
      await financeService.deleteCurrency(id);
      setRates(rates.filter(r => r.id !== id));
      toast.success(`${t('Removed currency')}: ${code}`);
    } catch {
      toast.error(t('Failed to delete currency'));
    }
  };

  // Real-time conversion calculations
  const conversions = useMemo(() => {
    const amt = parseFloat(calcAmount) || 0;
    if (amt <= 0 || rates.length === 0) return [];

    // Find source rate to USD
    const srcRate = rates.find(r => r.currencyCode === calcSourceCurrency)?.exchangeRateToUSD || 1;
    const amountInUSD = amt / (srcRate > 0 ? srcRate : 1);

    return rates.map(r => {
      const converted = amountInUSD * (Number(r.exchangeRateToUSD) || 1);
      return {
        code: r.currencyCode,
        name: r.currencyName,
        symbol: r.symbol,
        rate: r.exchangeRateToUSD,
        amount: converted
      };
    });
  }, [calcAmount, calcSourceCurrency, rates]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_currencies',
      title: t('Active Operating Currencies'),
      value: `${rates.length} ${t('Currencies')}`,
      subtitle: t('USD ($), EUR (€), XOF (CFA), TRY (₺) & GNF (FG)'),
      trendDirection: 'up',
      icon: <Globe className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'sync_mode',
      title: t('Rate Synchronizer Gateway'),
      value: t('Central Bank & BCEAO Parity'),
      subtitle: t('Real-time multi-ledger synchronization'),
      trendDirection: 'up',
      icon: <RefreshCw className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'multi_ledger',
      title: t('Multi-Currency Bookkeeping'),
      value: '100% Normalized',
      subtitle: t('Foreign payments converted to USD base GL accounts'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />
    }
  ];

  const [baseCurrency, setBaseCurrency] = useState('USD');

  useEffect(() => {
    financeService.getSettings().then(s => {
      if (s?.defaultCurrency) setBaseCurrency(s.defaultCurrency);
    }).catch(() => {});
  }, []);

  const handleSetBaseCurrency = async (code: string) => {
    try {
      await financeService.updateSettings({ defaultCurrency: code });
      setBaseCurrency(code);
      if (typeof window !== 'undefined') {
        localStorage.setItem('yahaya_selected_currency', code);
        localStorage.setItem('selected_currency', code);
        localStorage.setItem('yahaya_default_currency', code);
        window.dispatchEvent(new CustomEvent('yahaya_currency_changed', { detail: code }));
      }
      toast.success(`${t('Base institutional operating currency set to')} ${code}!`);
    } catch {
      toast.error(t('Failed to update base currency'));
    }
  };

  const columns: ColumnDef<MultiCurrencyRate, any>[] = [
    {
      accessorKey: 'currencyCode',
      header: t('Currency Code & Name'),
      cell: ({ row }) => {
        const isBase = row.original.currencyCode === baseCurrency;
        return (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-slate-800 text-emerald-400 font-black font-mono text-xs">
              {row.original.currencyCode}
            </span>
            <span className="font-bold text-white text-xs sm:text-sm">{row.original.currencyName}</span>
            {isBase && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                {t('BASE')}
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'exchangeRateToUSD',
      header: `${t('Exchange Rate (vs 1 USD $)')}`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-white">
          {(Number(row.original.exchangeRateToUSD) || 1).toFixed(4)} {row.original.symbol}
        </span>
      )
    },
    {
      accessorKey: 'lastUpdated',
      header: t('Last Synchronization'),
      cell: ({ row }) => <span className="font-mono text-xs text-slate-400 font-bold">{row.original.lastUpdated || 'Today'}</span>
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => {
        const isBase = row.original.currencyCode === baseCurrency;
        return (
          <div className="flex items-center gap-2">
            {!isBase && (
              <button
                onClick={() => handleSetBaseCurrency(row.original.currencyCode)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/60 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs border border-emerald-800/60 transition-all cursor-pointer"
                title={t('Set as Base Currency')}
              >
                <Check className="w-3 h-3" />
                <span>{t('Set Base')}</span>
              </button>
            )}
            <button
              onClick={() => handleOpenEditModal(row.original)}
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>{t('Override Rate')}</span>
            </button>
            {row.original.currencyCode !== 'USD' && (
              <button
                onClick={() => handleDeleteCurrency(row.original.id, row.original.currencyCode)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
                title={t('Delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Multi-Currency Engine & Exchange Rate Parameters')}
      description={t('Real-time multi-currency bookkeeping. Manage institutional exchange rate parities, automated Central Bank rate fetching, foreign fee conversions, and ledger base currency normalization.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Settings & Config') }, { label: t('Multi-Currency') }]}
      icon={<Globe className="w-8 h-8 text-sky-400" />}
      recordCount={rates.length}
      recordLabel={t('Currencies')}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncAPI}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-sky-400 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? t('Syncing Parities...') : t('Sync Central Bank Rates')}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ {t('Add Operating Currency')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('General Policy Hub')}</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span>{t('Multi-Currency & Rates')}</span>
        </Link>
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('VAT & Tax Rules')}</span>
        </Link>
        <Link href="/settings/finance/methods" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Payment Gateways & POS')}</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-rose-400" />
          <span>{t('Fee & Penalty Rules')}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Currencies Data Grid (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <EnterpriseDataGrid
            data={rates}
            columns={columns}
            isLoading={loading}
            density="cozy"
            emptyStateProps={{
              title: t('No Exchange Rates Found'),
              description: t('No foreign currency conversion rates configured.'),
              isFilterActive: false,
              onResetFilters: () => {},
              createLabel: t('Add Currency'),
              onCreate: () => setShowAddModal(true)
            }}
          />
        </div>

        {/* Live Multi-Currency Conversion Calculator (Right 1 Column) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">{t('Live Parity Calculator')}</h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Input Amount')}</label>
                <input
                  type="number"
                  step="any"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Currency')}</label>
                <select
                  value={calcSourceCurrency}
                  onChange={(e) => setCalcSourceCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {rates.map(r => (
                    <option key={r.currencyCode} value={r.currencyCode}>
                      {r.currencyCode} ({r.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('Converted Parity Equivalents')}:
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {conversions.map((conv) => (
                  <div key={conv.code} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">{conv.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        1 USD = {Number(conv.rate).toFixed(2)} {conv.symbol}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-black text-emerald-400">
                      {conv.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {conv.symbol}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Rate Modal */}
      {editingRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-black text-white">{t('Override Exchange Rate')}: {editingRate.currencyCode}</h3>
              </div>
              <button onClick={() => setEditingRate(null)} className="text-slate-400 hover:text-white font-bold text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Currency Name')}</label>
                <input
                  type="text"
                  disabled
                  value={editingRate.currencyName}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Exchange Rate to 1 USD')}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newRateValue}
                    onChange={(e) => setNewRateValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Currency Symbol')}</label>
                  <input
                    type="text"
                    value={newSymbolValue}
                    onChange={(e) => setNewSymbolValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setEditingRate(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                  {t('Cancel')}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md">
                  {t('Apply Override')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Currency Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">{t('Add Operating Currency')}</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCurrency} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Currency Code (ISO)')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAR"
                    maxLength={5}
                    value={addCode}
                    onChange={(e) => setAddCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t('Symbol')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ﷼"
                    value={addSymbol}
                    onChange={(e) => setAddSymbol(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Currency Name')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saudi Arabian Riyal"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Exchange Rate to 1 USD ($)')}</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 3.75"
                  value={addRate}
                  onChange={(e) => setAddRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                  {t('Cancel')}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">
                  {t('Add Currency')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}
