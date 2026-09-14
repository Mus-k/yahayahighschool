"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::admission-application.admission-application', ({ strapi }) => ({
    async create(ctx) {
        var _a;
        // Auto-generate unique applicationNumber if not provided
        const bodyData = ((_a = ctx.request.body) === null || _a === void 0 ? void 0 : _a.data) || {};
        if (!bodyData.applicationNumber) {
            const timestamp = Date.now().toString().slice(-6);
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            bodyData.applicationNumber = `APP-${new Date().getFullYear()}-${timestamp}${randomDigits}`;
            ctx.request.body.data = bodyData;
        }
        const response = await super.create(ctx);
        // Log to audit or notify
        strapi.log.info(`[YAHAYASCOOL] New online admission application submitted: ${bodyData.applicationNumber} (${bodyData.firstName} ${bodyData.lastName})`);
        return response;
    },
}));
