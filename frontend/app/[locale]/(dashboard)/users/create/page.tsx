/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import {
  ArrowLeft, Shield, User, Mail, Lock, CheckCircle2, Phone,
  Globe, Calendar, MapPin, Languages, UserCog, BadgeCheck, Eye, EyeOff
} from 'lucide-react';
import { userService } from '@/services/user.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Create System User Page
// All fields matching the Strapi User content-type schema.
// ─────────────────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = ['male', 'female', 'other'];
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic (عربي)' },
  { value: 'fr', label: 'French (Français)' },
  { value: 'tr', label: 'Turkish (Türkçe)' },
];

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}
function Field({ label, required, children, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

const inputCls = cn(
  'w-full px-4 py-2.5 rounded-xl border transition-all text-sm',
  'border-slate-200 dark:border-slate-700',
  'bg-white dark:bg-slate-800',
  'text-slate-900 dark:text-slate-100',
  'placeholder:text-slate-400 dark:placeholder:text-slate-500',
  'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500',
);

const selectCls = cn(inputCls, 'cursor-pointer');

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-indigo-500" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
    </div>
  );
}

function Toggle({ checked, onChange, label, description, danger }: {
  checked: boolean; onChange: (v: boolean) => void;
  label: string; description: string; danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-4 w-full text-left group"
    >
      <div className={cn(
        'relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200',
        checked ? (danger ? 'bg-rose-500' : 'bg-indigo-500') : 'bg-slate-200 dark:bg-slate-700'
      )}>
        <span className={cn(
          'absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )} />
      </div>
      <div>
        <p className={cn('text-sm font-semibold', danger && checked ? 'text-rose-500' : 'text-slate-900 dark:text-white')}>
          {label}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    displayName: '',
    phone: '',
    nationality: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    preferredLanguage: 'en',
    // Auth Credentials
    username: '',
    email: '',
    password: '',
    roleId: '',
    // Access State
    confirmed: true,
    blocked: false,
    isActive: true,
  });

  useEffect(() => {
    userService.getRoles()
      .then(data => setRoles(data || []))
      .catch(() => toast.error('Failed to load roles'));
  }, []);

  // Auto-fill displayName when first/last name change
  useEffect(() => {
    const auto = [form.firstName, form.lastName].filter(Boolean).join(' ');
    setForm(p => ({ ...p, displayName: auto }));
  }, [form.firstName, form.lastName]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.roleId) { toast.error('Please select a system role'); return; }
    if (!form.password || form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      await userService.createUser({
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        displayName: form.displayName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        nationality: form.nationality.trim() || undefined,
        gender: (form.gender as any) || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address.trim() || undefined,
        preferredLanguage: (form.preferredLanguage as any) || 'en',
        roleId: parseInt(form.roleId, 10),
        confirmed: form.confirmed,
        blocked: form.blocked,
        isActive: form.isActive,
      });
      toast.success('System user created successfully!');
      router.push('/users');
    } catch (err: any) {
      const msg = err?.message || err?.details?.errors?.[0]?.message || 'Failed to create user';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <Link
          href="/users"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-500" />
            Create System User
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Provision a new authentication account. All fields match the Strapi User schema.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Personal Information ───────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <SectionHeader icon={User} title="Personal Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="First Name">
              <input type="text" value={form.firstName} onChange={set('firstName')}
                className={inputCls} placeholder="e.g. Aisha" />
            </Field>
            <Field label="Last Name">
              <input type="text" value={form.lastName} onChange={set('lastName')}
                className={inputCls} placeholder="e.g. Suleiman" />
            </Field>
            <Field label="Display Name" hint="Auto-filled from first + last name">
              <input type="text" value={form.displayName} onChange={set('displayName')}
                className={inputCls} placeholder="Aisha Suleiman" />
            </Field>
            <Field label="Phone">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="tel" value={form.phone} onChange={set('phone')}
                  className={cn(inputCls, 'pl-9')} placeholder="+1 234 567 8900" />
              </div>
            </Field>
            <Field label="Nationality">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={form.nationality} onChange={set('nationality')}
                  className={cn(inputCls, 'pl-9')} placeholder="e.g. Nigerian" />
              </div>
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={set('gender')} className={selectCls}>
                <option value="">Select gender...</option>
                {GENDER_OPTIONS.map(g => (
                  <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                ))}
              </select>
            </Field>
            <Field label="Date of Birth">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')}
                  className={cn(inputCls, 'pl-9')} />
              </div>
            </Field>
            <Field label="Preferred Language">
              <div className="relative">
                <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select value={form.preferredLanguage} onChange={set('preferredLanguage')}
                  className={cn(selectCls, 'pl-9')}>
                  {LANGUAGE_OPTIONS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </Field>
            <div className="md:col-span-2">
              <Field label="Address">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea value={form.address} onChange={set('address')} rows={2}
                    className={cn(inputCls, 'pl-9 resize-none')}
                    placeholder="Street, City, Country" />
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* ── Authentication Credentials ─────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <SectionHeader icon={Shield} title="Authentication Credentials" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Username" required hint="Unique login handle, no spaces">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required type="text" value={form.username} onChange={set('username')}
                  className={cn(inputCls, 'pl-9')} placeholder="aisha_suleiman"
                  autoComplete="off" />
              </div>
            </Field>
            <Field label="Email Address" required>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required type="email" value={form.email} onChange={set('email')}
                  className={cn(inputCls, 'pl-9')} placeholder="aisha@school.com"
                  autoComplete="off" />
              </div>
            </Field>
            <Field label="Password" required hint="Minimum 6 characters">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={set('password')} minLength={6}
                  className={cn(inputCls, 'pl-9 pr-10')} placeholder="••••••••"
                  autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="System Role" required>
              <div className="relative">
                <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select required value={form.roleId} onChange={set('roleId')}
                  className={cn(selectCls, 'pl-9')}>
                  <option value="" disabled>Select a role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </Field>
          </div>
        </div>

        {/* ── Access State ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <SectionHeader icon={BadgeCheck} title="Access State" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <Toggle
                checked={form.isActive}
                onChange={v => setForm(p => ({ ...p, isActive: v }))}
                label="Active Account"
                description="User can access their assigned portals."
              />
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <Toggle
                checked={form.confirmed}
                onChange={v => setForm(p => ({ ...p, confirmed: v }))}
                label="Email Confirmed"
                description="If off, the user cannot log in until confirmed."
              />
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <Toggle
                checked={form.blocked}
                onChange={v => setForm(p => ({ ...p, blocked: v }))}
                label="Block Account"
                description="Immediately prevents access to the system."
                danger
              />
            </div>
          </div>
        </div>

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/users"
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}
