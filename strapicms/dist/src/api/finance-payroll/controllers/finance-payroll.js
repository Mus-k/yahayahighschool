"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::finance-payroll.finance-payroll', ({ strapi }) => ({
    async create(ctx) {
        const { data } = ctx.request.body || {};
        if (data && !data.payrollNumber) {
            const count = await strapi.documents('api::finance-payroll.finance-payroll').count({});
            const seq = String(count + 1).padStart(4, '0');
            data.payrollNumber = `PAY-${new Date().getFullYear()}-${seq}`;
        }
        const response = await super.create(ctx);
        return response;
    }
}));
