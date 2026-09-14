import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::admission-application.admission-application',
  ({ strapi }) => ({
    async create(ctx) {
      // Auto-generate unique applicationNumber if not provided
      const bodyData = ctx.request.body?.data || {};
      if (!bodyData.applicationNumber) {
        const timestamp = Date.now().toString().slice(-6);
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        bodyData.applicationNumber = `APP-${new Date().getFullYear()}-${timestamp}${randomDigits}`;
        ctx.request.body.data = bodyData;
      }

      const response = await super.create(ctx);

      // Log to audit or notify
      strapi.log.info(
        `[YAHAYASCOOL] New online admission application submitted: ${bodyData.applicationNumber} (${bodyData.firstName} ${bodyData.lastName})`
      );

      return response;
    },
  })
);
