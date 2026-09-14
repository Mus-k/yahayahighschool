'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  Clipboard, Phone, Mail, MapPin, ArrowLeft, Printer, RefreshCw,
  AlertTriangle, Briefcase, FileText
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { Worker } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { RelationshipChip } from '@/components/erp/RelationshipChip';
import { getStrapiMediaUrl } from '@/services/cms.service';

export default function WorkerProfilePage() {
  const params = useParams();
  const idOrDocumentId = params?.id as string;
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idOrDocumentId) return;
    async function loadWorker() {
      setLoading(true);
      try {
        const data = await erpService.getWorkerById(idOrDocumentId);
        setWorker(data);
      } catch (err) {
        console.error('Failed loading worker profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorker();
  }, [idOrDocumentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
        <span className="text-sm font-semibold">Loading Staff Profile...</span>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center rounded-2xl border border-slate-800 bg-slate-900/60 my-12">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-100">Staff Profile Not Found</h2>
        <Link href="/workers" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs">
          <ArrowLeft className="w-4 h-4" /> Return to Staff Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <Link href="/workers" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-4 h-4 text-sky-400" /> Back to Staff Registry
        </Link>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold">
          <Printer className="w-3.5 h-3.5" /> Print Staff Dossier
        </button>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono text-xs font-bold">
            {worker.schoolId || `#WRK-${worker.id}`}
          </span>
          <StatusBadge status={worker.employmentStatus} size="md" />
          {worker.salaryGrade && (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-bold">
              Grade: {worker.salaryGrade}
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-white">{worker.name}</h1>
        <p className="text-sm font-bold text-sky-400 mt-1">{worker.role}</p>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-mono"><Phone className="w-3.5 h-3.5 text-sky-400" /> {worker.phone}</span>
          {worker.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-sky-400" /> {worker.email}</span>}
          {worker.employmentDate && <span>Joined: <strong className="font-mono">{new Date(worker.employmentDate).toLocaleDateString()}</strong></span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-sky-400" />
              <span>Operational Department & Role Scope</span>
            </h3>
            {worker.departments && worker.departments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {worker.departments.map((d: any) => (
                  <RelationshipChip key={d.id} type="department" label={d.name} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">General Administrative / Campus Operations Staff</p>
            )}

            <div className="pt-4 text-xs text-slate-300 leading-relaxed">
              Assigned to active school operational tasks and departmental support. Reporting to Campus Administration.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" />
              <span>Employment Contracts & Documents</span>
            </h3>
            {worker.documents && worker.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {worker.documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={getStrapiMediaUrl(doc) || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 flex items-center gap-3 transition-all text-xs"
                  >
                    <FileText className="w-6 h-6 text-sky-400 flex-shrink-0" />
                    <span className="truncate font-bold text-slate-200">{doc.name || `Document #${idx + 1}`}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-6 text-center">No staff documents attached.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4 text-xs font-mono">
          <h3 className="text-base font-bold text-slate-100 font-sans border-b border-slate-800 pb-3">Emergency & Address</h3>
          <div>
            <span className="text-slate-500 font-semibold font-sans block mb-1">Residential Address:</span>
            <p className="text-slate-300">{worker.address || 'Address not provided'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-semibold font-sans block mb-1">Emergency Contact:</span>
            <p className="text-slate-300">{worker.emergencyContact || 'Contact Administration'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
