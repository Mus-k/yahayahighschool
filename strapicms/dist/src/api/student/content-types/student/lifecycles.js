"use strict";
/**
 * student lifecycles.ts
 * Ensures JSON attributes (emergencyContacts, multiCurrencyWallets) are converted from
 * empty strings to null or valid JSON objects before PostgreSQL DB insertion.
 */
Object.defineProperty(exports, "__esModule", { value: true });
function sanitizeStudentJson(data) {
    if (!data)
        return;
    const jsonFields = ['emergencyContacts', 'multiCurrencyWallets'];
    for (const field of jsonFields) {
        if (field in data) {
            const val = data[field];
            if (val === '' || val === undefined || (typeof val === 'string' && val.trim() === '')) {
                data[field] = null;
            }
        }
    }
}
exports.default = {
    async beforeCreate(event) {
        var _a;
        sanitizeStudentJson((_a = event.params) === null || _a === void 0 ? void 0 : _a.data);
    },
    async beforeUpdate(event) {
        var _a;
        sanitizeStudentJson((_a = event.params) === null || _a === void 0 ? void 0 : _a.data);
    },
};
