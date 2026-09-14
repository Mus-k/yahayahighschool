import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::notification.notification', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (user && ctx.request.body?.data && !ctx.request.body.data.sender) {
      ctx.request.body.data.sender = user.id;
    }
    return super.create(ctx);
  },
}));

