"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@strapi/utils");
const { ApplicationError } = utils_1.errors;
exports.default = {
    async beforeCreate(event) {
        const { data } = event.params;
        if (data.totalDebitBase !== data.totalCreditBase) {
            throw new ApplicationError(`Double entry validation failed. Total Debit (${data.totalDebitBase}) does not match Total Credit (${data.totalCreditBase}).`);
        }
    },
    async beforeUpdate(event) {
        const { data } = event.params;
        if (data.totalDebitBase !== undefined && data.totalCreditBase !== undefined) {
            if (data.totalDebitBase !== data.totalCreditBase) {
                throw new ApplicationError(`Double entry validation failed. Total Debit (${data.totalDebitBase}) does not match Total Credit (${data.totalCreditBase}).`);
            }
        }
    }
};
