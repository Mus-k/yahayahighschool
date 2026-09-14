export default {
  routes: [
    {
      method: 'GET',
      path: '/dashboard/admin',
      handler: 'dashboard.getAdminDashboard',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/dashboard/director',
      handler: 'dashboard.getDirectorDashboard',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/dashboard/teacher',
      handler: 'dashboard.getTeacherDashboard',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/dashboard/student',
      handler: 'dashboard.getStudentDashboard',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/dashboard/parent',
      handler: 'dashboard.getParentDashboard',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/dashboard/accountant',
      handler: 'dashboard.getAccountantDashboard',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/dashboard/account-lead',
      handler: 'dashboard.getAccountLeadDashboard',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/dashboard/worker',
      handler: 'dashboard.getWorkerDashboard',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/dashboard/driver',
      handler: 'dashboard.getDriverDashboard',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/finance-dashboards/stats',
      handler: 'dashboard.getFinanceStats',
      config: { policies: [] },
    },
  ],
};
