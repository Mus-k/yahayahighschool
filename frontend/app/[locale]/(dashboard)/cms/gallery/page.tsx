/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Image as ImageIcon, Plus, Eye, Trash2, Star, Search,
  Filter, X, RefreshCw, CheckCircle2, Video, Camera,
  Package, Grid, List, Upload, Edit3, Download, ChevronLeft,
  ChevronRight, ZoomIn, CheckSquare, Square, Layers
} from 'lucide-react';
import { cmsService, getStrapiMediaUrl } from '@/services/cms.service';
import { apiClient, uploadClient } from '@/services/api.service';
import type { GalleryItemEntity } from '@/types/cms.types';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const GALLERY_CATEGORIES = [
  'Graduation', 'Hifz Ceremony', 'Sports', 'Academic', 'Cultural',
  'Islamic Event', 'Campus Life', 'Parent Event', 'Competition', 'Other',
];

const PAGE_SIZE = 24;

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox slideshow for full screen viewing
// ─────────────────────────────────────────────────────────────────────────────

interface LightboxProps {
  items: GalleryItemEntity[];
  startIndex: number;
  onClose: () => void;
}

function Lightbox({ items, startIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const currentItem = items[index];
  const mediaUrl = currentItem ? getStrapiMediaUrl(currentItem.mediaFile) : null;

  const handlePrev = useCallback(() => {
    setIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const handleNext = useCallback(() => {
    setIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  if (!currentItem) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col justify-between animate-in fade-in duration-200" onClick={onClose}>
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent shrink-0 text-white" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${currentItem.mediaType === 'video' ? 'bg-violet-600' : 'bg-sky-600'}`}>
            {currentItem.mediaType}
          </span>
          {currentItem.category && (
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-medium">
              {currentItem.category}
            </span>
          )}
          {currentItem.isFeatured && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-current" /> Featured
            </span>
          )}
          <h3 className="text-sm font-bold truncate max-w-md hidden md:block ml-2">{currentItem.title}</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/60 font-mono">{index + 1} / {items.length}</span>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Center Media content */}
      <div className="flex-1 flex items-center justify-center relative px-12" onClick={e => e.stopPropagation()}>
        <button onClick={handlePrev} className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="max-w-5xl max-h-[75vh] flex items-center justify-center">
          {mediaUrl ? (
            currentItem.mediaType === 'video' ? (
              <video src={mediaUrl} controls autoPlay className="max-w-full max-h-[75vh] rounded-xl shadow-2xl" />
            ) : (
              <img src={mediaUrl} alt={currentItem.title} className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl" />
            )
          ) : (
            <div className="text-center text-white/50 p-8">
              <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm">No media file uploaded</p>
              <p className="text-xs opacity-60 mt-1">Upload a file using the edit drawer</p>
            </div>
          )}
        </div>

        <button onClick={handleNext} className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Info Section */}
      <div className="px-8 py-6 bg-gradient-to-t from-black/80 to-transparent shrink-0 text-white text-center" onClick={e => e.stopPropagation()}>
        <h4 className="text-base font-extrabold max-w-2xl mx-auto">{currentItem.title}</h4>
        {currentItem.caption && <p className="text-sm text-white/80 max-w-2xl mx-auto mt-1 font-medium">{currentItem.caption}</p>}
        {currentItem.description && <p className="text-xs text-white/50 max-w-2xl mx-auto mt-1.5 leading-relaxed">{currentItem.description}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Side Drawer
// ─────────────────────────────────────────────────────────────────────────────

interface EditDrawerProps {
  item: GalleryItemEntity;
  onClose: () => void;
  onSaved: () => void;
}

function EditDrawer({ item, onClose, onSaved }: EditDrawerProps) {
  const [form, setForm] = useState({
    title: item.title,
    caption: item.caption || '',
    description: item.description || '',
    category: item.category || '',
    isFeatured: item.isFeatured || false,
  });
  const [newFile, setNewFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMediaUrl = getStrapiMediaUrl(item.mediaFile);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setNewFile(f);
      if (f.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(f));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      let uploadedFileId: number | undefined;

      // If a new file is specified, upload it
      if (newFile) {
        const fd = new FormData();
        fd.append('files', newFile);
        fd.append('fileInfo', JSON.stringify({
          name: form.title,
          caption: form.caption || '',
          alternativeText: form.title,
        }));
        const uploadRes = await uploadClient.post('/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const fileObj = Array.isArray(uploadRes.data) ? uploadRes.data[0] : uploadRes.data;
        uploadedFileId = fileObj?.id;
      }

      const updateData: any = {
        title: form.title,
        caption: form.caption || null,
        description: form.description || null,
        category: form.category || null,
        isFeatured: form.isFeatured,
      };

      if (uploadedFileId !== undefined) {
        updateData.mediaFile = uploadedFileId;
      }

      await apiClient.put(`/gallery-items/${item.documentId || item.id}`, {
        data: updateData,
      });

      toast.success('Gallery item successfully updated');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || 'Failed to update gallery item');
    } finally {
      setSaving(false);
    }
  };

  const inpClass = 'w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-colors';
  const lblClass = 'text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1';

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-50 dark:bg-sky-950/40 rounded-xl">
            <Edit3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Edit Gallery Item</h3>
            <p className="text-[11px] text-slate-400">Update campus media properties</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 border-none cursor-pointer bg-transparent">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Thumbnail Preview Area */}
        <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center relative group">
          {filePreview ? (
            <img src={filePreview} alt="New Preview" className="w-full h-full object-cover" />
          ) : newFile ? (
            <div className="flex flex-col items-center text-slate-500 text-center p-4">
              <Video className="w-10 h-10 text-violet-500 mb-1" />
              <p className="text-xs font-bold truncate max-w-xs">{newFile.name}</p>
              <span className="text-[10px] opacity-60">Ready to upload</span>
            </div>
          ) : currentMediaUrl ? (
            item.mediaType === 'video' ? (
              <video src={currentMediaUrl} className="w-full h-full object-cover" muted />
            ) : (
              <img src={currentMediaUrl} alt={item.title} className="w-full h-full object-cover" />
            )
          ) : (
            <div className="text-center text-slate-400">
              <Camera className="w-8 h-8 mx-auto mb-1" />
              <p className="text-xs font-medium">No media uploaded</p>
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-slate-900 text-[11px] font-bold rounded-lg border-none shadow cursor-pointer hover:bg-slate-50 transition-colors"
            >
              Replace Media File
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
        </div>

        {newFile && (
          <div className="flex items-center justify-between p-2.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-xl text-xs">
            <span className="font-semibold text-sky-700 dark:text-sky-400 truncate max-w-[240px]">📎 {newFile.name}</span>
            <button type="button" onClick={() => { setNewFile(null); setFilePreview(null); }} className="text-rose-500 font-bold border-none bg-transparent cursor-pointer hover:underline">Remove</button>
          </div>
        )}

        <div>
          <label className={lblClass}>Title *</label>
          <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inpClass} />
        </div>

        <div>
          <label className={lblClass}>Caption</label>
          <input type="text" value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="Brief summary for overlays" className={inpClass} />
        </div>

        <div>
          <label className={lblClass}>Description</label>
          <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed text for accessibility and search" className={inpClass} />
        </div>

        <div>
          <label className={lblClass}>Category</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inpClass}>
            <option value="">— Uncategorized —</option>
            {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
          <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer" />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> Highlight as Featured
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">Places this item inside priority feeds and home widgets</p>
          </div>
        </label>
      </form>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer border-none transition-colors disabled:opacity-60"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {saving ? 'Updating...' : 'Save Updates'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer border-none hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Media Modal
// ─────────────────────────────────────────────────────────────────────────────

interface AddMediaModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function AddMediaModal({ onClose, onSaved }: AddMediaModalProps) {
  const [form, setForm] = useState({
    title: '',
    caption: '',
    description: '',
    category: '',
    mediaType: 'photo' as 'photo' | 'video',
    isFeatured: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
    // Pre-populate title from filename if empty
    if (!form.title) {
      setForm(prev => ({
        ...prev,
        title: f.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
        mediaType: f.type.startsWith('video/') ? 'video' : 'photo',
      }));
    } else {
      setForm(prev => ({
        ...prev,
        mediaType: f.type.startsWith('video/') ? 'video' : 'photo',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      let mediaFileId: number | undefined;

      // 1. Upload the media file to Strapi v5 if one was selected
      if (file) {
        const fd = new FormData();
        fd.append('files', file);
        fd.append('fileInfo', JSON.stringify({
          name: form.title,
          caption: form.caption || '',
          alternativeText: form.title,
        }));
        const uploadRes = await uploadClient.post('/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const responseData = Array.isArray(uploadRes.data) ? uploadRes.data[0] : uploadRes.data;
        mediaFileId = responseData?.id;
      }

      // 2. Submit record to gallery-items endpoint
      await apiClient.post('/gallery-items', {
        data: {
          title: form.title,
          caption: form.caption || undefined,
          description: form.description || undefined,
          category: form.category || undefined,
          mediaType: form.mediaType,
          isFeatured: form.isFeatured,
          ...(mediaFileId !== undefined ? { mediaFile: mediaFileId } : {}),
        },
      });

      toast.success(file ? 'Media uploaded and item created!' : 'Gallery entry created successfully');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error?.message || 'Failed to create gallery item');
    } finally {
      setSaving(false);
    }
  };

  const inpClass = 'w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-colors';
  const lblClass = 'text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl max-h-[94vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/40 rounded-xl">
              <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm">Add Gallery Item</h2>
              <p className="text-[11px] text-slate-400">Register new media with live server upload</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 border-none cursor-pointer bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          {/* File Upload Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-600 rounded-2xl p-6 text-center cursor-pointer transition-colors group relative bg-slate-50/50 dark:bg-slate-900/30"
          >
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
            
            {preview ? (
              <img src={preview} alt="File Preview" className="h-32 mx-auto rounded-xl object-contain shadow" />
            ) : file ? (
              <div className="flex flex-col items-center text-slate-500 py-3">
                <Video className="w-12 h-12 text-violet-500 mb-2" />
                <p className="text-xs font-bold truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-400 py-4">
                <Upload className="w-8 h-8 text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click or drag files here to select</p>
                <p className="text-[10px] text-slate-400 mt-1">Supports image/jpeg, image/png, video/mp4</p>
              </div>
            )}

            {file && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full border-none cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <label className={lblClass}>Title *</label>
            <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Mosque Architecture & Facilities" className={inpClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lblClass}>Media Type</label>
              <select value={form.mediaType} onChange={e => setForm(f => ({ ...f, mediaType: e.target.value as any }))} className={inpClass}>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className={lblClass}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inpClass}>
                <option value="">— Uncategorized —</option>
                {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lblClass}>Caption</label>
            <input type="text" value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="Brief details for overlays" className={inpClass} />
          </div>

          <div>
            <label className={lblClass}>Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Full alternative text and details..." className={inpClass} />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
            <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer" />
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Set as Featured</span>
              <p className="text-[10px] text-slate-400">Promotes this item inside home headers and carousel cards</p>
            </div>
          </label>

          <div className="flex justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer border-none transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer border-none transition-colors disabled:opacity-60">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {saving ? 'Creating Item...' : file ? 'Upload & Create' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Gallery Module Component
// ─────────────────────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItemEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState<'' | 'photo' | 'video'>('');
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Selection / Bulk State
  const [selectedItems, setSelectedItems] = useState<Set<number | string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Drawers State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<GalleryItemEntity | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cmsService.getGalleryItems('en', 500);
      setItems(data);
    } catch {
      toast.error('Failed to load gallery items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Reset page pagination index on filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, filterCategory, filterType, filterFeatured]);

  // ─── Individual Actions ───────────────────────────────────────────────────

  const handleDelete = async (item: GalleryItemEntity) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;
    try {
      await apiClient.delete(`/gallery-items/${item.documentId || item.id}`);
      toast.success('Gallery item deleted successfully');
      loadItems();
    } catch {
      toast.error('Failed to delete gallery item');
    }
  };

  const handleToggleFeatured = async (item: GalleryItemEntity) => {
    try {
      await apiClient.put(`/gallery-items/${item.documentId || item.id}`, {
        data: { isFeatured: !item.isFeatured },
      });
      toast.success(item.isFeatured ? 'Removed from featured list' : 'Marked as featured item');
      loadItems();
    } catch {
      toast.error('Failed to update featured setting');
    }
  };

  // ─── Bulk Actions ──────────────────────────────────────────────────────────

  const toggleSelectItem = (id: number | string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedItems(new Set(filteredItems.map(i => i.id)));
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
    setBulkMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Delete ${selectedItems.size} selected gallery items? This cannot be undone.`)) return;

    let failedCount = 0;
    for (const id of selectedItems) {
      try {
        const item = items.find(i => i.id === id);
        if (item) {
          await apiClient.delete(`/gallery-items/${item.documentId || id}`);
        }
      } catch {
        failedCount++;
      }
    }

    if (failedCount > 0) {
      toast.error(`Deleted with ${failedCount} failure(s)`);
    } else {
      toast.success(`Successfully deleted ${selectedItems.size} item(s)`);
    }
    setSelectedItems(new Set());
    setBulkMode(false);
    loadItems();
  };

  const handleBulkSetFeatured = async (featured: boolean) => {
    if (selectedItems.size === 0) return;

    let failedCount = 0;
    for (const id of selectedItems) {
      try {
        const item = items.find(i => i.id === id);
        if (item) {
          await apiClient.put(`/gallery-items/${item.documentId || id}`, {
            data: { isFeatured: featured },
          });
        }
      } catch {
        failedCount++;
      }
    }

    if (failedCount > 0) {
      toast.error(`Updated with ${failedCount} failure(s)`);
    } else {
      toast.success(`Updated status for ${selectedItems.size} item(s)`);
    }
    setSelectedItems(new Set());
    setBulkMode(false);
    loadItems();
  };

  // ─── Filter Calculations ────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    let result = items;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q) ||
        (i.caption || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      result = result.filter(i => i.category === filterCategory);
    }
    if (filterType) {
      result = result.filter(i => i.mediaType === filterType);
    }
    if (filterFeatured) {
      result = result.filter(i => i.isFeatured);
    }
    return result;
  }, [items, query, filterCategory, filterType, filterFeatured]);

  const paginatedItems = useMemo(() => {
    return filteredItems.slice(0, currentPage * PAGE_SIZE);
  }, [filteredItems, currentPage]);

  const hasMoreItems = paginatedItems.length < filteredItems.length;

  // ─── Stats and Categories counters ─────────────────────────────────────────

  const stats = useMemo(() => ({
    total: items.length,
    photos: items.filter(i => i.mediaType === 'photo').length,
    videos: items.filter(i => i.mediaType === 'video').length,
    featured: items.filter(i => i.isFeatured).length,
  }), [items]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(i => {
      const cat = i.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [items]);

  const activeFiltersCount = [filterCategory, filterType, filterFeatured].filter(Boolean).length;

  // ─── CSV Exporter ──────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Media Type', 'Category', 'Caption', 'Featured'];
    const rows = filteredItems.map(i => [
      i.id,
      i.title,
      i.mediaType,
      i.category || '',
      i.caption || '',
      i.isFeatured ? 'Yes' : 'No',
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `yahaya_gallery_report_${new Date().toISOString().split('T')[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Gallery catalog exported to CSV');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-5 space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2.5 bg-sky-600 rounded-2xl shadow-lg shadow-sky-200 dark:shadow-sky-950/20">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Campus Photo Gallery</h1>
              <p className="text-xs text-slate-400 font-mono">Public Media Console</p>
            </div>
          </div>
          <p className="text-sm text-slate-505 dark:text-slate-400 ml-14">
            Upload, curate, and configure public assets, event albums, and showcase recordings.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={loadItems} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
          <button
            onClick={() => { setBulkMode(!bulkMode); setSelectedItems(new Set()); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${bulkMode ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Layers className="w-3.5 h-3.5" /> Bulk Operations
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-200 dark:shadow-sky-950/20 cursor-pointer border-none transition-all">
            <Plus className="w-4 h-4" /> Add Media
          </button>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Files', value: stats.total, icon: <Package className="w-4 h-4 text-sky-600" />, bg: 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/20', filterTypeVal: '', filterFeaturedVal: false },
          { label: 'Photos', value: stats.photos, icon: <Camera className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/20', filterTypeVal: 'photo', filterFeaturedVal: false },
          { label: 'Videos', value: stats.videos, icon: <Video className="w-4 h-4 text-violet-600" />, bg: 'bg-violet-50/60 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/20', filterTypeVal: 'video', filterFeaturedVal: false },
          { label: 'Featured Showcase', value: stats.featured, icon: <Star className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/20', filterTypeVal: '', filterFeaturedVal: true },
        ].map((statCard, i) => {
          const isActive = statCard.filterFeaturedVal
            ? filterFeatured
            : filterType === statCard.filterTypeVal && !filterFeatured && statCard.filterTypeVal !== '';
          return (
            <button
              key={i}
              onClick={() => {
                if (statCard.filterFeaturedVal) {
                  setFilterFeatured(!filterFeatured);
                  setFilterType('');
                } else {
                  setFilterFeatured(false);
                  setFilterType(filterType === statCard.filterTypeVal ? '' : (statCard.filterTypeVal as any));
                }
              }}
              className={`p-4 rounded-2xl border ${statCard.bg} flex items-center gap-3 text-left cursor-pointer hover:shadow-sm transition-all ${isActive ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
            >
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs shrink-0">{statCard.icon}</div>
              <div>
                {loading ? (
                  <div className="h-5 w-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                ) : (
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{statCard.value}</p>
                )}
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">{statCard.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Categories counter list */}
      {!loading && categoryCounts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Category Filters</p>
          <div className="flex flex-wrap gap-2">
            {categoryCounts.map(([category, count]) => (
              <button
                key={category}
                onClick={() => setFilterCategory(filterCategory === category ? '' : category)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${filterCategory === category ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400'}`}
              >
                {category}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${filterCategory === category ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bulk action console panel */}
      {bulkMode && (
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-850 rounded-2xl p-3 flex flex-wrap items-center gap-3 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <button onClick={handleSelectAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold cursor-pointer border-none hover:bg-violet-700 transition-colors">
              <CheckSquare className="w-3.5 h-3.5" /> Select All ({filteredItems.length})
            </button>
            {selectedItems.size > 0 && (
              <button onClick={handleClearSelection} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer border-none hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Square className="w-3.5 h-3.5" /> Clear Select
              </button>
            )}
          </div>
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-violet-700 dark:text-violet-400">{selectedItems.size} items active</span>
              <button onClick={() => handleBulkSetFeatured(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer border-none hover:bg-amber-600 transition-colors">
                <Star className="w-3 h-3 fill-current" /> Feature Selected
              </button>
              <button onClick={() => handleBulkSetFeatured(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-350 text-xs font-bold cursor-pointer border-none hover:bg-slate-350 dark:hover:bg-slate-600 transition-colors">
                Unfeature Selected
              </button>
              <button onClick={handleBulkDelete} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer border-none hover:bg-rose-700 transition-colors">
                <Trash2 className="w-3 h-3" /> Delete Selected
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toolbar Search / Active Filters panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search matching media tags, titles, categories, or captions..."
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-905 dark:text-white focus:outline-none focus:border-sky-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-650 cursor-pointer border-none bg-transparent">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${showFilters || activeFiltersCount > 0 ? 'bg-sky-50 border-sky-300 text-sky-700 dark:bg-sky-950/30 dark:border-sky-700 dark:text-sky-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filter Deck
            {activeFiltersCount > 0 && <span className="ml-1 w-4 h-4 bg-sky-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">{activeFiltersCount}</span>}
          </button>
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {(['grid', 'list'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`p-2 cursor-pointer border-none transition-colors ${viewMode === mode ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                {mode === 'grid' ? <Grid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive filter select panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap items-center gap-3">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none">
            <option value="">All Categories</option>
            {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none">
            <option value="">All Formats</option>
            <option value="photo">Photos Only</option>
            <option value="video">Videos Only</option>
          </select>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={filterFeatured} onChange={e => setFilterFeatured(e.target.checked)} className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Featured Showcase</span>
          </label>
          {activeFiltersCount > 0 && (
            <button onClick={() => { setFilterCategory(''); setFilterType(''); setFilterFeatured(false); }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-bold border border-rose-200 dark:border-rose-800 cursor-pointer">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
          <span className="text-[11px] text-slate-400 font-semibold ml-auto">{filteredItems.length} matching item(s)</span>
        </div>
      )}

      {/* Grid gallery showcase view */}
      {!loading && viewMode === 'grid' && (
        <>
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
              <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3 opacity-40" />
              <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-base">No Media Matches</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">Try clearing search filters or create new entries.</p>
              <button onClick={() => setShowAddModal(true)} className="mt-4 flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer border-none transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add First Media
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedItems.map((item, idx) => {
                const mediaUrl = getStrapiMediaUrl(item.mediaFile);
                const isSelected = selectedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border transition-all duration-200 ${isSelected ? 'border-violet-500 ring-2 ring-violet-500 dark:ring-offset-slate-950 ring-offset-2' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                  >
                    {/* Thumbnail Image display */}
                    <div
                      className="aspect-video bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => (bulkMode ? toggleSelectItem(item.id) : setLightboxIndex(idx))}
                    >
                      {mediaUrl && item.mediaType === 'photo' ? (
                        <img src={mediaUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : mediaUrl && item.mediaType === 'video' ? (
                        <div className="relative w-full h-full">
                          <video src={mediaUrl} className="w-full h-full object-cover" muted />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                            <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
                              <ChevronRight className="w-4 h-4 text-white ml-0.5 fill-current" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 p-4">
                          {item.mediaType === 'video' ? <Video className="w-8 h-8 mb-1" /> : <Camera className="w-8 h-8 mb-1" />}
                          <p className="text-[10px] text-center font-bold">Pending upload</p>
                        </div>
                      )}
                    </div>

                    {/* Standard layout overlay options */}
                    {!bulkMode && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button onClick={() => setLightboxIndex(idx)} title="Maximize View" className="p-2 rounded-xl bg-white/95 text-slate-800 hover:bg-white cursor-pointer border-none shadow-md transition-colors">
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingItem(item)} title="Edit Properties" className="p-2 rounded-xl bg-white/95 text-slate-800 hover:bg-white cursor-pointer border-none shadow-md transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleFeatured(item)} title={item.isFeatured ? 'Remove Showcase' : 'Feature Showcase'} className={`p-2 rounded-xl border-none shadow-md cursor-pointer transition-colors ${item.isFeatured ? 'bg-amber-400 text-amber-950 hover:bg-amber-500' : 'bg-white/95 text-slate-850 hover:bg-white'}`}>
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                          <button onClick={() => handleDelete(item)} title="Delete media" className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white cursor-pointer border-none shadow-md transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}

                    {/* Checkbox overlay for bulk selection */}
                    {bulkMode && (
                      <button
                        onClick={() => toggleSelectItem(item.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 shadow cursor-pointer border-none transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4.5 h-4.5 text-violet-600" />
                        ) : (
                          <Square className="w-4.5 h-4.5 text-slate-400" />
                        )}
                      </button>
                    )}

                    {/* Overlay metadata badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1.5 pointer-events-none">
                      {item.isFeatured && (
                        <span className="px-2 py-0.5 bg-amber-400 text-amber-950 text-[9px] font-extrabold rounded-full shadow-md flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" /> Featured
                        </span>
                      )}
                      {item.mediaType === 'video' && (
                        <span className="px-2 py-0.5 bg-violet-600 text-white text-[9px] font-bold rounded-full shadow-md">
                          ▶ Video
                        </span>
                      )}
                    </div>

                    {/* Card footer description */}
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-850">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{item.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Table list view format */}
      {!loading && viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs text-slate-400 font-semibold">No assets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {bulkMode && <th className="px-4 py-3 w-10"></th>}
                    <th className="px-5 py-3">Asset Item</th>
                    <th className="px-5 py-3">Format</th>
                    <th className="px-5 py-3">Category Tag</th>
                    <th className="px-5 py-3">Featured status</th>
                    <th className="px-5 py-3 text-right">Action Console</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedItems.map((item, idx) => {
                    const mediaUrl = getStrapiMediaUrl(item.mediaFile);
                    const isSelected = selectedItems.has(item.id);
                    return (
                      <tr key={item.id} className={`transition-colors ${isSelected ? 'bg-violet-50/50 dark:bg-violet-950/10' : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/20'}`}>
                        {bulkMode && (
                          <td className="px-4 py-3">
                            <button onClick={() => toggleSelectItem(item.id)} className="cursor-pointer border-none bg-transparent">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-violet-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </td>
                        )}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center relative">
                              {mediaUrl && item.mediaType === 'photo' ? (
                                <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                              ) : mediaUrl && item.mediaType === 'video' ? (
                                <div className="w-full h-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                                  <Video className="w-4 h-4 text-violet-600" />
                                </div>
                              ) : (
                                <Camera className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">{item.title}</p>
                              {item.caption && <p className="text-[10px] text-slate-450 dark:text-slate-400 truncate max-w-[200px] mt-0.5">{item.caption}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${item.mediaType === 'video' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-305'}`}>
                            {item.mediaType}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500 font-semibold">{item.category || '—'}</td>
                        <td className="px-5 py-3">
                          {item.isFeatured ? (
                            <span className="flex items-center gap-1 text-amber-600 font-bold">
                              <Star className="w-3.5 h-3.5 fill-current" /> Yes
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">No</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setLightboxIndex(idx)} title="Open Fullscreen" className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer bg-transparent transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingItem(item)} title="Edit Properties" className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 cursor-pointer bg-transparent transition-colors">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleToggleFeatured(item)} title={item.isFeatured ? 'Remove Feature' : 'Featured showcase'} className={`p-1.5 rounded-lg border cursor-pointer bg-transparent transition-colors ${item.isFeatured ? 'border-amber-250 dark:border-amber-800 text-amber-600 hover:bg-amber-50' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button onClick={() => handleDelete(item)} title="Delete Item" className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer bg-transparent transition-colors">
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
      )}

      {/* Pagination Load More control */}
      {!loading && hasMoreItems && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Load More Assets ({filteredItems.length - paginatedItems.length} left)
          </button>
        </div>
      )}

      {/* Footer result info counts */}
      {!loading && filteredItems.length > 0 && (
        <p className="text-center text-[10px] text-slate-400 font-mono tracking-wide">
          Displaying {paginatedItems.length} of {filteredItems.length} catalog items
          {items.length !== filteredItems.length && ` (filtered from ${items.length} total)`}
        </p>
      )}

      {/* Full Slideshow Lightbox Modals */}
      {lightboxIndex !== null && (
        <Lightbox
          items={paginatedItems}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Edit Drawer Sidebar panel */}
      {editingItem && (
        <EditDrawer
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={loadItems}
        />
      )}

      {/* Add Media Modal */}
      {showAddModal && (
        <AddMediaModal
          onClose={() => setShowAddModal(false)}
          onSaved={loadItems}
        />
      )}
    </div>
  );
}
