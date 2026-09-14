import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::finance-sequence-counter.finance-sequence-counter', ({ strapi }: { strapi: any }) => ({
  async generateNextSequence(moduleCode: string, prefix: string, padding = 6) {
    try {
      const entries = await strapi.documents('api::finance-sequence-counter.finance-sequence-counter').findMany({
        filters: { moduleCode: { $eq: moduleCode } }
      });
      const entry = entries?.[0];
      let currentSeq = 1;
      if (entry) {
        currentSeq = (entry.lastSequenceNumber || 0) + 1;
        await strapi.documents('api::finance-sequence-counter.finance-sequence-counter').update({
          documentId: entry.documentId,
          data: { lastSequenceNumber: currentSeq }
        });
      } else {
        await strapi.documents('api::finance-sequence-counter.finance-sequence-counter').create({
          data: { moduleCode, lastSequenceNumber: 1 }
        });
      }
      const formattedSeq = String(currentSeq).padStart(padding, '0');
      return prefix ? `${prefix}-${formattedSeq}` : formattedSeq;
    } catch (err) {
      const fallbackSeq = String(Math.floor(Math.random() * 100000)).padStart(padding, '0');
      return prefix ? `${prefix}-${fallbackSeq}` : fallbackSeq;
    }
  }
}));
