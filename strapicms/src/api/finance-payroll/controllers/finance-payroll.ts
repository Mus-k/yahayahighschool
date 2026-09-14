import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::finance-payroll.finance-payroll', ({ strapi }) => ({
  async create(ctx: any) {
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
