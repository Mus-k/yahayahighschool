/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  GraduationCap, Search, Upload, Download, ArrowRight,
  Filter, Layers, RefreshCw, UserPlus, Grid, List, Eye,
  Award, Calendar, DollarSign, BookOpen, CheckCircle2, Shield,
  X, Edit, Trash2, PauseCircle, Printer
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import { apiClient } from '@/services/api.service';
import { Avatar } from '@/components/shared/Avatar';
import type { Student, Section } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { BulkImportModal } from '@/components/erp/BulkImportModal';
import { BulkExportModal } from '@/components/erp/BulkExportModal';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { toast } from 'sonner';

export default function StudentsListPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'en';
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  // Modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);

  // Form Fields
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formGender, setFormGender] = useState('male');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [formSectionId, setFormSectionId] = useState('');

  const loadStudents = async () => {
    setLoading(true);
    try {
      const [secList, stRes] = await Promise.all([
        erpService.getSections(),
        erpService.getStudents({ query, gender: genderFilter, enrollmentStatus: statusFilter, status: statusFilter, section: sectionFilter, pageSize: 150 } as any),
      ]);
      setSections(secList || []);
      setStudents(stRes.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      toast.error('Failed to sync student registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadStudents, 200);
    return () => clearTimeout(timer);
  }, [query, genderFilter, statusFilter, sectionFilter]);

  const activeFiltersCount = (genderFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (sectionFilter !== 'all' ? 1 : 0);

  const handleClearFilters = () => {
    setGenderFilter('all');
    setStatusFilter('all');
    setSectionFilter('all');
    setQuery('');
    toast.success('All student filters cleared.');
  };

  const handleOnboardOpen = () => {
    setEditingStudent(null);
    setFormName('');
    setFormStudentId(`ST-${Date.now().toString().slice(-6)}`);
    setFormGender('male');
    setFormParentName('');
    setFormParentPhone('');
    setFormStatus('active');
    setFormSectionId('');
    setOnboardModalOpen(true);
  };

  const handleEditOpen = (st: any) => {
    setEditingStudent(st);
    setFormName(st.name || '');
    setFormStudentId(st.studentId || '');
    setFormGender(st.gender || 'male');
    setFormParentName(st.parentName || '');
    setFormParentPhone(st.parentPhone || '');
    setFormStatus(st.enrollmentStatus || st.status || 'active');
    setFormSectionId(st.section?.documentId || st.section?.id || '');
    setOnboardModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Student Name is required.');
      return;
    }

    try {
      const payload: any = {
        name: formName,
        studentId: formStudentId,
        gender: formGender,
        parentName: formParentName,
        parentPhone: formParentPhone,
        enrollmentStatus: formStatus,
        status: formStatus
      };

      if (formSectionId) {
        payload.section = formSectionId;
      }

      if (editingStudent) {
        const id = editingStudent.documentId || editingStudent.id;
        await apiClient.put(`/students/${id}`, { data: payload });
        toast.success('Student details updated successfully.');
      } else {
        await apiClient.post('/students', { data: payload });
        toast.success('New Student registered successfully.');
      }
      setOnboardModalOpen(false);
      loadStudents();
    } catch (err) {
      toast.error('Failed to save student profile.');
    }
  };

  const handleDelete = async (st: any) => {
    if (!confirm(`Are you sure you want to delete ${st.name || 'this student'}?`)) return;
    try {
      const id = st.documentId || st.id;
      await apiClient.delete(`/students/${id}`);
      toast.success('Student deleted successfully.');
      loadStudents();
    } catch (err) {
      toast.error('Failed to delete student.');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocker is preventing print preview.');
      return;
    }

    const rowsHtml = students.map((st: any, idx: number) => {
      const name = st.name || [st.firstName, st.lastName].filter(Boolean).join(' ') || 'Unnamed Scholar';
      const idStr = st.studentId || st.schoolId || `STU-${String(st.id || idx).padStart(4, '0')}`;
      const program = st.program?.name || st.grade || 'Standard Curriculum';
      const section = st.section?.name || 'Assigned Homeroom';
      const guardian = st.parentName || st.guardian?.name || 'No Guardian Linked';
      const phone = st.parentPhone || st.contactPhone || 'N/A';
      const status = st.enrollmentStatus || st.status || 'Active';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 10px; font-weight: bold; color: #1e293b;">${name}</td>
          <td style="padding: 10px; font-family: monospace; font-weight: bold; color: #10b981;">${idStr}</td>
          <td style="padding: 10px;">${program} (${section})</td>
          <td style="padding: 10px;">${guardian} / ${phone}</td>
          <td style="padding: 10px; text-transform: uppercase; font-weight: bold;">${status}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Roster - YAHAYASCOOL</title>
        <style>
          body { font-family: sans-serif; color: #334155; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>YAHAYASCOOL - Students Roster Directory</h2>
          <span>Generated: ${new Date().toLocaleDateString()}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Scholar Name</th>
              <th>Student ID</th>
              <th>Program & Homeroom</th>
              <th>Parent / Contact</th>
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
      id: 'enrolled',
      title: 'Active Enrolled Scholars',
      value: students.length,
      subtitle: `${students.length} total registered`,
      trendDirection: 'up',
      icon: <GraduationCap className="w-5 h-5" />,
      isActive: statusFilter === 'active',
      onClick: () => {
        setStatusFilter(statusFilter === 'active' ? 'all' : 'active');
        toast.info(statusFilter === 'active' ? 'Showing all students' : 'Filtered to Active Scholars only');
      },
      badgeText: 'SIS Verified'
    },
    {
      id: 'hifz',
      title: 'Hifz Qur\'an Scholars',
      value: students.filter((s: any) => (s.section?.name || '').toLowerCase().includes('hifz') || (s.program?.name || '').toLowerCase().includes('hifz')).length.toLocaleString('en-US'),
      subtitle: 'Scholars in Hifz track',
      trendDirection: 'up',
      icon: <Award className="w-5 h-5" />,
      onClick: () => toast.success('Filtered view to Hifz Intensive Track Scholars')
    },
    {
      id: 'attendance',
      title: 'Average Daily Attendance',
      value: '—',
      subtitle: 'See Attendance module for live data',
      trendDirection: 'neutral',
      icon: <Calendar className="w-5 h-5" />,
      onClick: () => toast.info('Opened campus attendance analytical breakdown')
    },
    {
      id: 'pending',
      title: 'Pending Review / Action',
      value: students.filter((s: any) => (s.enrollmentStatus || s.status || '') === 'pending').length.toString(),
      subtitle: 'Admissions awaiting final placement',
      trendDirection: 'neutral',
      icon: <Layers className="w-5 h-5" />,
      isActive: statusFilter === 'pending',
      onClick: () => {
        setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending');
        toast.info(statusFilter === 'pending' ? 'Showing all students' : 'Filtered to Pending Review only');
      }
    }
  ];

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Student Scholar & ID',
        cell: ({ row }: any) => {
          const st = row.original;
          const name = st.name || st.fullName || st.displayName || [st.firstName, st.lastName].filter(Boolean).join(' ') || st.username || 'Unnamed Student';
          const rawId = String(st.id || '');
          const idStr = st.studentId || st.schoolId || st.admissionNumber || st.code || (st as any).documentId || (rawId.startsWith('AC') ? rawId : rawId ? 'AC' + rawId.padStart(8, '0') : 'AC000000001');
          const photo = st?.photoUrl || st?.avatarUrl || st?.photo?.url || st?.avatar?.url || (st as any)?.user?.avatar?.url || (st as any)?.user?.avatarUrl || (st as any)?.user?.photoUrl;

          return (
            <div className="flex items-center gap-3">
              <Avatar src={st?.photo || photo} name={name} size="sm" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-sm">
                  {name}
                </p>
                <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                  {idStr}
                </span>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'academic',
        header: 'Program & Homeroom Section',
        cell: ({ row }: any) => {
          const st = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{st.program?.name || st.grade || 'Standard Curriculum'}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block">{st.section?.name || 'Assigned Homeroom'}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'guardian',
        header: 'Linked Parent Guardian',
        cell: ({ row }: any) => {
          const st = row.original;
          const guardian = st.parentName || st.guardian?.name || 'No Guardian Linked';
          const phone = st.parentPhone || st.contactPhone || 'No contact';

          return (
            <div className="space-y-0.5 text-xs">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 block truncate max-w-[180px]">{guardian}</span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 block">{phone}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Enrollment Status',
        cell: ({ row }: any) => {
          const status = row.original.enrollmentStatus || row.original.status || 'Active';
          return <StatusBadge status={status} size="sm" />;
        }
      },
      {
        id: 'actions',
        header: 'Roster Actions',
        cell: ({ row }: any) => {
          const st = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => setSelectedRow(st)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer border-none bg-transparent"
                title="Inspect Profile"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEditOpen(st)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer border-none bg-transparent"
                title="Edit Student"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(st)}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 cursor-pointer border-none bg-transparent"
                title="Delete Student"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        }
      }
    ];
  }, []);

  const quickActions = useMemo(() => {
    return [
      {
        id: 'edit',
        label: 'Edit Profile',
        icon: <Edit className="w-3.5 h-3.5" />,
        variant: 'primary' as const,
        onClick: (record: any) => {
          setSelectedRow(null);
          handleEditOpen(record);
        }
      },
      {
        id: 'print-id',
        label: 'Print ID Card',
        icon: <Printer className="w-3.5 h-3.5" />,
        onClick: (record: any) => {
          const printWindow = window.open('', '_blank');
          if (!printWindow) return;
          const name = record.name || [record.firstName, record.lastName].filter(Boolean).join(' ') || 'Unnamed';
          const idStr = record.studentId || record.schoolId || `AC-${record.id}`;
          const html = `
            <html>
            <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; margin:0;">
              <div style="border: 2px solid #10b981; border-radius: 15px; width: 320px; height: 480px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <h2 style="color: #065f46; margin: 0; font-size: 18px;">YAHAYASCOOL</h2>
                  <span style="font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Student Scholar ID</span>
                </div>
                <div style="margin: 20px 0;">
                  <div style="width: 120px; height: 120px; border-radius: 50%; background: #e5e7eb; margin: 0 auto; display: flex; justify-content: center; align-items: center; font-size: 40px; font-weight: bold; color: #4b5563;">
                    ${name[0]}
                  </div>
                  <h3 style="margin: 15px 0 5px 0; color: #1f2937;">${name}</h3>
                  <span style="font-family: monospace; font-weight: bold; color: #10b981; font-size: 14px;">${idStr}</span>
                </div>
                <div>
                  <span style="font-size: 11px; color: #4b5563; font-weight: bold;">Program: ${record.program?.title || 'Islamic & Standard Curriculum'}</span>
                  <div style="margin-top: 10px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 9px; color: #9ca3af;">
                    SYSTEM VERIFIED • SIS CORE ERP
                  </div>
                </div>
              </div>
              <script>window.onload = function() { window.print(); window.close(); };</script>
            </body>
            </html>
          `;
          printWindow.document.write(html);
          printWindow.document.close();
        }
      },
      {
        id: 'toggle-status',
        label: 'Toggle Status',
        icon: <PauseCircle className="w-3.5 h-3.5" />,
        variant: 'secondary' as const,
        onClick: async (record: any) => {
          try {
            const currentStatus = record.enrollmentStatus || record.status || 'active';
            const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
            const id = record.documentId || record.id;
            await apiClient.put(`/students/${id}`, {
              data: { enrollmentStatus: nextStatus, status: nextStatus }
            });
            toast.success(`Student status updated to ${nextStatus}.`);
            setSelectedRow(null);
            loadStudents();
          } catch (err) {
            toast.error('Failed to toggle student status.');
          }
        }
      },
      {
        id: 'delete',
        label: 'Delete Student',
        icon: <Trash2 className="w-3.5 h-3.5" />,
        variant: 'danger' as const,
        onClick: (record: any) => {
          setSelectedRow(null);
          handleDelete(record);
        }
      }
    ];
  }, [locale]);

  return (
    <EnterpriseModuleShell
      title="Students Management & Academic Roster"
      description="Manage all enrolled students, admissions placements, academic progress records, and homeroom assignments with live Strapi S/4 data."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Students' }]}
      icon={<GraduationCap className="w-8 h-8" />}
      recordCount={students.length}
      recordLabel="Scholars"
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Roster</span>
          </button>
        </div>
      }
    >
      {/* Interactive KPI Cards */}
      <EnterpriseKPIDeck cards={kpiCards} isLoading={loading && students.length === 0} />

      {/* Roster Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search students by name, ID code, homeroom section, or parent contact..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadStudents}
        onPrint={handlePrint}
        onImport={() => setImportModalOpen(true)}
        onExport={() => setExportModalOpen(true)}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel="+ Register New Student"
        onCreate={handleOnboardOpen}
        customFilterNodes={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">All Genders</option>
              <option value="male">Male Scholars</option>
              <option value="female">Female Scholars</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">All Enrollment Statuses</option>
              <option value="active">Active Enrolled</option>
              <option value="pending">Pending Placement</option>
              <option value="suspended">Suspended / On Leave</option>
            </select>

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">All Academic Sections</option>
              {sections.map(s => (
                <option key={s.documentId || s.id} value={s.name || (s as any).sectionName || String(s.id)}>
                  {s.name || (s as any).sectionName}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Grid Table */}
      <EnterpriseDataGrid
        data={students}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row: any) => setSelectedRow(row)}
        onRowClick={(row: any) => setSelectedRow(row)}
        onRowEdit={(row: any) => handleEditOpen(row)}
        emptyStateProps={{
          title: 'No Scholars Found',
          description: 'No enrolled students exist matching your current search criteria or section filter.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: 'Enroll New Scholar',
          onCreate: handleOnboardOpen
        }}
      />

      {/* Slide-Out Profile Inspection Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow}
        category="student"
        quickActions={quickActions}
      />

      {/* ── REGISTER / EDIT STUDENT MODAL ────────────────────────────── */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white animate-slide-up text-xs">
            <button
              onClick={() => setOnboardModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer border-none bg-transparent"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
              {editingStudent ? 'Edit Student Profile' : 'Enroll New Student Scholar'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter student name..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Student ID Code</label>
                  <input
                    type="text"
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    placeholder="Enter student ID..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Gender</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Enrollment Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="active">Active Enrolled</option>
                    <option value="pending">Pending Placement</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    placeholder="Enter guardian name..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Parent Contact Phone</label>
                  <input
                    type="text"
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    placeholder="Enter parent contact..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Assigned Section / Class Homeroom</label>
                  <select
                    value={formSectionId}
                    onChange={(e) => setFormSectionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">No Section Assigned (Unplaced)</option>
                    {sections.map((sec) => (
                      <option key={sec.documentId || sec.id} value={sec.documentId || sec.id}>
                        {sec.name || (sec as any).sectionName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOnboardModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer border-none shadow-sm flex items-center gap-1.5"
                >
                  <span>{editingStudent ? 'Save Changes' : 'Confirm Registration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import / Export Modals */}
      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        entityType="student"
        onSuccess={loadStudents}
      />
      <BulkExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={students}
        entityType="student"
      />
    </EnterpriseModuleShell>
  );
}
