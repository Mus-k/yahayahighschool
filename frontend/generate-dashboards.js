const fs = NodeJS.require('fs');
const path = NodeJS.require('path');

const baseDir = path.join(__dirname, 'app', '[locale]', '(dashboard)', 'dashboard');
const roles = ['admin', 'director', 'teacher', 'student', 'parent', 'worker', 'accountant', 'account-lead', 'driver'];

// First rename existing page.tsx to admin/page.tsx
if (!fs.existsSync(path.join(baseDir, 'admin'))) {
  fs.mkdirSync(path.join(baseDir, 'admin'));
  fs.renameSync(path.join(baseDir, 'page.tsx'), path.join(baseDir, 'admin', 'page.tsx'));
}

roles.forEach((role) => {
  const roleDir = path.join(baseDir, role);
  if (!fs.existsSync(roleDir)) {
    fs.mkdirSync(roleDir, { recursive: true });
  }

  if (role !== 'admin') {
    const pageCode = `'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { Loader2 } from 'lucide-react';

export default function ${role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In Phase 3E, we fetch live data from our new API endpoints!
    apiClient.get('/dashboard/${role === 'director' ? 'admin' : role}')
      .then(res => {
        setData(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch dashboard data', err);
        setLoading(false);
      });
  }, []);

  return (
    <PageContainer title="${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard" description="Welcome back, " + user?.firstName>
      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Live Data Widgets go here */}
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">API Data Load</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">Success</p>
            <pre className="mt-4 text-xs text-gray-400 overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
`;
    fs.writeFileSync(path.join(roleDir, 'page.tsx'), pageCode);
  }
});

// Now write the root page.tsx to handle redirection
const rootPageCode = `'use client';
import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function DashboardRootRedirect() {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!role) {
        router.push('/auth/login');
      } else if (['super_admin', 'system_admin'].includes(role)) {
        router.push('/dashboard/admin');
      } else {
        // Assume role string directly matches the sub-path
        router.push(\`/dashboard/\${role.replace('_', '-')}\`);
      }
    }
  }, [role, isLoading, router]);

  return <div className="flex h-screen items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
}
`;
fs.writeFileSync(path.join(baseDir, 'page.tsx'), rootPageCode);

console.log('Role-based routing scaffolding generated successfully.');
