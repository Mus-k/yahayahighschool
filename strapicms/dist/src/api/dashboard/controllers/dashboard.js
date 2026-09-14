"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    async getAdminDashboard(ctx) {
        const locale = ctx.query.locale || 'en';
        const stats = await strapi.service('api::dashboard.dashboard').getAdminStats({ locale });
        ctx.body = { data: stats };
    },
    async getDirectorDashboard(ctx) {
        const user = ctx.state.user;
        if (!user)
            return ctx.unauthorized();
        const locale = ctx.query.locale || 'en';
        const stats = await strapi.service('api::dashboard.dashboard').getDirectorStats({ locale });
        ctx.body = { data: stats };
    },
    async getTeacherDashboard(ctx) {
        const user = ctx.state.user;
        if (!user)
            return ctx.unauthorized();
        const locale = ctx.query.locale || 'en';
        const stats = await strapi.service('api::dashboard.dashboard').getTeacherStats(user.id, { locale });
        ctx.body = { data: stats };
    },
    async getStudentDashboard(ctx) {
        const user = ctx.state.user;
        if (!user)
            return ctx.unauthorized();
        const locale = ctx.query.locale || 'en';
        const stats = await strapi.service('api::dashboard.dashboard').getStudentStats(user.id, { locale });
        ctx.body = { data: stats };
    },
    async getParentDashboard(ctx) {
        const user = ctx.state.user;
        if (!user)
            return ctx.unauthorized();
        const locale = ctx.query.locale || 'en';
        const stats = await strapi.service('api::dashboard.dashboard').getParentStats(user.id, { locale });
        ctx.body = { data: stats };
    },
    async getAccountantDashboard(ctx) {
        const user = ctx.state.user;
        if (!user)
            return ctx.unauthorized();
        const locale = ctx.query.locale || 'en';
        const stats = await strapi.service('api::dashboard.dashboard').getAccountantStats({ locale });
        ctx.body = { data: stats };
    },
    async getAccountLeadDashboard(ctx) {
        const user = ctx.state.user;
        if (!user)
            return ctx.unauthorized();
        const locale = ctx.query.locale || 'en';
        const stats = await strapi.service('api::dashboard.dashboard').getAccountLeadStats({ locale });
        ctx.body = { data: stats };
    },
    async getWorkerDashboard(ctx) {
        const user = ctx.state.user;
        if (!user)
            return ctx.unauthorized();
        const locale = ctx.query.locale || 'en';
        const stats = await strapi.service('api::dashboard.dashboard').getWorkerStats(user.id, { locale });
        ctx.body = { data: stats };
    },
    async getDriverDashboard(ctx) {
        const user = ctx.state.user;
        if (!user)
            return ctx.unauthorized();
        const locale = ctx.query.locale || 'en';
        const stats = await strapi.service('api::dashboard.dashboard').getDriverDashboardStats(user.id, { locale });
        ctx.body = { data: stats };
    },
    async getFinanceStats(ctx) {
        const { academicYear = '2026-2027', locale = 'en' } = ctx.query;
        const stats = await strapi.service('api::dashboard.dashboard').getExecutiveFinanceStats(String(academicYear), { locale });
        ctx.body = { data: stats };
    },
};
