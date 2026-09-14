"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::notification.notification', ({ strapi }) => ({
    async create(ctx) {
        var _a;
        const user = ctx.state.user;
        if (user && ((_a = ctx.request.body) === null || _a === void 0 ? void 0 : _a.data) && !ctx.request.body.data.sender) {
            ctx.request.body.data.sender = user.id;
        }
        return super.create(ctx);
    },
}));
