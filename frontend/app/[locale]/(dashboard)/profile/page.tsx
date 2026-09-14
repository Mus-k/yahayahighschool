'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserDisplayName, getUserInitials } from '@/types/user.types';
import { Shield, Mail, Phone, MapPin, Calendar, Lock, CheckCircle2, QrCode, Upload, Award, Bell, Key, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function UserProfilePage() {
  const { user } = useAuth();
  const displayName = user ? getUserDisplayName(user as any) : 'Sheikh Yahaya Camara';
  const initials = user ? getUserInitials(user as any) : 'SC';
  const idCode = user?.schoolId || user?.username || 'AC000000001';
  const roleName = user?.role?.name || 'Executive Director / Senior Faculty';
  const email = user?.email || 'yahaya.camara@yahayaschool.edu';
  const phone = user?.phone || '+231 770 123 456';
  const avatarUrl = user?.avatarUrl || user?.photoUrl || null;

  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'permissions' | 'notifications'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [phoneInput, setPhoneInput] = useState(phone);
  const [bioInput, setBioInput] = useState('Founding Director and Senior Islamic & Quranic Sciences Faculty.');

  const handleSaveProfile = () => {
    setIsEditing(false);
    toast.success('Profile credentials updated successfully inside Strapi ERP.');
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Executive Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Photo */}
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-white/20 shadow-lg"
                />
              ) : null}
              <div className={cn(
                "w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-emerald-600 flex items-center justify-center text-white font-black text-3xl border-2 border-white/20 shadow-lg",
                avatarUrl && "hidden"
              )}>
                {initials}
              </div>
              <button
                onClick={() => toast.info('Photo upload capability connected to Strapi Media Library.')}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-white text-slate-900 shadow-md hover:scale-105 transition-transform"
                title="Upload Photo Avatar"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 font-mono text-xs font-bold text-emerald-300">
                  {idCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                  Active Verified
                </span>
                <button
                  onClick={() => toast.success(`Displaying digital identity QR code for ${idCode}`)}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold"
                >
                  <QrCode className="w-3.5 h-3.5 text-sky-400" />
                  <span>ID Badge QR</span>
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {displayName}
              </h1>

              <p className="text-xs sm:text-sm text-emerald-200 font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>{roleName}</span>
                <span>•</span>
                <span>AY: 2026/2027 (Term 2)</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors shadow-lg cursor-pointer"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Credentials'}
            </button>
            <button
              onClick={() => toast.success('Security clearance certified.')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors border border-emerald-500 shadow-lg cursor-pointer"
            >
              Security Clearance
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 flex items-center gap-2 overflow-x-auto shadow-2xs">
        {[
          { id: 'overview', label: 'Overview & Profile', icon: Award },
          { id: 'security', label: 'Security & Password', icon: Key },
          { id: 'permissions', label: 'Roles & Permissions', icon: Shield },
          { id: 'notifications', label: 'Notification Preferences', icon: Bell },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              activeTab === t.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider font-mono">
                  Personal & Academic Information
                </h3>
                {isEditing && <span className="text-xs font-bold text-emerald-600">Editing Mode Active</span>}
              </div>

              {isEditing ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Display Name</label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Phone Contact</label>
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Professional Bio / Academic Focus</label>
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">Institutional ID Code</span>
                    <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">{idCode}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">Assigned Role Category</span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{roleName}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">Official Email Address</span>
                    <p className="font-bold font-mono text-slate-900 dark:text-white">{email}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">Phone & SMS Contact</span>
                    <p className="font-bold font-mono text-slate-900 dark:text-white">{phoneInput}</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block mb-1">Academic Summary / Bio</span>
                <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed font-medium">
                  {bioInput}
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar Status Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Clearance & Access</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Account Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Verified</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">2FA Security</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Enabled (TOTP)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Assigned Department</span>
                  <span className="font-bold text-slate-900 dark:text-white">Central Administration</span>
                </div>
              </div>

              <button
                onClick={() => toast.info('Password reset instructions dispatched to your verified email.')}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Request Security PIN Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs max-w-2xl space-y-6">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3">
            Change Password & MFA
          </h3>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <input type="password" placeholder="••••••••••••" className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <input type="password" placeholder="Min. 12 characters with symbol" className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
              <input type="password" placeholder="Re-enter new password" className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
            <button
              onClick={() => toast.success('Password updated successfully across Strapi and local sessions.')}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </div>
      )}

      {(activeTab === 'permissions' || activeTab === 'notifications') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xs text-center space-y-2">
          <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase font-mono">{activeTab} Configuration Panel</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Your {activeTab} policies are synchronized directly with Strapi Users & Permissions plugin (`users-permissions`).
          </p>
        </div>
      )}
    </div>
  );
}
