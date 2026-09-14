'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  Users, Phone, Mail, MapPin, ArrowLeft, Printer, RefreshCw,
  AlertTriangle, GraduationCap, Briefcase
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { Parent } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';

export default function ParentProfilePage() {
  const params = useParams();
  const idOrDocumentId = params?.id as string;
  const [parent, setParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idOrDocumentId) return;
    async function loadParent() {
      setLoading(true);
      try {
        const data = await erpService.getParentById(idOrDocumentId);
        setParent(data);
      } catch (err) {
        console.error('Failed loading parent profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadParent();
  }, [idOrDocumentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-sm font-semibold">Loading Guardian Profile & Children...</span>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center rounded-2xl border border-slate-800 bg-slate-900/60 my-12">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-100">Parent Profile Not Found</h2>
        <Link href="/parents" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">
          <ArrowLeft className="w-4 h-4" /> Return to Parents Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <Link href="/parents" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-4 h-4 text-purple-400" /> Back to Parents Registry
        </Link>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold">
          <Printer className="w-3.5 h-3.5" /> Print Dossier
        </button>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono text-xs font-bold uppercase">
            {parent.relationship}
          </span>
          {parent.preferredLanguage && (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] uppercase font-mono">
              Language: {parent.preferredLanguage}
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-white">{parent.name}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-mono"><Phone className="w-3.5 h-3.5 text-purple-400" /> {parent.phone}</span>
          {parent.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-purple-400" /> {parent.email}</span>}
          {parent.occupation && <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-purple-400" /> {parent.occupation} ({parent.employer || 'Self'})</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <span>Linked Enrolled Children (SIS Profiles)</span>
          </h3>
          {parent.children && parent.children.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parent.children.map((ch: any) => (
                <Link
                  key={ch.id}
                  href={`/students/${ch.documentId || ch.id}`}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-400 text-xs">{ch.schoolId || `#ST-${ch.id}`}</span>
                    <StatusBadge status={ch.status} size="sm" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-white">{ch.firstName} {ch.lastName}</h4>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-8 text-center">No student record currently linked to this guardian ID.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4 text-xs">
          <h3 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-3">Demographics & Notes</h3>
          <div>
            <span className="text-slate-500 font-semibold block mb-1">Residential Address:</span>
            <p className="text-slate-300">{parent.address || 'Address not listed'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block mb-1">National ID / Passport:</span>
            <p className="font-mono text-slate-300">{parent.nationalId || parent.passport || 'N/A'}</p>
          </div>
          {parent.notes && (
            <div>
              <span className="text-slate-500 font-semibold block mb-1">Notes:</span>
              <p className="text-slate-400 leading-relaxed">{parent.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
