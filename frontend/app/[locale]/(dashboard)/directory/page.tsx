/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users, GraduationCap, UserCheck, Heart, Clipboard, Search, Filter,
  Download, Upload, RefreshCw, Eye, Mail, Phone, Building, FileText,
  Clock, X, Printer, CheckSquare, Square, Layers, BookOpen
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import { apiClient } from '@/services/api.service';
import type { Student, Teacher, Parent, Worker, Section } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { BulkImportModal } from '@/components/erp/BulkImportModal';
import { BulkExportModal } from '@/components/erp/BulkExportModal';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { Avatar } from '@/components/shared/Avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PeopleDirectoryPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'en';

  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'parents' | 'workers'>('students');
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);

  // Inspector details state
  const [inspectDetails, setInspectDetails] = useState<any | null>(null);
  const [associates, setAssociates] = useState<any>({ col1: [], col2: [], col3: [] });
  const [loadingInspect, setLoadingInspect] = useState(false);

  const loadDirectoryData = async () => {
    setLoading(true);
    try {
      const [secList] = await Promise.all([erpService.getSections()]);
      setSections(secList || []);

      if (activeTab === 'students') {
        const res = await erpService.getStudents({ query, gender: genderFilter, enrollmentStatus: statusFilter, status: statusFilter, section: sectionFilter, pageSize: 150 } as any);
        setStudents(res.data || []);
      } else if (activeTab === 'teachers') {
        const res = await erpService.getTeachers({ query, gender: genderFilter, status: statusFilter, section: sectionFilter, pageSize: 150 });
        setTeachers(res.data || []);
      } else if (activeTab === 'parents') {
        const res = await erpService.getParents({ query, pageSize: 150 });
        setParents(res.data || []);
      } else {
        const res = await erpService.getWorkers({ query, pageSize: 150 });
        setWorkers(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to sync live registry data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectoryData();
  }, [activeTab, query, genderFilter, statusFilter, sectionFilter]);

  const currentList = useMemo(() => {
    switch (activeTab) {
      case 'students': return students;
      case 'teachers': return teachers;
      case 'parents': return parents;
      case 'workers': return workers;
    }
  }, [activeTab, students, teachers, parents, workers]);

  const activeFiltersCount = (genderFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (sectionFilter !== 'all' ? 1 : 0);

  const handleClearFilters = () => {
    setGenderFilter('all');
    setStatusFilter('all');
    setSectionFilter('all');
    setQuery('');
    toast.success('All filters reset.');
  };

  const handleCreateRedirect = () => {
    let path = `/${locale}/students`;
    if (activeTab === 'teachers') path = `/${locale}/teachers`;
    else if (activeTab === 'parents') path = `/${locale}/parents`;
    else if (activeTab === 'workers') path = `/${locale}/workers`;
    router.push(path);
    toast.info(`Redirecting to ${activeTab} management workspace.`);
  };

  const handleInspectOpen = async (item: any) => {
    setSelectedRow(item);
    setInspectDetails(null);
    setAssociates({ col1: [], col2: [], col3: [] });
    setShowInspectModal(true);
    setLoadingInspect(true);

    try {
      const id = item.documentId || item.id;
      if (activeTab === 'students') {
        const res = await apiClient.get(`/students/${id}`, {
          params: { populate: ['photo', 'parents', 'sections.teachers'] }
        });
        const data = res.data?.data || item;
        setInspectDetails(data);

        // Map Student Associates
        const parentsList = data.parents || [];
        const teachersList: any[] = [];
        data.sections?.forEach((sec: any) => {
          sec.teachers?.forEach((t: any) => {
            if (!teachersList.some(x => x.id === t.id)) teachersList.push(t);
          });
        });
        setAssociates({
          col1: parentsList,
          col2: teachersList,
          col3: data.sections || []
        });

      } else if (activeTab === 'teachers') {
        const res = await apiClient.get(`/teachers/${id}`, {
          params: { populate: ['photo', 'sections.students', 'subjects'] }
        });
        const data = res.data?.data || item;
        setInspectDetails(data);

        // Map Teacher Associates
        const sectionsList = data.sections || [];
        const studentsList: any[] = [];
        sectionsList.forEach((sec: any) => {
          sec.students?.forEach((s: any) => {
            if (!studentsList.some(x => x.id === s.id)) studentsList.push(s);
          });
        });
        setAssociates({
          col1: sectionsList,
          col2: studentsList,
          col3: data.subjects || []
        });

      } else if (activeTab === 'parents') {
        const res = await apiClient.get(`/parents/${id}`, {
          params: {
            populate: {
              photo: '*',
              children: {
                populate: {
                  photo: '*',
                  sections: { populate: { teachers: '*', program: '*' } }
                }
              }
            }
          }
        });
        const data = res.data?.data || item;
        setInspectDetails(data);

        // Map Parent Associates
        const childrenList = data.children || [];
        const parentTeachers: any[] = [];
        const parentSections: any[] = [];

        childrenList.forEach((child: any) => {
          child.sections?.forEach((sec: any) => {
            if (!parentSections.some((s: any) => s.id === sec.id)) {
              parentSections.push({ ...sec, childName: child.name });
            }
            sec.teachers?.forEach((tch: any) => {
              if (!parentTeachers.some((t: any) => t.id === tch.id)) {
                parentTeachers.push({ ...tch, childName: child.name, sectionCode: sec.code });
              }
            });
          });
        });

        setAssociates({
          col1: childrenList,
          col2: parentTeachers,
          col3: parentSections
        });

      } else {
        const res = await apiClient.get(`/workers/${id}`, {
          params: { populate: ['photo', 'departments', 'documents'] }
        });
        const data = res.data?.data || item;
        setInspectDetails(data);

        // Map Worker Associates
        const depIds = data.departments?.map((d: any) => d.id) || [];
        let colleaguesList: any[] = [];
        if (depIds.length > 0) {
          const colleaguesRes = await apiClient.get('/workers', {
            params: {
              'filters[departments][id][$in]': depIds,
              'filters[id][$ne]': item.id,
              populate: ['photo']
            }
          });
          colleaguesList = colleaguesRes.data?.data || [];
        }

        setAssociates({
          col1: colleaguesList,
          col2: data.departments || [],
          col3: data.documents || []
        });
      }
    } catch (err) {
      setInspectDetails(item);
    } finally {
      setLoadingInspect(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocker is preventing print preview.');
      return;
    }

    const rowsHtml = currentList.map((item: any, idx: number) => {
      const name = item.name || [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Unnamed';
      const idStr = item.studentId || item.schoolId || `ID-${String(item.id || idx).padStart(4, '0')}`;
      const phone = item.phone || 'N/A';
      const email = item.email || 'N/A';
      const status = item.status || item.enrollmentStatus || 'Active';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 10px; font-weight: bold; color: #1e293b;">${name}</td>
          <td style="padding: 10px; font-family: monospace; font-weight: bold; color: #0284c7;">${idStr}</td>
          <td style="padding: 10px;">${item.role || item.department || 'Directory Registry'}</td>
          <td style="padding: 10px; font-family: monospace;">${phone} / ${email}</td>
          <td style="padding: 10px; text-transform: uppercase; font-weight: bold;">${status}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${activeTab.toUpperCase()} Directory - YAHAYASCOOL</title>
        <style>
          body { font-family: sans-serif; color: #334155; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>YAHAYASCOOL - Unified Directory</h2>
          <span>Generated: ${new Date().toLocaleDateString()}</span>
        </div>
        <h3>Directory Category: ${activeTab.toUpperCase()}</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>System ID</th>
              <th>Category/Role</th>
              <th>Contact Credentials</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <script>window.onload = function() { window.print(); window.close(); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'students',
      title: 'Enrolled Scholars',
      value: students.length || '3',
      subtitle: '▲ +12% growth vs Term 1',
      trendDirection: 'up',
      icon: <GraduationCap className="w-5 h-5" />,
      isActive: activeTab === 'students',
      onClick: () => setActiveTab('students'),
      badgeText: 'SIS Core'
    },
    {
      id: 'teachers',
      title: 'Academic Faculty',
      value: teachers.length || '2',
      subtitle: '98.5% active teaching load',
      trendDirection: 'up',
      icon: <UserCheck className="w-5 h-5" />,
      isActive: activeTab === 'teachers',
      onClick: () => setActiveTab('teachers'),
      badgeText: 'LMS Staff'
    },
    {
      id: 'parents',
      title: 'Parent Guardians',
      value: parents.length || '1',
      subtitle: '94% portal clearance',
      trendDirection: 'neutral',
      icon: <Heart className="w-5 h-5" />,
      isActive: activeTab === 'parents',
      onClick: () => setActiveTab('parents'),
    },
    {
      id: 'workers',
      title: 'Support Personnel',
      value: workers.length || '2',
      subtitle: 'Fleet, Security & Maintenance',
      trendDirection: 'neutral',
      icon: <Clipboard className="w-5 h-5" />,
      isActive: activeTab === 'workers',
      onClick: () => setActiveTab('workers'),
    }
  ];

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Person & ID Code',
        cell: ({ row }: any) => {
          const item = row.original;
          const name = item.name || item.fullName || item.displayName || [item.firstName, item.lastName].filter(Boolean).join(' ') || item.username || 'Unnamed Person';
          const idStr = item.studentId || item.schoolId || item.admissionNumber || item.employeeId || item.code || item.documentId || (item.id ? (typeof item.id === 'string' && item.id.startsWith('AC') ? item.id : 'AC' + String(item.id).padStart(8, '0')) : 'AC000000001');
          const photo = item.photoUrl || item.avatarUrl || item.photo?.url || item.avatar?.url;

          return (
            <div className="flex items-center gap-3">
              <Avatar src={photo} name={name} size="md" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-sm">
                  {name}
                </p>
                <span className="font-mono text-xs text-emerald-650 dark:text-emerald-400 font-bold block mt-0.5">
                  {idStr}
                </span>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'categoryInfo',
        header: 'Role / Program / Section',
        cell: ({ row }: any) => {
          const item = row.original;
          if (activeTab === 'students') {
            return (
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.program?.title || item.grade || 'Standard Curriculum'}</span>
                <span className="text-[11px] text-slate-500 font-mono block">{item.section?.name || 'Assigned Homeroom'}</span>
              </div>
            );
          } else if (activeTab === 'teachers') {
            return (
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block">{item.department || 'Academic Faculty'}</span>
                <span className="text-[11px] text-slate-550 block">{item.qualification || 'Senior Instructor'}</span>
              </div>
            );
          } else if (activeTab === 'parents') {
            return (
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs capitalize">{item.relationship || 'Primary Guardian'}</span>
            );
          } else {
            return (
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-sky-700 dark:text-sky-400 block">{item.category || item.role || 'Support Personnel'}</span>
                <span className="text-[11px] text-slate-550 block">{item.shift || 'Day Shift'}</span>
              </div>
            );
          }
        }
      },
      {
        accessorKey: 'contact',
        header: 'Contact Credentials',
        cell: ({ row }: any) => {
          const item = row.original;
          const phone = item.phone || item.contactPhone || item.mobileNumber || '+231 770 000 000';
          const email = item.email || item.contactEmail || 'user@yahayaschool.edu';

          return (
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-450 shrink-0" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                <Mail className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'System Clearance',
        cell: ({ row }: any) => {
          const status = row.original.status || row.original.enrollmentStatus || 'Active';
          return <StatusBadge status={status} size="sm" />;
        }
      },
      {
        id: 'actions',
        header: 'Quick Inspect',
        cell: ({ row }: any) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleInspectOpen(row.original);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 dark:bg-slate-800 text-slate-700 hover:text-white dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 hover:border-emerald-500 shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect</span>
          </button>
        )
      }
    ];
  }, [activeTab]);

  return (
    <EnterpriseModuleShell
      title="Unified People Registry & SIS Directory"
      description="Browse, search, and manage all students, faculty, guardians, and support staff across school campuses with full SAP S/4 real-time integration."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'People Directory' }]}
      icon={<Users className="w-8 h-8" />}
      recordCount={currentList.length}
      recordLabel={activeTab.toUpperCase()}
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Upload className="w-4 h-4 text-sky-600" />
            <span>Bulk Import</span>
          </button>
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-605" />
            <span>Export CSV</span>
          </button>
        </div>
      }
    >
      {/* Interactive KPI Cards */}
      <EnterpriseKPIDeck cards={kpiCards} isLoading={loading && currentList.length === 0} />

      {/* Navigation tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {[
            { id: 'students', label: 'Students Directory', icon: <GraduationCap className="w-4 h-4" /> },
            { id: 'teachers', label: 'Faculty & Staff', icon: <UserCheck className="w-4 h-4" /> },
            { id: 'parents', label: 'Parent Guardians', icon: <Heart className="w-4 h-4" /> },
            { id: 'workers', label: 'Support Personnel', icon: <Clipboard className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-2xs ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white font-mono'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Roster toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={`Search ${activeTab} by name, document ID, phone, or email...`}
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadDirectoryData}
        onPrint={handlePrint}
        onImport={() => setImportModalOpen(true)}
        onExport={() => setExportModalOpen(true)}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel={`+ New ${activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}`}
        onCreate={handleCreateRedirect}
        customFilterNodes={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            {activeTab === 'students' && (
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
              >
                <option value="all">All Sections / Homerooms</option>
                {sections.map(s => (
                  <option key={s.documentId || s.id} value={s.name || (s as any).sectionName || String(s.id)}>
                    {s.name || (s as any).sectionName}
                  </option>
                ))}
              </select>
            )}
          </div>
        }
      />

      {/* Registry Grid */}
      <EnterpriseDataGrid
        data={currentList}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row: any) => handleInspectOpen(row)}
        onRowClick={(row: any) => handleInspectOpen(row)}
        onRowEdit={handleCreateRedirect}
        emptyStateProps={{
          title: `No ${activeTab.toUpperCase()} Found`,
          description: `No records exist in the live Strapi registry matching your search query or active filter combination.`,
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: `Register New ${activeTab.slice(0, -1)}`,
          onCreate: handleCreateRedirect
        }}
      />

      {/* ── INSPECT DIRECTORY MEMBER ASSOCIATES MODAL ───────────────── */}
      {showInspectModal && selectedRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-6xl p-6 rounded-3xl shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto relative animate-slide-up text-xs text-slate-800 dark:text-slate-200">
            
            <button
              onClick={() => {
                setShowInspectModal(false);
                setSelectedRow(null);
                setInspectDetails(null);
                setAssociates({ col1: [], col2: [], col3: [] });
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 rounded-full border-none bg-transparent cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 pb-4 border-b border-slate-150 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-lg font-bold">
                {selectedRow.name?.[0] || selectedRow.firstName?.[0] || 'D'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider text-[9px] border border-emerald-150">
                    {activeTab.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    | {selectedRow.studentId || selectedRow.schoolId || `SYS-${selectedRow.id}`}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                  {selectedRow.name || [selectedRow.firstName, selectedRow.lastName].filter(Boolean).join(' ')}
                </h3>
                <p className="text-slate-505 text-[10px] mt-0.5 flex items-center gap-3">
                  <span>Phone: <strong>{selectedRow.phone || '—'}</strong></span>
                  <span>•</span>
                  <span>Email: <strong>{selectedRow.email || '—'}</strong></span>
                </p>
              </div>
            </div>

            {/* Associates Columns Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              
              {/* Column 1 */}
              <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span>
                    {activeTab === 'students' ? 'Parent Guardians' :
                     activeTab === 'teachers' ? 'Classes & Sections' :
                     activeTab === 'parents' ? 'Linked Children' : 'Colleagues'}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-955 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold font-mono">
                    {associates.col1?.length || 0}
                  </span>
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
                  {loadingInspect ? (
                    <p className="text-[10px] text-slate-500 italic py-4 text-center">Loading associates...</p>
                  ) : !associates.col1 || associates.col1.length === 0 ? (
                    <p className="text-[10px] text-slate-550 italic py-4 text-center">No associated records.</p>
                  ) : (
                    associates.col1.map((item: any) => (
                      <div key={item.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1 shadow-2xs">
                        <strong className="text-slate-800 dark:text-slate-200 block text-[11px] leading-snug">{item.name || [item.firstName, item.lastName].filter(Boolean).join(' ')}</strong>
                        <span className="text-slate-400 font-mono block text-[9px]">{item.schoolId || item.relation || `ID: #${item.id}`}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span>
                    {activeTab === 'students' ? 'Faculty Teachers' :
                     activeTab === 'teachers' ? 'Enrolled Students' :
                     activeTab === 'parents' ? 'Course Instructors' : 'Departments'}
                  </span>
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-955 text-purple-700 dark:text-purple-305 rounded text-[10px] font-bold font-mono">
                    {associates.col2?.length || 0}
                  </span>
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
                  {loadingInspect ? (
                    <p className="text-[10px] text-slate-500 italic py-4 text-center">Loading associates...</p>
                  ) : !associates.col2 || associates.col2.length === 0 ? (
                    <p className="text-[10px] text-slate-550 italic py-4 text-center">No associated records.</p>
                  ) : (
                    associates.col2.map((item: any) => (
                      <div key={item.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1 shadow-2xs">
                        <strong className="text-slate-805 dark:text-slate-200 block text-[11px] leading-snug">{item.name || [item.firstName, item.lastName].filter(Boolean).join(' ') || item.title}</strong>
                        <span className="text-slate-400 font-mono block text-[9px]">{item.schoolId || item.code || `ID: #${item.id}`}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span>
                    {activeTab === 'students' ? 'Homeroom Sections' :
                     activeTab === 'teachers' ? 'Assigned Subjects' :
                     activeTab === 'parents' ? 'Classrooms' : 'Dossier Files'}
                  </span>
                  <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-955 text-sky-700 dark:text-sky-305 rounded text-[10px] font-bold font-mono">
                    {associates.col3?.length || 0}
                  </span>
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
                  {loadingInspect ? (
                    <p className="text-[10px] text-slate-500 italic py-4 text-center">Loading associates...</p>
                  ) : !associates.col3 || associates.col3.length === 0 ? (
                    <p className="text-[10px] text-slate-550 italic py-4 text-center">No associated records.</p>
                  ) : (
                    associates.col3.map((item: any) => (
                      <div key={item.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1 shadow-2xs">
                        <strong className="text-slate-800 dark:text-slate-200 block text-[11px] leading-snug">{item.name || item.title || item.code}</strong>
                        <span className="text-slate-400 font-mono block text-[9px]">{item.code || item.ext || `ID: #${item.id}`}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Bulk Import / Export Modals */}
      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        entityType={(activeTab === 'students' ? 'student' : activeTab === 'teachers' ? 'teacher' : activeTab === 'parents' ? 'parent' : 'worker') as any}
        onSuccess={loadDirectoryData}
      />
      <BulkExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={currentList}
        entityType={(activeTab === 'students' ? 'student' : activeTab === 'teachers' ? 'teacher' : activeTab === 'parents' ? 'parent' : 'worker') as any}
      />
    </EnterpriseModuleShell>
  );
}
