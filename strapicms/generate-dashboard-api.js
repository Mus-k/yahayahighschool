const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'api');
const dashboardDir = path.join(apiDir, 'dashboard');
const controllersDir = path.join(dashboardDir, 'controllers');
const routesDir = path.join(dashboardDir, 'routes');
const servicesDir = path.join(dashboardDir, 'services');

[dashboardDir, controllersDir, routesDir, servicesDir].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

// routes
const routeCode = `export default {
  routes: [
    {
      method: 'GET',
      path: '/dashboard/admin',
      handler: 'dashboard.getAdminDashboard',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/dashboard/teacher',
      handler: 'dashboard.getTeacherDashboard',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/dashboard/student',
      handler: 'dashboard.getStudentDashboard',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/dashboard/parent',
      handler: 'dashboard.getParentDashboard',
      config: { policies: [] }
    }
  ]
};
`;
fs.writeFileSync(path.join(routesDir, 'dashboard.ts'), routeCode);

// services
const serviceCode = `export default () => ({
  async getAdminStats() {
    return {
      students: await strapi.documents('api::student.student').count(),
      teachers: await strapi.documents('api::teacher.teacher').count(),
      parents: await strapi.documents('api::parent.parent').count(),
      departments: await strapi.documents('api::department.department').count()
    };
  },
  async getTeacherStats(userId: number) {
    // In a real app, you would filter by teacher.user.id = userId
    return { assignedClasses: 3, pendingAssessments: 5, pendingHomework: 12 };
  },
  async getStudentStats(userId: number) {
    return { attendance: 95, pendingAssignments: 2, recentGrade: 'A-' };
  },
  async getParentStats(userId: number) {
    return { childrenCount: 2, outstandingFees: 1500, upcomingEvents: 1 };
  }
});
`;
fs.writeFileSync(path.join(servicesDir, 'dashboard.ts'), serviceCode);

// controllers
const controllerCode = `export default {
  async getAdminDashboard(ctx) {
    const stats = await strapi.service('api::dashboard.dashboard').getAdminStats();
    ctx.body = { data: stats };
  },
  async getTeacherDashboard(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getTeacherStats(user.id);
    ctx.body = { data: stats };
  },
  async getStudentDashboard(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getStudentStats(user.id);
    ctx.body = { data: stats };
  },
  async getParentDashboard(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getParentStats(user.id);
    ctx.body = { data: stats };
  }
};
`;
fs.writeFileSync(path.join(controllersDir, 'dashboard.ts'), controllerCode);

console.log('Dashboard custom API generated successfully.');
