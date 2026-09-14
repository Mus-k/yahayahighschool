/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clipboard, Upload, Download, ArrowRight, X, Printer,
  Phone, Mail, Eye, Clock, Truck, Wrench, Edit, Trash2,
  RefreshCw, Users, Shield, Plus, Building, FileText, CheckSquare, Square,
  Search
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import { apiClient } from '@/services/api.service';
import type { Worker } from '@/types/erp.types';
import { BulkImportModal } from '@/components/erp/BulkImportModal';
import { BulkExportModal } from '@/components/erp/BulkExportModal';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { Avatar } from '@/components/shared/Avatar';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';
import { t } from '@/lib/i18n-dict';

export default function WorkersListPage() {
  const locale = useLocale();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);
  
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Inspector Details
  const [inspectDetails, setInspectDetails] = useState<any | null>(null);
  const [colleagues, setColleagues] = useState<any[]>([]);
  const [loadingInspect, setLoadingInspect] = useState(false);

  // Onboarding Form state
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    role: 'Security Officer',
    phone: '',
    email: '',
    employmentStatus: 'active' as any,
    salaryGrade: 'SG-1',
    address: '',
    emergencyContact: ''
  });
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [searchDeptQuery, setSearchDeptQuery] = useState('');

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const res = await erpService.getWorkers({ query, pageSize: 100 });
      setWorkers(res.data || []);
    } catch (err) {
      toast.error('Failed to sync support personnel registry.');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const res = await apiClient.get('/departments?pagination[limit]=100');
      setDepartments(res.data?.data || []);
    } catch (err) {
      console.warn('Failed to load departments list for selection.');
    }
  };

  useEffect(() => {
    loadWorkers();
    loadMetadata();
  }, []);

  const activeFiltersCount = (categoryFilter !== 'all' ? 1 : 0) + (shiftFilter !== 'all' ? 1 : 0);

  const handleClearFilters = () => {
    setCategoryFilter('all');
    setShiftFilter('all');
    setQuery('');
    toast.success('Personnel filters reset.');
  };

  const handleOnboardOpen = () => {
    setEditingWorker(null);
    setOnboardForm({
      name: '',
      role: 'Security Officer',
      phone: '',
      email: '',
      employmentStatus: 'active',
      salaryGrade: 'SG-1',
      address: '',
      emergencyContact: ''
    });
    setSelectedDeptIds([]);
    setSearchDeptQuery('');
    setOnboardModalOpen(true);
  };

  const handleEditOpen = (worker: Worker) => {
    setEditingWorker(worker);
    setOnboardForm({
      name: worker.name || '',
      role: worker.role || 'Security Officer',
      phone: worker.phone || '',
      email: worker.email || '',
      employmentStatus: worker.employmentStatus || 'active',
      salaryGrade: worker.salaryGrade || 'SG-1',
      address: worker.address || '',
      emergencyContact: worker.emergencyContact || ''
    });
    setSelectedDeptIds(worker.departments?.map((d: any) => d.id) || []);
    setSearchDeptQuery('');
    setOnboardModalOpen(true);
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardForm.name.trim() || !onboardForm.phone.trim()) {
      toast.error('Name and Phone fields are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: onboardForm.name,
        role: onboardForm.role,
        phone: onboardForm.phone,
        email: onboardForm.email || null,
        employmentStatus: onboardForm.employmentStatus,
        salaryGrade: onboardForm.salaryGrade || null,
        address: onboardForm.address || null,
        emergencyContact: onboardForm.emergencyContact || null,
        departments: selectedDeptIds
      };

      if (editingWorker) {
        const id = editingWorker.documentId || editingWorker.id;
        await erpService.updateWorker(id, payload);
        toast.success('Worker profile updated successfully.');
      } else {
        payload.schoolId = `OK${Math.floor(100000000 + Math.random() * 900000000)}`;
        await erpService.createWorker(payload);
        toast.success('New Support Staff member onboarded.');
      }
      setOnboardModalOpen(false);
      setEditingWorker(null);
      loadWorkers();
    } catch (err) {
      toast.error('Failed to save worker record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (worker: Worker) => {
    if (!confirm(`Are you sure you want to delete worker "${worker.name}"?`)) return;
    try {
      const id = worker.documentId || worker.id;
      await apiClient.delete(`/workers/${id}`);
      toast.success('Worker deleted successfully.');
      loadWorkers();
    } catch (err) {
      toast.error('Failed to delete worker.');
    }
  };

  const handleInspectOpen = async (worker: Worker) => {
    setSelectedWorker(worker);
    setInspectDetails(null);
    setColleagues([]);
    setShowInspectModal(true);
    setLoadingInspect(true);

    try {
      const id = worker.documentId || worker.id;
      const res = await apiClient.get(`/workers/${id}`, {
        params: {
          populate: ['photo', 'departments', 'documents']
        }
      });
      const data = res.data?.data || worker;
      setInspectDetails(data);

      const depIds = data.departments?.map((d: any) => d.id) || [];
      if (depIds.length > 0) {
        const colleaguesRes = await apiClient.get('/workers', {
          params: {
            'filters[departments][id][$in]': depIds,
            'filters[id][$ne]': worker.id,
            populate: ['photo']
          }
        });
        setColleagues(colleaguesRes.data?.data || []);
      }
    } catch (err) {
      setInspectDetails(worker);
    } finally {
      setLoadingInspect(false);
    }
  };

  const toggleDeptSelection = (id: number) => {
    setSelectedDeptIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Client-Side filtering
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchSearch = w.name?.toLowerCase().includes(query.toLowerCase()) ||
        w.schoolId?.toLowerCase().includes(query.toLowerCase()) ||
        w.role?.toLowerCase().includes(query.toLowerCase()) ||
        w.phone?.includes(query);

      if (!matchSearch) return false;

      if (categoryFilter !== 'all') {
        const roleLower = (w.role || '').toLowerCase();
        if (categoryFilter === 'driver' && !roleLower.includes('driver')) return false;
        if (categoryFilter === 'security' && !roleLower.includes('security')) return false;
        if (categoryFilter === 'janitorial' && !roleLower.includes('cleaner') && !roleLower.includes('janitor') && !roleLower.includes('caretaker') && !roleLower.includes('technician')) return false;
        if (categoryFilter === 'admin' && !roleLower.includes('accountant') && !roleLower.includes('admin') && !roleLower.includes('clerk')) return false;
      }

      if (shiftFilter !== 'all') {
        const isNight = (w.role || '').toLowerCase().includes('night') || (w.name || '').toLowerCase().includes('night');
        if (shiftFilter === 'day' && isNight) return false;
        if (shiftFilter === 'night' && !isNight) return false;
      }

      return true;
    });
  }, [workers, query, categoryFilter, shiftFilter]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    const total = workers.length;
    const active = workers.filter(w => w.employmentStatus === 'active').length;
    const rate = total > 0 ? Math.round((active / total) * 100) : 100;
    const drivers = workers.filter(w => (w.role || '').toLowerCase().includes('driver')).length;
    const facility = workers.filter(w => 
      (w.role || '').toLowerCase().includes('cleaner') || 
      (w.role || '').toLowerCase().includes('janitor') || 
      (w.role || '').toLowerCase().includes('technician')
    ).length;

    return {
      total,
      active,
      dutyRate: rate + '%',
      drivers,
      facility
    };
  }, [workers]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total',
      title: t('Active Support Personnel', locale),
      value: kpiStats.total,
      subtitle: `▲ ${kpiStats.active} ${t('on active duty', locale)}`,
      trendDirection: 'up',
      icon: <Clipboard className="w-5 h-5" />,
      badgeText: t('Ops Core', locale)
    },
    {
      id: 'duty',
      title: t('On Duty & Check-In Rate', locale),
      value: kpiStats.dutyRate,
      subtitle: `${kpiStats.active} ${t('staff cleared on shifts', locale)}`,
      trendDirection: 'up',
      icon: <Clock className="w-5 h-5" />,
      onClick: () => toast.success('Opened live campus gate checkpoint roster')
    },
    {
      id: 'fleet',
      title: t('Drivers & Transport Fleet', locale),
      value: kpiStats.drivers,
      subtitle: t('bus safety clearance verified, 100%', locale),
      trendDirection: 'up',
      icon: <Truck className="w-5 h-5" />,
      isActive: categoryFilter === 'driver',
      onClick: () => {
        setCategoryFilter(categoryFilter === 'driver' ? 'all' : 'driver');
      }
    },
    {
      id: 'maint',
      title: t('Facility & Maintenance Crew', locale),
      value: kpiStats.facility,
      subtitle: t('Janitorial, Security & IT Support', locale),
      trendDirection: 'neutral',
      icon: <Wrench className="w-5 h-5" />,
      isActive: categoryFilter === 'janitorial',
      onClick: () => {
        setCategoryFilter(categoryFilter === 'janitorial' ? 'all' : 'janitorial');
      }
    }
  ];

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocker is preventing print preview.');
      return;
    }

    const rowsHtml = filteredWorkers.map((w, idx) => {
      const name = w.name || 'Unnamed Staff';
      const idStr = w.schoolId || `WRK-${String(w.id || idx).padStart(4, '0')}`;
      const role = w.role || 'Support Staff';
      const phone = w.phone || 'N/A';
      const email = w.email || 'N/A';
      const status = w.employmentStatus || 'active';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 10px; font-weight: bold; color: #1e293b;">${name}</td>
          <td style="padding: 10px; font-family: monospace; font-weight: bold; color: #0284c7;">${idStr}</td>
          <td style="padding: 10px; text-transform: capitalize;">${role}</td>
          <td style="padding: 10px;">Day Shift (07:30 - 16:30)</td>
          <td style="padding: 10px; font-family: monospace;">${phone}<br/>${email}</td>
          <td style="padding: 10px; text-transform: uppercase; font-weight: bold;">
            <span style="padding: 3px 8px; border-radius: 4px; font-size: 9px; 
              background-color: ${status === 'active' ? '#dcfce7' : '#f3f4f6'}; 
              color: ${status === 'active' ? '#166534' : '#374151'};">
              ${status}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Support Personnel Roster - YAHAYASCOOL</title>
        <style>
          body { font-family: 'Inter', sans-serif; color: #334155; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #a855f7; padding-bottom: 15px; margin-bottom: 20px; }
          .logo-container { display: flex; align-items: center; gap: 15px; }
          .logo-circle { width: 50px; height: 50px; background-color: #a855f7; color: white; font-weight: 955; font-size: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
          .logo-text h1 { margin: 0; font-size: 22px; font-weight: 900; color: #0f172a; }
          .logo-text p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 10px; text-transform: uppercase; color: #475569; }
          .footer { margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <div class="logo-circle">Y</div>
            <div class="logo-text">
              <h1>YAHAYASCOOL</h1>
              <p>Darul Aitam Al-Islamiyyah Boarding SIS</p>
            </div>
          </div>
        </div>
        <div class="title-area">
          <h2 style="margin:0; font-size:16px;">Support Personnel & Operations Roster</h2>
          <p style="margin:4px 0 20px 0; font-size:11px; color:#64748b;">Generated: ${new Date().toLocaleString()} • Records: ${filteredWorkers.length} staff</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Role & Category</th>
              <th>Shift Details</th>
              <th>Contact Details</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="text-align: center; padding: 20px;">No records found.</td></tr>'}
          </tbody>
        </table>
        <div class="footer">
          <span>Confidential - Administrative Operations Only</span>
          <span>&copy; ${new Date().getFullYear()} YAHAYASCOOL SIS.</span>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredDeptsList = useMemo(() => {
    return departments.filter(d => 
      d.title?.toLowerCase().includes(searchDeptQuery.toLowerCase()) ||
      d.code?.toLowerCase().includes(searchDeptQuery.toLowerCase())
    );
  }, [departments, searchDeptQuery]);

  return (
    <EnterpriseModuleShell
      title={t('Support Personnel & Operations Roster', locale)}
      description={t('Registered administrative staff, accountants, transport drivers, campus security, and maintenance personnel with real-time duty check-in.', locale)}
      breadcrumbs={[{ label: t('School ERP', locale) }, { label: t('Support Workers', locale) }]}
      icon={<Clipboard className="w-8 h-8" />}
      recordCount={filteredWorkers.length}
      recordLabel={t('Staff', locale)}
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Print Roster', locale)}</span>
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>{t('Import CSV', locale)}</span>
          </button>
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('Export Roster', locale)}</span>
          </button>
        </div>
      }
    >
      {/* KPI Stats deck */}
      <EnterpriseKPIDeck cards={kpiCards} isLoading={loading && workers.length === 0} />

      {/* Roster Controls Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search support personnel by name, ID code, role, shift, or phone...', locale)}
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadWorkers}
        onPrint={handlePrint}
        onImport={() => setImportModalOpen(true)}
        onExport={() => setExportModalOpen(true)}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel={t('+ Onboard Support Staff', locale)}
        onCreate={handleOnboardOpen}
        customFilterNodes={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">{t('All Operations Categories', locale)}</option>
              <option value="driver">{t('Transport Drivers', locale)}</option>
              <option value="security">{t('Campus Security', locale)}</option>
              <option value="janitorial">{t('Janitorial & Maintenance', locale)}</option>
              <option value="admin">{t('Administrative Support', locale)}</option>
            </select>

            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">{t('All Shifts', locale)}</option>
              <option value="day">{t('Day Shift', locale)}</option>
              <option value="night">{t('Night Shift', locale)}</option>
            </select>
          </div>
        }
      />

      {/* Grid Roster Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-purple-650" />
            <span>{t('Loading personnel records from Strapi...', locale)}</span>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="p-12 text-center text-slate-550 italic text-sm">{t('No support workers found.', locale)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                  <th className="py-3.5 px-4">{t('Support Employee & ID Code', locale)}</th>
                  <th className="py-3.5 px-4">{t('Operational Category & Role', locale)}</th>
                  <th className="py-3.5 px-4">{t('Assigned Shift & Supervisor', locale)}</th>
                  <th className="py-3.5 px-4">{t('Contact Credentials', locale)}</th>
                  <th className="py-3.5 px-4">{t('Duty Status', locale)}</th>
                  <th className="py-3.5 px-4 text-right">{t('Actions', locale)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredWorkers.map((wrk) => {
                  const idStr = wrk.schoolId || `WRK-${String(wrk.id).padStart(4, '0')}`;
                  const isNight = (wrk.role || '').toLowerCase().includes('night') || (wrk.name || '').toLowerCase().includes('night');
                  return (
                    <tr key={wrk.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {wrk.name?.[0] || 'W'}
                          </div>
                          <div>
                            <strong className="text-slate-900 dark:text-white font-bold block">{wrk.name}</strong>
                            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-bold block mt-0.5">{idStr}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-800 dark:text-slate-200 block text-xs capitalize">{wrk.role || t('Staff', locale)}</strong>
                        <span className="text-[10px] text-slate-400 block">{wrk.departments?.[0]?.title || t('Operations', locale)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                         <span className="text-sky-700 dark:text-sky-400 font-bold block text-xs">
                           {isNight ? t('Night Shift (19:30 - 07:30)', locale) : t('Day Shift (07:30 - 16:30)', locale)}
                         </span>
                         <span className="text-[10px] text-slate-400 block">{t('Super:', locale)} Sheikh Yahaya Admin</span>
                       </td>
                      <td className="py-3.5 px-4 font-mono text-xs space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{wrk.phone}</span>
                        </div>
                        {wrk.email && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[180px]">{wrk.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={wrk.employmentStatus || 'active'} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleInspectOpen(wrk)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer"
                            title="Inspect Associates"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditOpen(wrk)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(wrk)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 border-none bg-transparent cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── INSPECT WORKER ASSOCIATES MODAL ──────────────────────────── */}
      {showInspectModal && selectedWorker && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-6xl p-6 rounded-3xl shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto relative animate-slide-up text-xs text-slate-800 dark:text-slate-200">
            
            <button
              onClick={() => {
                setShowInspectModal(false);
                setSelectedWorker(null);
                setInspectDetails(null);
                setColleagues([]);
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 rounded-full border-none bg-transparent cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 pb-4 border-b border-slate-150 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center text-lg font-bold">
                {selectedWorker.name?.[0] || 'W'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-705 dark:text-sky-400 font-bold uppercase tracking-wider text-[9px] border border-sky-150">
                    {selectedWorker.role || 'Support Staff'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    | {selectedWorker.schoolId || `WRK-${String(selectedWorker.id).padStart(4, '0')}`}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">{selectedWorker.name}</h3>
                <p className="text-slate-500 text-[10px] mt-0.5 flex items-center gap-3">
                  <span>Phone: <strong>{selectedWorker.phone}</strong></span>
                  <span>•</span>
                  <span>Email: <strong>{selectedWorker.email || '—'}</strong></span>
                </p>
              </div>
            </div>

            {/* Quick overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block font-bold uppercase mb-0.5">{t('Assigned Departments', locale)}</span>
                <strong className="text-slate-700 dark:text-slate-350 text-sm">
                  {inspectDetails?.departments?.map((d: any) => d.title).join(', ') || t('Operations', locale)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase mb-0.5">{t('Salary Grade', locale)}</span>
                <strong className="text-slate-700 dark:text-slate-350 text-sm font-mono">{inspectDetails?.salaryGrade || 'SG-1'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase mb-0.5">{t('Employment Type', locale)}</span>
                <strong className="text-slate-700 dark:text-slate-350 text-sm capitalize">{inspectDetails?.employmentStatus || t('Active', locale)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase mb-0.5">{t('Duty Shift', locale)}</span>
                <strong className="text-slate-700 dark:text-slate-350 text-sm">
                  {(selectedWorker.role || '').toLowerCase().includes('night') ? t('Night Shift', locale) : t('Day Shift', locale)}
                </strong>
              </div>
            </div>

            {/* 3 Columns Associates List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              
              {/* Column 1: Department Colleagues */}
              <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span>{t('Department Colleagues', locale)}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-955 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold font-mono">
                    {colleagues.length}
                  </span>
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
                  {loadingInspect ? (
                    <p className="text-[10px] text-slate-500 italic py-4 text-center">{t('Loading colleagues...', locale)}</p>
                  ) : colleagues.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic py-4 text-center">{t('No department colleagues found.', locale)}</p>
                  ) : (
                    colleagues.map((col: any) => (
                      <div key={col.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1 shadow-2xs">
                        <strong className="text-slate-800 dark:text-slate-200 block text-[11px] font-bold leading-snug">{col.name}</strong>
                        <span className="text-[9px] text-slate-400 font-mono block">{col.schoolId || `ID: #${col.id}`}</span>
                        <span className="text-[9px] text-emerald-600 block mt-1 font-semibold">{col.role || 'Support Staff'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Shift, Supervisor & Contact */}
              <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span>{t('Duty & Shift Parameters', locale)}</span>
                </h4>
                <div className="space-y-3 text-[11px] leading-relaxed flex-1">
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1 shadow-2xs">
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">{t('Shift Timings', locale)}</span>
                    <strong className="text-slate-700 dark:text-slate-200 block text-xs">
                      {(selectedWorker.role || '').toLowerCase().includes('night') ? t('19:30 PM - 07:30 AM (Night)', locale) : t('07:30 AM - 16:30 PM (Day)', locale)}
                    </strong>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1 shadow-2xs">
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">{t('Assigned Supervisor', locale)}</span>
                    <strong className="text-slate-700 dark:text-slate-200 block text-xs">Sheikh Yahaya Admin</strong>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1 shadow-2xs">
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">{t('Emergency Contact', locale)}</span>
                    <strong className="text-slate-700 dark:text-slate-200 block">{inspectDetails?.emergencyContact || '—'}</strong>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1 shadow-2xs">
                    <span className="text-slate-400 block font-bold uppercase text-[9px]">{t('Residential Address', locale)}</span>
                    <strong className="text-slate-700 dark:text-slate-200 block font-sans">{inspectDetails?.address || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Column 3: Documents & Credentials */}
              <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span>{t('Dossier & Credentials', locale)}</span>
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-955 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold font-mono">
                    {inspectDetails?.documents?.length || 0} {t('Files', locale)}
                  </span>
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
                  {loadingInspect ? (
                    <p className="text-[10px] text-slate-500 italic py-4 text-center">{t('Loading documents...', locale)}</p>
                  ) : !inspectDetails?.documents || inspectDetails.documents.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic py-4 text-center">{t('No dossier files uploaded.', locale)}</p>
                  ) : (
                    inspectDetails.documents.map((doc: any) => (
                      <div key={doc.id} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-2xs">
                        <div className="min-w-0 leading-tight">
                          <span className="font-semibold text-slate-700 dark:text-slate-200 block text-[10px] truncate">{doc.name || 'Dossier File'}</span>
                          <span className="text-[9px] text-slate-400 font-mono block uppercase">{doc.ext || 'PDF'}</span>
                        </div>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-2 py-1 rounded bg-slate-50 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-purple-955 text-[9px] font-bold border border-slate-150"
                        >
                          View File
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── ONBOARD / EDIT SUPPORT WORKER FORM MODAL ────────────────── */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white animate-slide-up text-xs">
            
            <button
              onClick={() => { setOnboardModalOpen(false); setEditingWorker(null); }}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer border-none bg-transparent"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
              {editingWorker ? t('Edit Support Worker Profile', locale) : t('Onboard Support Worker', locale)}
            </h3>
            <p className="text-slate-500 text-[10px] mt-0.5 mb-4">
              {t('Enter worker credentials, salary grade, residential parameters, and link departments.', locale)}
            </p>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-350 mb-1">{t('Full Name *', locale)}</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.name}
                    onChange={(e) => setOnboardForm({...onboardForm, name: e.target.value})}
                    placeholder="e.g. Oumaru Sillah"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-350 mb-1">{t('Operational Role *', locale)}</label>
                  <select
                    value={onboardForm.role}
                    onChange={(e) => setOnboardForm({...onboardForm, role: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Security Officer">{t('Security Officer', locale)}</option>
                    <option value="Cleaner / Janitor">{t('Cleaner / Janitor', locale)}</option>
                    <option value="Chef / Kitchen Staff">{t('Chef / Kitchen Staff', locale)}</option>
                    <option value="Bus Driver">{t('Bus Driver', locale)}</option>
                    <option value="ICT / Systems Support">{t('ICT / Systems Support', locale)}</option>
                    <option value="Mosque Caretaker">{t('Mosque Caretaker', locale)}</option>
                    <option value="Maintenance Technician">{t('Maintenance Technician', locale)}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-350 mb-1">{t('Phone Number *', locale)}</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.phone}
                    onChange={(e) => setOnboardForm({...onboardForm, phone: e.target.value})}
                    placeholder="+231 770 000 000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-350 mb-1">{t('Email Address', locale)}</label>
                  <input
                    type="email"
                    value={onboardForm.email}
                    onChange={(e) => setOnboardForm({...onboardForm, email: e.target.value})}
                    placeholder="worker@yahayaschool.edu"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-350 mb-1">{t('Employment Status *', locale)}</label>
                  <select
                    value={onboardForm.employmentStatus}
                    onChange={(e) => setOnboardForm({...onboardForm, employmentStatus: e.target.value as any})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="active">{t('Active', locale)}</option>
                    <option value="on_leave">{t('On Leave', locale)}</option>
                    <option value="suspended">{t('Suspended', locale)}</option>
                    <option value="retired">{t('Retired', locale)}</option>
                    <option value="contract">{t('Contract', locale)}</option>
                    <option value="full_time">{t('Full Time', locale)}</option>
                    <option value="part_time">{t('Part Time', locale)}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-350 mb-1">{t('Salary Grade', locale)}</label>
                  <input
                    type="text"
                    value={onboardForm.salaryGrade}
                    onChange={(e) => setOnboardForm({...onboardForm, salaryGrade: e.target.value})}
                    placeholder="e.g. SG-1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-350 mb-1">{t('Residential Address', locale)}</label>
                  <textarea
                    rows={2}
                    value={onboardForm.address}
                    onChange={(e) => setOnboardForm({...onboardForm, address: e.target.value})}
                    placeholder={t('Enter residential home address...', locale)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-350 mb-1">{t('Emergency Contact', locale)}</label>
                  <textarea
                    rows={2}
                    value={onboardForm.emergencyContact}
                    onChange={(e) => setOnboardForm({...onboardForm, emergencyContact: e.target.value})}
                    placeholder={t('Emergency contact person & phone...', locale)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-[11px]"
                  />
                </div>
              </div>

              {/* Link Departments Checklist */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col">
                <label className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                  {t('Link Operations Departments', locale)} ({selectedDeptIds.length})
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('Search departments to link...', locale)}
                    value={searchDeptQuery}
                    onChange={(e) => setSearchDeptQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] focus:outline-none"
                  />
                </div>
                <div className="border border-slate-205 dark:border-slate-800 rounded-xl p-3 max-h-[140px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/20">
                  {filteredDeptsList.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic text-center py-4 col-span-2">{t('No departments matched.', locale)}</p>
                  ) : (
                    filteredDeptsList.map(dept => {
                      const checked = selectedDeptIds.includes(dept.id);
                      return (
                        <div 
                          key={dept.id}
                          onClick={() => toggleDeptSelection(dept.id)}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 cursor-pointer hover:border-sky-500/50 transition-colors"
                        >
                          <div className="min-w-0 leading-tight">
                            <span className="font-semibold text-slate-700 dark:text-slate-205 block text-[10px] truncate">{dept.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono block">{dept.code || `ID: #${dept.id}`}</span>
                          </div>
                          {checked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-350" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setOnboardModalOpen(false); setEditingWorker(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  {t('Cancel', locale)}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md disabled:opacity-50 cursor-pointer border-none"
                >
                  {submitting ? t('Onboarding...', locale) : t('Save Worker Profile', locale)}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        entityType="worker"
        onSuccess={loadWorkers}
      />
      <BulkExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={workers}
        entityType="worker"
      />
    </EnterpriseModuleShell>
  );
}
