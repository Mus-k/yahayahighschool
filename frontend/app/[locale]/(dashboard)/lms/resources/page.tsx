/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Library, Plus, Search, Filter, RefreshCw, X, Upload, Download,
  FileText, Video, Music, Image, Archive, Link2, File, Eye,
  Edit2, Trash2, Share2, Tag, BookOpen, Users, Star, Clock,
  CheckCircle2, ExternalLink, Copy, FolderOpen, ChevronDown,
  Globe, Lock, AlignLeft, MoreVertical, Layers
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { uploadService } from '@/services/upload.service';
import { getResources } from '@/services/lms.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { toast } from 'sonner';
import type { AcademicResource } from '@/types/lms.types';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ResourceCategory = 'Document' | 'Video' | 'Audio' | 'Image' | 'Archive' | 'Link' | 'Other';
type ViewMode = 'grid' | 'list';

interface ResourceRecord {
  id: number | string;
  title: string;
  category: ResourceCategory;
  description?: string;
  version?: string;
  isShared: boolean;
  url?: string;
  fileUrl?: string;
  fileSize?: number;
  fileMime?: string;
  fileId?: number;
  subject?: string;
  subjectId?: number;
  section?: string;
  sectionId?: number;
  author?: string;
  authorId?: number;
  tags?: string[];
  downloadCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ResourceCategory, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  accept: string;
}> = {
  Document: {
    icon: <FileText className="w-5 h-5" />,
    color: 'text-sky-400',
    bgColor: 'bg-sky-950/40',
    borderColor: 'border-sky-800',
    label: 'Document',
    accept: '.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx',
  },
  Video: {
    icon: <Video className="w-5 h-5" />,
    color: 'text-rose-400',
    bgColor: 'bg-rose-950/40',
    borderColor: 'border-rose-800',
    label: 'Video',
    accept: '.mp4,.mov,.avi,.mkv,.webm',
  },
  Audio: {
    icon: <Music className="w-5 h-5" />,
    color: 'text-violet-400',
    bgColor: 'bg-violet-950/40',
    borderColor: 'border-violet-800',
    label: 'Audio',
    accept: '.mp3,.wav,.aac,.ogg,.m4a',
  },
  Image: {
    icon: <Image className="w-5 h-5" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/40',
    borderColor: 'border-amber-800',
    label: 'Image',
    accept: '.jpg,.jpeg,.png,.gif,.webp,.svg',
  },
  Archive: {
    icon: <Archive className="w-5 h-5" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-950/40',
    borderColor: 'border-orange-800',
    label: 'Archive',
    accept: '.zip,.rar,.7z,.tar,.gz',
  },
  Link: {
    icon: <Link2 className="w-5 h-5" />,
    color: 'text-teal-400',
    bgColor: 'bg-teal-950/40',
    borderColor: 'border-teal-800',
    label: 'Link',
    accept: '',
  },
  Other: {
    icon: <File className="w-5 h-5" />,
    color: 'text-slate-400',
    bgColor: 'bg-slate-800/40',
    borderColor: 'border-slate-700',
    label: 'Other',
    accept: '*',
  },
};

// Subject and Department options are fetched live from Strapi (see page state).

const CATEGORIES: ResourceCategory[] = ['Document', 'Video', 'Audio', 'Image', 'Archive', 'Link', 'Other'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CategoryIcon({ category, size = 'md' }: { category: ResourceCategory; size?: 'sm' | 'md' | 'lg' }) {
  const cfg = CATEGORY_CONFIG[category];
  const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' };
  const iconSizeMap = { sm: 'scale-75', md: '', lg: 'scale-125' };
  return (
    <div className={`${sizeMap[size]} rounded-xl flex items-center justify-center shrink-0 ${cfg.bgColor} border ${cfg.borderColor} ${cfg.color} ${iconSizeMap[size]}`}>
      {cfg.icon}
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onFiles,
  accept,
}: { onFiles: (files: File[]) => void; accept: string }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
        dragging
          ? 'border-emerald-400 bg-emerald-950/20'
          : 'border-slate-700 hover:border-slate-500 bg-slate-900/30'
      }`}
    >
      <Upload className={`w-8 h-8 transition-colors ${dragging ? 'text-emerald-400' : 'text-slate-500'}`} />
      <div className="text-center">
        <p className="text-sm font-bold text-slate-300">Drop files here or click to browse</p>
        <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, MP4, MP3, images, and more</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept || '*'}
        className="hidden"
        onChange={e => { const files = Array.from(e.target.files || []); if (files.length) onFiles(files); }}
      />
    </div>
  );
}

// ─── Resource Form Modal ──────────────────────────────────────────────────────

function ResourceFormModal({
  initial, subjects, sections, onSave, onClose,
}: {
  initial?: Partial<ResourceRecord>;
  subjects: { id: number; name: string }[];
  sections: { id: number; name: string }[];
  onSave: (data: Partial<ResourceRecord>, file?: File) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<ResourceRecord>>({
    title: '', category: 'Document', description: '',
    version: '1.0', isShared: true,
    subject: '',
    section: '',
    url: '', tags: [],
    ...initial,
  });
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const set = (k: keyof ResourceRecord, v: any) => setForm(p => ({ ...p, [k]: v }));
  const isLink = form.category === 'Link';
  const cfg = CATEGORY_CONFIG[form.category as ResourceCategory] || CATEGORY_CONFIG.Other;

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags?.includes(tag)) setForm(p => ({ ...p, tags: [...(p.tags || []), tag] }));
    setTagInput('');
  };

  const handleFiles = (files: File[]) => {
    setSelectedFile(files[0]);
    if (!form.title) set('title', files[0].name.replace(/\.[^/.]+$/, ''));
    // Auto-detect category
    const mime = files[0].type;
    if (mime.startsWith('video/')) set('category', 'Video');
    else if (mime.startsWith('audio/')) set('category', 'Audio');
    else if (mime.startsWith('image/')) set('category', 'Image');
    else if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar')) set('category', 'Archive');
    else set('category', 'Document');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) { toast.error('Title is required'); return; }
    if (isLink && !form.url?.trim()) { toast.error('URL is required for Link resources'); return; }
    setSaving(true);
    try {
      await onSave(form, selectedFile);
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="font-black text-white text-base">{initial?.id ? 'Edit Resource' : 'Upload New Resource'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add to the school's shared resource library</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {/* Category chips */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Resource Type</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const c = CATEGORY_CONFIG[cat];
                return (
                  <button type="button" key={cat}
                    onClick={() => set('category', cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      form.category === cat
                        ? `${c.bgColor} ${c.borderColor} ${c.color}`
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}>
                    {c.icon} {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* File upload zone (hidden for Link) */}
          {!isLink && !initial?.id && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">File Upload</label>
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400">{formatBytes(selectedFile.size)}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(undefined)}
                    className="text-slate-400 hover:text-rose-400 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <UploadZone onFiles={handleFiles} accept={cfg.accept} />
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-[10px] text-emerald-400 font-bold">{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>
          )}

          {/* URL field for Link type */}
          {isLink && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider">External URL *</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="url" value={form.url} onChange={e => set('url', e.target.value)}
                  placeholder="https://example.com/resource"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-400" />
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required
              placeholder="Descriptive title for the resource..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              placeholder="Brief description of the resource content..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400 resize-none" />
          </div>

          {/* Subject / Academic Section / Version */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Subject</label>
              <select value={form.subject} onChange={e => set('subject', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                <option value="">— Select subject —</option>
                {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Academic Section</label>
              <select value={form.section} onChange={e => set('section', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400">
                <option value="">— Select section —</option>
                {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Version</label>
              <input value={form.version} onChange={e => set('version', e.target.value)} placeholder="1.0"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-400" />
            </div>
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex-1">
              <p className="text-xs font-bold text-white">Visibility</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {form.isShared ? 'Shared with all students and teachers in the relevant class' : 'Private — only visible to teachers and administrators'}
              </p>
            </div>
            <div className="flex rounded-xl overflow-hidden border border-slate-700">
              <button type="button" onClick={() => set('isShared', true)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                  form.isShared ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}>
                <Globe className="w-3.5 h-3.5" /> Public
              </button>
              <button type="button" onClick={() => set('isShared', false)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                  !form.isShared ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}>
                <Lock className="w-3.5 h-3.5" /> Private
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tags</label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag and press Enter..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400" />
              <button type="button" onClick={addTag}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer">
                Add
              </button>
            </div>
            {(form.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags?.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-400 text-[10px] font-bold">
                    <Tag className="w-3 h-3" /> {tag}
                    <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags?.filter(t => t !== tag) }))}
                      className="hover:text-rose-400 cursor-pointer ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-800 shrink-0 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSubmit as any} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50">
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {uploadProgress > 0 ? `Uploading ${uploadProgress}%...` : 'Saving...'}
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                {initial?.id ? 'Update Resource' : 'Upload Resource'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Resource Detail Modal ────────────────────────────────────────────────────

function ResourceDetailModal({ resource, onClose, onEdit, onDelete }: {
  resource: ResourceRecord;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cfg = CATEGORY_CONFIG[resource.category];

  const handleDownload = () => {
    if (resource.url) { window.open(resource.url, '_blank'); return; }
    if (resource.fileUrl) { window.open(resource.fileUrl, '_blank'); return; }
    toast.info('File preview not available — contact the uploader');
  };

  const handleCopyLink = () => {
    const link = resource.url || resource.fileUrl || '';
    if (link) { navigator.clipboard.writeText(link); toast.success('Link copied to clipboard'); }
    else toast.info('No direct link available for this resource');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 shrink-0 flex items-start gap-4">
          <CategoryIcon category={resource.category} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`}>
                {resource.category}
              </span>
              {!resource.isShared && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black border bg-amber-950/40 border-amber-800 text-amber-400 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Private
                </span>
              )}
            </div>
            <h2 className="font-black text-white text-sm leading-snug">{resource.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {/* Description */}
          {resource.description && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1"><AlignLeft className="w-3 h-3" /> Description</p>
              <p className="text-xs text-slate-300 leading-relaxed">{resource.description}</p>
            </div>
          )}

          {/* External URL */}
          {resource.url && (
            <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-800/40">
              <p className="text-[10px] font-bold text-teal-400 uppercase mb-1.5 flex items-center gap-1"><Link2 className="w-3 h-3" /> External Link</p>
              <a href={resource.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-teal-300 font-semibold hover:text-teal-200 underline break-all flex items-center gap-1">
                {resource.url} <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Subject', value: resource.subject || '—', icon: <BookOpen className="w-3 h-3" /> },
              { label: 'Academic Section', value: resource.section || '—', icon: <Layers className="w-3 h-3" /> },
              { label: 'Author', value: resource.author || '—', icon: <Users className="w-3 h-3" /> },
              { label: 'Version', value: resource.version ? `v${resource.version}` : '—', icon: <Layers className="w-3 h-3" /> },
              { label: 'File Size', value: formatBytes(resource.fileSize) || '—', icon: <File className="w-3 h-3" /> },
              { label: 'Downloads', value: `${resource.downloadCount ?? 0} times`, icon: <Download className="w-3 h-3" /> },
              { label: 'Uploaded', value: formatDate(resource.createdAt), icon: <Clock className="w-3 h-3" /> },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">{item.icon} {item.label}</p>
                <p className="text-xs font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-400 text-[10px] font-bold">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800 shrink-0 flex items-center gap-2 flex-wrap">
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg cursor-pointer transition-all">
            {resource.category === 'Link' ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            {resource.category === 'Link' ? 'Open Link' : 'Download'}
          </button>
          <button onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-all">
            <Copy className="w-3.5 h-3.5" /> Copy Link
          </button>
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-all">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-400 hover:bg-rose-950/60 text-xs font-bold cursor-pointer transition-all ml-auto">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Resource Card (Grid) ─────────────────────────────────────────────────────

function ResourceCard({ resource, onView, onEdit, onDelete }: {
  resource: ResourceRecord;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cfg = CATEGORY_CONFIG[resource.category];

  return (
    <div
      onClick={onView}
      className="group bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-all cursor-pointer"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <CategoryIcon category={resource.category} size="md" />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 cursor-pointer" title="Edit">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1 flex-1">
        <p className="text-sm font-bold text-white line-clamp-2 leading-snug">{resource.title}</p>
        {resource.description && (
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{resource.description}</p>
        )}
      </div>

      {/* Footer badges */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`}>
            {resource.category}
          </span>
          {!resource.isShared && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black border bg-amber-950/40 border-amber-800 text-amber-400 flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" /> Private
            </span>
          )}
          {resource.subject && (
            <span className="text-[9px] text-slate-500 font-semibold">{resource.subject}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          {resource.fileSize && <span>{formatBytes(resource.fileSize)}</span>}
          <span className="flex items-center gap-0.5"><Download className="w-3 h-3" /> {resource.downloadCount ?? 0}</span>
        </div>
      </div>

      {/* Tags */}
      {resource.tags && resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 border-t border-slate-800 pt-2">
          {resource.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-950/40 border border-indigo-900 text-indigo-400">
              #{tag}
            </span>
          ))}
          {resource.tags.length > 3 && (
            <span className="text-[9px] text-slate-500 font-bold">+{resource.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ResourceLibraryPage() {
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Dynamic options from Strapi
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: number; name: string }[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<ResourceCategory | 'All'>('All');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterShared, setFilterShared] = useState<'all' | 'public' | 'private'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceRecord | undefined>();
  const [viewingResource, setViewingResource] = useState<ResourceRecord | undefined>();

  // ─── Load Options (Subjects + Academic Sections) ──────────────────────────

  const loadOptions = useCallback(async () => {
    try {
      const [subRes, secRes] = await Promise.allSettled([
        apiClient.get('/subjects?fields[0]=name&pagination[limit]=200&sort=name:asc'),
        apiClient.get('/sections?fields[0]=name&pagination[limit]=100&sort=name:asc'),
      ]);

      if (subRes.status === 'fulfilled') {
        const items = subRes.value.data?.data || [];
        setSubjects(items.map((s: any) => ({ id: s.id, name: s.name })));
      }

      if (secRes.status === 'fulfilled') {
        const items = secRes.value.data?.data || [];
        setSections(items.map((s: any) => ({ id: s.id, name: s.name })));
      }
    } catch {
      // Non-critical
    }
  }, []);

  // ─── Load ────────────────────────────────────────────────────────────────

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getResources();
      const items: any[] = res?.data || [];
      setResources(items.map((r: any) => {
        const fileObj = r.file?.data || r.file;
        const fileUrl = fileObj?.attributes?.url || fileObj?.url;
        const fileSize = fileObj?.attributes?.size || fileObj?.size;
        const fileMime = fileObj?.attributes?.mime || fileObj?.mime;
        const fileId = r.file?.data?.id || r.file?.id;

        return {
          id: r.id,
          title: r.title || 'Untitled Resource',
          category: r.category || 'Document',
          description: r.description,
          version: r.version,
          isShared: r.isShared ?? true,
          url: r.url,
          fileUrl: fileUrl ? uploadService.getFileUrl(fileUrl) : undefined,
          fileSize: fileSize ? fileSize * 1000 : undefined, // Convert KB/bytes correctly if needed (Strapi size is in KB)
          fileMime,
          fileId,
          subject: r.subject?.data?.name || r.subject?.name,
          subjectId: r.subject?.data?.id || r.subject?.id,
          section: r.section?.data?.name || r.section?.name,
          sectionId: r.section?.data?.id || r.section?.id,
          author: r.author?.data
            ? `${r.author.data.firstName || ''} ${r.author.data.lastName || ''}`.trim()
            : r.author?.name,
          authorId: r.author?.data?.id || r.author?.id,
          tags: Array.isArray(r.tags) ? r.tags : [],
          downloadCount: r.downloadCount || 0,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      }));
    } catch (err: any) {
      console.error("Error loading academic resources:", err);
      toast.error("Failed to load resources: " + (err.response?.data?.error?.message || err.message || err));
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
    loadOptions();
  }, [loadResources, loadOptions]);


  // ─── Filtered ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => resources.filter(r => {
    if (filterCategory !== 'All' && r.category !== filterCategory) return false;
    if (filterSubject && r.subject !== filterSubject) return false;
    if (filterSection && r.section !== filterSection) return false;
    if (filterShared === 'public' && !r.isShared) return false;
    if (filterShared === 'private' && r.isShared) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.subject || '').toLowerCase().includes(q) ||
        (r.author || '').toLowerCase().includes(q) ||
        (r.tags || []).some(t => t.includes(q));
    }
    return true;
  }), [resources, filterCategory, filterSubject, filterSection, filterShared, search]);

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: resources.length,
    shared: resources.filter(r => r.isShared).length,
    byCategory: CATEGORIES.reduce<Record<string, number>>((acc, c) => {
      acc[c] = resources.filter(r => r.category === c).length;
      return acc;
    }, {}),
    totalDownloads: resources.reduce((sum, r) => sum + (r.downloadCount || 0), 0),
    subjects: [...new Set(resources.map(r => r.subject).filter(Boolean))].length,
  }), [resources]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const handleSave = async (data: Partial<ResourceRecord>, file?: File) => {
    try {
      let fileId: number | undefined;

      // Upload file first if provided
      if (file) {
        try {
          const uploaded = await uploadService.uploadFile(file, { ref: 'api::academic-resource.academic-resource', field: 'file' });
          fileId = uploaded.id;
        } catch {
          toast.warning('File upload failed — resource saved without file attachment');
        }
      }

      const matchedSubject = subjects.find(s => s.name === data.subject);
      const matchedSection = sections.find(s => s.name === data.section);

      const payload: any = {
        title: data.title,
        category: data.category,
        description: data.description,
        version: data.version,
        isShared: data.isShared,
        url: data.url || null,
        tags: data.tags || [],
        subject: matchedSubject ? matchedSubject.id : null,
        section: matchedSection ? matchedSection.id : null,
      };
      if (fileId) payload.file = fileId;

      if (editingResource) {
        await apiClient.put(`/academic-resources/${editingResource.id}`, { data: payload });
        setResources(prev => prev.map(r => r.id === editingResource.id ? {
          ...r, ...data,
          fileUrl: fileId ? URL.createObjectURL(file!) : r.fileUrl,
          updatedAt: new Date().toISOString(),
        } : r));
        toast.success('Resource updated');
      } else {
        let newId: string | number = `local_${Date.now()}`;
        const res = await apiClient.post('/academic-resources', { data: payload });
        if (res.data?.data?.id) newId = res.data.data.id;
        
        setResources(prev => [{
          id: newId,
          title: data.title || '',
          category: data.category || 'Document',
          description: data.description,
          version: data.version || '1.0',
          isShared: data.isShared ?? true,
          url: data.url,
          fileUrl: file ? URL.createObjectURL(file) : undefined,
          fileSize: file?.size,
          fileMime: file?.type,
          fileId,
          subject: data.subject,
          section: data.section,
          tags: data.tags || [],
          downloadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, ...prev]);
        toast.success('Resource uploaded to library');
      }

      setShowForm(false);
      setEditingResource(undefined);
    } catch (err: any) {
      console.error("Error saving resource:", err);
      toast.error("Failed to save resource: " + (err.response?.data?.error?.message || err.message || err));
    }
  };

  const handleDelete = async (resource: ResourceRecord) => {
    try { await apiClient.delete(`/academic-resources/${resource.id}`); } catch { /* offline */ }
    setResources(prev => prev.filter(r => r.id !== resource.id));
    setViewingResource(undefined);
    toast.success('Resource removed from library');
  };

  const handleExport = () => {
    const lines = [
      'Title,Category,Subject,Author,Shared,Downloads,Version,Created',
      ...filtered.map(r =>
        `"${r.title}","${r.category}","${r.subject || ''}","${r.author || ''}","${r.isShared}","${r.downloadCount || 0}","${r.version || ''}","${formatDate(r.createdAt)}"`
      ),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'resource_library.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('Resource catalogue exported');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Resource Library"
        description="Central repository for academic materials — documents, videos, audio lectures, images, and external links for all subjects."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={loadResources} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => { setEditingResource(undefined); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Upload Resource
          </button>
        </div>
      </PageHeader>

      <div className="space-y-6">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Total Resources</p>
            <p className="text-2xl font-black text-foreground font-mono">{stats.total}</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Shared</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{stats.shared}</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Total Downloads</p>
            <p className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">{stats.totalDownloads}</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Subjects Covered</p>
            <p className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">{stats.subjects}</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border space-y-1 col-span-2 sm:col-span-1">
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Documents</p>
            <p className="text-2xl font-black text-foreground font-mono">{stats.byCategory['Document'] || 0}</p>
          </div>
        </div>

        {/* ── Category Filter Chips ── */}
        <div className="flex flex-wrap gap-2">
          {(['All', ...CATEGORIES] as const).map(cat => {
            const cfg = cat !== 'All' ? CATEGORY_CONFIG[cat] : null;
            const count = cat === 'All' ? resources.length : (stats.byCategory[cat] || 0);
            return (
              <button key={cat} onClick={() => setFilterCategory(cat as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  filterCategory === cat
                    ? cfg
                      ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`
                      : 'bg-primary/10 border-primary text-primary'
                    : 'bg-card border-border text-muted-foreground hover:border-slate-400 hover:text-foreground'
                }`}>
                {cfg && <span className={cfg.color}>{cfg.icon}</span>}
                {cat === 'All' ? <Library className="w-3.5 h-3.5" /> : null}
                {cat} <span className="font-mono text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, subject, author, or tag..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs placeholder-muted-foreground focus:outline-none focus:border-primary" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowFilters(p => !p)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showFilters ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}>
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>
              <div className="flex rounded-xl overflow-hidden border border-border">
                {([
                  { mode: 'grid' as ViewMode, icon: <FolderOpen className="w-3.5 h-3.5" /> },
                  { mode: 'list' as ViewMode, icon: <AlignLeft className="w-3.5 h-3.5" /> },
                ]).map(v => (
                  <button key={v.mode} onClick={() => setViewMode(v.mode)}
                    className={`px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      viewMode === v.mode ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
                    }`}>
                    {v.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-bold uppercase">Subject</label>
                <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary">
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-bold uppercase">Academic Section</label>
                <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary">
                  <option value="">All Sections</option>
                  {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-bold uppercase">Visibility</label>
                <select value={filterShared} onChange={e => setFilterShared(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary">
                  <option value="all">All Resources</option>
                  <option value="public">Public Only</option>
                  <option value="private">Private Only</option>
                </select>
              </div>
              <button onClick={() => { setFilterSubject(''); setFilterSection(''); setFilterShared('all'); setSearch(''); }}
                className="mt-4 px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer hover:bg-muted transition-colors">
                Clear
              </button>
            </div>
          )}
        </div>

        {/* ── Results count ── */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground">
            {loading ? 'Loading resources...' : `${filtered.length} resource${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl bg-card">
            <Library className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-bold text-muted-foreground">No resources found</p>
            <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Try adjusting filters or upload a new resource</p>
            <button onClick={() => { setEditingResource(undefined); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer">
              <Plus className="w-4 h-4" /> Upload First Resource
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(r => (
              <ResourceCard
                key={r.id}
                resource={r}
                onView={() => setViewingResource(r)}
                onEdit={() => { setEditingResource(r); setShowForm(true); }}
                onDelete={() => handleDelete(r)}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-extrabold border-b border-border">
                <tr>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3 text-center">Downloads</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(r => {
                  const cfg = CATEGORY_CONFIG[r.category];
                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => setViewingResource(r)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <CategoryIcon category={r.category} size="sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate max-w-[220px]">{r.title}</p>
                            {!r.isShared && (
                              <span className="text-[9px] text-amber-500 font-black flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Private</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`}>
                          {r.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.subject || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.author || '—'}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-foreground">{r.downloadCount ?? 0}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setViewingResource(r)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setEditingResource(r); setShowForm(true); }}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-emerald-600 cursor-pointer" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(r)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-rose-500 cursor-pointer" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ── Modals ── */}
      {showForm && (
        <ResourceFormModal
          initial={editingResource}
          subjects={subjects}
          sections={sections}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingResource(undefined); }}
        />
      )}
      {viewingResource && (
        <ResourceDetailModal
          resource={viewingResource}
          onClose={() => setViewingResource(undefined)}
          onEdit={() => { setEditingResource(viewingResource); setViewingResource(undefined); setShowForm(true); }}
          onDelete={() => handleDelete(viewingResource)}
        />
      )}
    </PageContainer>
  );
}
