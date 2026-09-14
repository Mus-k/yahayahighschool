/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, Plus, CheckCircle2, Lock, Users, Key, Search, RefreshCw, Save, Activity } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { userService } from '@/services/user.service';
import { apiClient } from '@/services/api.service';
import { toast } from 'sonner';

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | number>('');
  const [permissions, setPermissions] = useState<any>({});
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Create custom role states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadRoles = async (selectId?: string | number) => {
    setIsLoading(true);
    try {
      const allRoles = await userService.getRoles();
      setRoles(allRoles);

      const activeId = selectId || allRoles[0]?.id;
      if (activeId) {
        setSelectedRoleId(activeId);
        await loadRolePermissions(activeId);
      }
    } catch (e) {
      toast.error('Failed to load system roles.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRolePermissions = async (roleId: string | number) => {
    try {
      const res = await apiClient.get(`/users-permissions/roles/${roleId}`);
      const roleDetails = res.data?.role || {};
      setRoleName(roleDetails.name || '');
      setRoleDescription(roleDetails.description || '');
      setPermissions(roleDetails.permissions || {});
    } catch (e) {
      toast.error('Failed to load role permissions details.');
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleRoleSelect = async (roleId: string | number) => {
    setSelectedRoleId(roleId);
    await loadRolePermissions(roleId);
  };

  const handleToggle = (namespace: string, controller: string, action: string, enabled: boolean) => {
    setPermissions((prev: any) => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (updated[namespace]?.controllers?.[controller]?.[action]) {
        updated[namespace].controllers[controller][action].enabled = enabled;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put(`/users-permissions/roles/${selectedRoleId}`, {
        name: roleName,
        description: roleDescription,
        permissions: permissions
      });
      toast.success('Enterprise role permissions matrix updated successfully!');
      loadRoles(selectedRoleId);
    } catch (e) {
      toast.error('Failed to save role permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) {
      toast.error('Role name is required.');
      return;
    }
    setIsCreating(true);
    try {
      const res = await apiClient.post('/users-permissions/roles', {
        name: newRoleName,
        description: newRoleDesc
      });
      toast.success(`Role "${newRoleName}" created successfully.`);
      setIsCreateModalOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
      loadRoles(res.data?.role?.id || '');
    } catch (e) {
      toast.error('Failed to create custom role.');
    } finally {
      setIsCreating(false);
    }
  };

  const getNamespaceDisplayName = (ns: string) => {
    const mapping: Record<string, string> = {
      'api::student': 'Student SIS (Information System)',
      'api::teacher': 'Teacher Faculty Roster',
      'api::parent': 'Parent Guardian Directory',
      'api::worker': 'Support Staff Registry',
      'api::timetable-slot': 'Weekly Timetables & Classes',
      'api::subject': 'Academic Subjects & Syllabus',
      'api::homework': 'LMS Homework Assignments',
      'api::student-grade': 'Gradebook Marks & Report Cards',
      'api::academic-certificate': 'Verifiable Certificates Registry',
      'api::promotion-record': 'Bulk Promotion Command Console',
      'api::invoice': 'Financial Invoices & Billing',
      'api::payment': 'Payment Logs & Transactions',
      'api::department': 'School Academic Departments',
      'api::program': 'Linked Curriculum Programs',
      'api::section': 'Academic Sections',
      'api::academic-year': 'Academic Sessions/Years',
      'api::academic-term': 'Academic Semesters/Terms',
      'plugin::users-permissions': 'User Authentication & Access control',
    };

    const cleanNs = ns.replace(/\.[^.]+$/, '');
    return mapping[ns] || mapping[cleanNs] || ns;
  };

  const permissionItems = useMemo(() => {
    if (!permissions) return [];

    return Object.keys(permissions).map(namespace => {
      const controllersObj = permissions[namespace]?.controllers || {};
      const controllerNames = Object.keys(controllersObj);

      const actionsList: any[] = [];
      controllerNames.forEach(cName => {
        const actionsObj = controllersObj[cName] || {};
        Object.keys(actionsObj).forEach(actName => {
          actionsList.push({
            controller: cName,
            action: actName,
            enabled: !!actionsObj[actName]?.enabled
          });
        });
      });

      return {
        namespace,
        displayName: getNamespaceDisplayName(namespace),
        actions: actionsList
      };
    }).filter(item => item.actions.length > 0);
  }, [permissions]);

  const filteredPermissions = useMemo(() => {
    if (!searchQuery) return permissionItems;
    return permissionItems.filter(p =>
      p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.namespace.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [permissionItems, searchQuery]);

  return (
    <PageContainer>
      <PageHeader
        title="Enterprise Roles & Permissions Matrix"
        description="Configure role-based access control (RBAC), granular module privileges, and security boundaries."
      >
        <div className="flex gap-2">
          <button
            onClick={() => loadRoles(selectedRoleId)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-black" />
            <span className='text-blue-700'>Sync live roles</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
          <p className="text-xs text-muted-foreground font-medium">Loading Strapi roles registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles list */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Platform Roles</h3>
            {roles.map((r) => (
              <div
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between shadow-xs ${
                  selectedRoleId === r.id
                    ? 'bg-primary/5 border-primary shadow-xs'
                    : 'bg-card border-border hover:bg-muted/30'
                }`}
              >
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">{r.name}</h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{r.description || 'No description provided.'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Permissions Matrix */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Lock className="w-4.5 h-4.5 text-primary" />
                  <span>Privilege Matrix: {roles.find(r => r.id === selectedRoleId)?.name}</span>
                </h3>
                <p className="text-[10px] text-muted-foreground">Toggle API permissions and security boundaries.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search modules..."
                    className="pl-8 pr-3 py-1.5 bg-muted rounded-xl text-xs focus:outline-none border-none w-44"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 disabled:opacity-50 transition-all shadow-md shadow-primary/20 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Privileges</span>
                </button>
              </div>
            </div>

            {/* Matrix Form inputs */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-1 text-xs">
                <label className="text-[10px] font-black text-muted-foreground block">Role Details Name</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-bold"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-[10px] font-black text-muted-foreground block">Role Description</label>
                <textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-bold"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">API Namespace Controllers</h3>
                {filteredPermissions.map(item => (
                  <div key={item.namespace} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground text-xs">{item.displayName}</span>
                      <span className="font-mono text-[9px] text-muted-foreground">{item.namespace}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {item.actions.map((act: any) => (
                        <div key={`${act.controller}-${act.action}`} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`${item.namespace}-${act.controller}-${act.action}`}
                            checked={act.enabled}
                            onChange={(e) => handleToggle(item.namespace, act.controller, act.action, e.target.checked)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                          />
                          <label
                            htmlFor={`${item.namespace}-${act.controller}-${act.action}`}
                            className="text-[11px] font-medium text-foreground cursor-pointer select-none truncate"
                            title={`${act.controller}.${act.action}`}
                          >
                            {act.action}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredPermissions.length === 0 && (
                  <p className="text-center py-6 text-xs text-muted-foreground">No matching permissions found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Role Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-foreground mb-1">Create Custom Role</h3>
            <p className="text-xs text-muted-foreground mb-5">Define a new system access role. Permissions can be mapped after creation.</p>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Role Name</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Academic Auditor"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Role Description</label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Describe the scope of this custom access role..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
