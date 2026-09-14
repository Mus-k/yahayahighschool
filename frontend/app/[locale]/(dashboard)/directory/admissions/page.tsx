'use client';

import React, { useState, useMemo } from 'react';
import {
  ScrollText, Search, Plus, CheckCircle2, XCircle, Clock, ArrowRight,
  UserPlus, FileText, Upload, Download, Eye, Shield, Award,
  GraduationCap, Calendar, Phone, Mail
} from 'lucide-react';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export interface AdmissionApplication {
  id: string;
  applicantName: string;
  gradeApplied: string;
  parentName: string;
  phone: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'interview' | 'rejected';
  score: string;
  hifzAssessment?: string;
}

export default function AdmissionsPage() {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [trackFilter, setTrackFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const sampleApplications: AdmissionApplication[] = [
    { id: 'APP-2026-089', applicantName: 'Zaid bin Harith', gradeApplied: 'Grade 5 (Hifz Track)', parentName: 'Harith bin Abu Bakr', phone: '+231-654-9988', submissionDate: '2026-07-14', status: 'pending', score: '88% Placement', hifzAssessment: 'Juz 1-3 Memorized (Pass)' },
    { id: 'APP-2026-088', applicantName: 'Aisha Al-Mansoor', gradeApplied: 'Grade 7 (Standard)', parentName: 'Dr. Tariq Al-Mansoor', phone: '+231-776-3322', submissionDate: '2026-07-12', status: 'approved', score: '94% Placement', hifzAssessment: 'Tajweed Oral (Exemplary)' },
    { id: 'APP-2026-087', applicantName: 'Bilal Camara', gradeApplied: 'Grade 3 (Hifz Track)', parentName: 'Ousmane Camara', phone: '+231-889-1122', submissionDate: '2026-07-10', status: 'interview', score: 'Pending Test', hifzAssessment: 'Scheduled July 20' },
    { id: 'APP-2026-086', applicantName: 'Khadija Sylla', gradeApplied: 'Grade 9 (Arabic Intensive)', parentName: 'Mamadou Sylla', phone: '+231-554-2211', submissionDate: '2026-07-08', status: 'approved', score: '91% Placement', hifzAssessment: 'Advanced Grammar Pass' },
    { id: 'APP-2026-085', applicantName: 'Yusuf Ibn Taymiyyah', gradeApplied: 'Grade 4 (Hifz Track)', parentName: 'Abdul-Aziz Taymiyyah', phone: '+231-998-4433', submissionDate: '2026-07-05', status: 'rejected', score: '62% Placement', hifzAssessment: 'Requires Preparatory Year' },
  ];

  const filteredApps = useMemo(() => {
    return sampleApplications.filter(a => {
      const matchQuery = !query || a.applicantName.toLowerCase().includes(query.toLowerCase()) || a.id.toLowerCase().includes(query.toLowerCase()) || a.parentName.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchTrack = trackFilter === 'all' || (trackFilter === 'hifz' ? a.gradeApplied.includes('Hifz') : !a.gradeApplied.includes('Hifz'));
      return matchQuery && matchStatus && matchTrack;
    });
  }, [query, statusFilter, trackFilter]);

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (trackFilter !== 'all' ? 1 : 0);

  const handleClearFilters = () => {
    setStatusFilter('all');
    setTrackFilter('all');
    setQuery('');
    toast.success('Admissions filters reset.');
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total',
      title: 'Total Applications (2026-27)',
      value: sampleApplications.length.toString(),
      subtitle: '▲ +18% higher than previous enrollment cycle',
      trendDirection: 'up',
      icon: <ScrollText className="w-5 h-5" />,
      badgeText: 'Admissions'
    },
    {
      id: 'pending',
      title: 'Pending Review & Scoring',
      value: sampleApplications.filter(a => a.status === 'pending').length.toString(),
      subtitle: 'Require placement test or committee evaluation',
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5" />,
      isActive: statusFilter === 'pending',
      onClick: () => {
        setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending');
        toast.info(statusFilter === 'pending' ? 'Showing all applications' : 'Filtered to Pending Review');
      }
    },
    {
      id: 'approved',
      title: 'Approved for Enrollment',
      value: sampleApplications.filter(a => a.status === 'approved').length.toString(),
      subtitle: 'Ready for 1-click SIS roster placement',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5" />,
      isActive: statusFilter === 'approved',
      onClick: () => {
        setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved');
        toast.info(statusFilter === 'approved' ? 'Showing all applications' : 'Filtered to Approved Applications');
      }
    },
    {
      id: 'interview',
      title: 'Scheduled Oral & Hifz Tests',
      value: sampleApplications.filter(a => a.status === 'interview').length.toString(),
      subtitle: 'Sheikh oral examinations in progress',
      trendDirection: 'up',
      icon: <Award className="w-5 h-5" />,
      isActive: statusFilter === 'interview',
      onClick: () => {
        setStatusFilter(statusFilter === 'interview' ? 'all' : 'interview');
        toast.info(statusFilter === 'interview' ? 'Showing all applications' : 'Filtered to Scheduled Interviews');
      }
    }
  ];

  const columns = useMemo<ColumnDef<AdmissionApplication, any>[]>(() => {
    return [
      {
        accessorKey: 'applicantName',
        header: 'App ID & Candidate Scholar',
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-black text-emerald-400 block">{app.id}</span>
              <p className="font-bold text-white group-hover:text-emerald-300 transition-colors text-xs sm:text-sm">
                {app.applicantName}
              </p>
            </div>
          );
        }
      },
      {
        accessorKey: 'gradeApplied',
        header: 'Program Track Applied',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <span className="font-semibold text-slate-200 block">{row.original.gradeApplied}</span>
            <span className="text-[11px] font-mono text-emerald-400 block">{row.original.score}</span>
          </div>
        )
      },
      {
        accessorKey: 'parentName',
        header: 'Guardian & Contact Phone',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-slate-300 block">{row.original.parentName}</span>
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-400 shrink-0" /> {row.original.phone}
            </span>
          </div>
        )
      },
      {
        accessorKey: 'hifzAssessment',
        header: 'Hifz / Oral Assessment',
        cell: ({ row }) => (
          <span className="text-xs text-slate-300 font-medium block truncate max-w-xs">
            {row.original.hifzAssessment || 'Standard Evaluation'}
          </span>
        )
      },
      {
        accessorKey: 'status',
        header: 'Committee Status',
        cell: ({ row }) => {
          const s = row.original.status;
          return <StatusBadge status={s === 'approved' ? 'active' : s === 'pending' || s === 'interview' ? 'pending' : 'suspended'} size="sm" />;
        }
      },
      {
        id: 'actions',
        header: 'Inspect / Enroll',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRow(row.original);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect</span>
          </button>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Admissions & Enrollment Portal"
      description="Review incoming candidate scholar applications, schedule Hifz oral placement interviews, score academic testing, and execute 1-click SIS roster placement."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Admissions Portal' }]}
      icon={<ScrollText className="w-8 h-8" />}
      recordCount={filteredApps.length}
      recordLabel="Applications"
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('New Candidate Application wizard opened.')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[3]" />
            <span>+ New Application</span>
          </button>
        </div>
      }
    >
      {/* Interactive Clickable KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search admissions by applicant scholar name, application ID, or guardian contact..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => toast.success('Admissions queue synchronized')}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel="+ Submit Application"
        onCreate={() => toast.info('Opened online prospective student application form.')}
        customFilterNodes={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter applications by status"
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-emerald-600 shadow-2xs"
            >
              <option value="all">All Committee Statuses</option>
              <option value="pending">Pending Evaluation</option>
              <option value="interview">Oral Interview Scheduled</option>
              <option value="approved">Approved for Enrollment</option>
              <option value="rejected">Not Accepted</option>
            </select>

            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              aria-label="Filter applications by track"
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-emerald-600 shadow-2xs"
            >
              <option value="all">All Curriculum Tracks</option>
              <option value="hifz">Hifz Intensive Track</option>
              <option value="general">Standard Academic Track</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredApps}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
        onRowClick={(row) => setSelectedRow(row)}
        onRowEdit={(row) => toast.info(`Opening application review scorecard for ${row.applicantName}`)}
        emptyStateProps={{
          title: 'No Applications Found',
          description: 'No student admission applications match your current search query or committee status filter.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: 'Submit Candidate Application',
          onCreate: () => toast.info('Opened application submission modal')
        }}
      />

      {/* Slide-Out Profile Inspection Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow ? {
          ...selectedRow,
          name: selectedRow.applicantName,
          id: selectedRow.id,
          role: `CANDIDATE SCHOLAR (${selectedRow.gradeApplied})`,
          status: selectedRow.status === 'approved' ? 'active' : 'pending',
          email: `${selectedRow.parentName} (${selectedRow.phone})`,
          balance: `Placement Score: ${selectedRow.score} | Assessment: ${selectedRow.hifzAssessment || 'Pending'}`
        } : null}
        category="admissions"
      />
    </EnterpriseModuleShell>
  );
}
