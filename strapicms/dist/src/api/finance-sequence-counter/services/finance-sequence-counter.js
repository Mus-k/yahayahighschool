"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreService('api::finance-sequence-counter.finance-sequence-counter', ({ strapi }) => ({
    async generateNextSequence(moduleCode, prefix, padding = 6) {
        try {
            const entries = await strapi.documents('api::finance-sequence-counter.finance-sequence-counter').findMany({
                filters: { moduleCode: { $eq: moduleCode } }
            });
            const entry = entries === null || entries === void 0 ? void 0 : entries[0];
            let currentSeq = 1;
            if (entry) {
                currentSeq = (entry.lastSequenceNumber || 0) + 1;
                await strapi.documents('api::finance-sequence-counter.finance-sequence-counter').update({
                    documentId: entry.documentId,
                    data: { lastSequenceNumber: currentSeq }
                });
            }
            else {
                await strapi.documents('api::finance-sequence-counter.finance-sequence-counter').create({
                    data: { moduleCode, lastSequenceNumber: 1 }
                });
            }
            const formattedSeq = String(currentSeq).padStart(padding, '0');
            return prefix ? `${prefix}-${formattedSeq}` : formattedSeq;
        }
        catch (err) {
            const fallbackSeq = String(Math.floor(Math.random() * 100000)).padStart(padding, '0');
            return prefix ? `${prefix}-${fallbackSeq}` : fallbackSeq;
        }
    }
}));
