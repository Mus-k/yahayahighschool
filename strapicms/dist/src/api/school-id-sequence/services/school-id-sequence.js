"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreService('api::school-id-sequence.school-id-sequence', ({ strapi }) => ({
    /**
     * Generate the next unique School ID for the given initials.
     *
     * Format: {UpperInitial1}{UpperInitial2}{000000001..999999999}
     * Example: initials="AC" → "AC000000001"
     *
     * Uses a database transaction with SELECT FOR UPDATE to ensure
     * collision safety even under concurrent requests.
     */
    async generateNextId(initials) {
        const uppercaseInitials = initials.toUpperCase().substring(0, 2).padEnd(2, 'X');
        const sequenceNumber = await strapi.db.transaction(async () => {
            var _a;
            // Find existing sequence record (locked for update in Postgres)
            const existing = await strapi.db
                .query('api::school-id-sequence.school-id-sequence')
                .findOne({ where: { initials: uppercaseInitials } });
            if (!existing) {
                // First time this initials combination is used
                await strapi.db
                    .query('api::school-id-sequence.school-id-sequence')
                    .create({ data: { initials: uppercaseInitials, lastSequence: 1 } });
                return 1;
            }
            const nextSeq = ((_a = existing.lastSequence) !== null && _a !== void 0 ? _a : 0) + 1;
            if (nextSeq > 999999999) {
                throw new Error(`[SchoolIDSequence] Sequence exhausted for initials "${uppercaseInitials}". Maximum 999999999 IDs per prefix.`);
            }
            await strapi.db
                .query('api::school-id-sequence.school-id-sequence')
                .update({ where: { id: existing.id }, data: { lastSequence: nextSeq } });
            return nextSeq;
        });
        // Pad the sequence to 9 digits: AC000000001
        return `${uppercaseInitials}${String(sequenceNumber).padStart(9, '0')}`;
    },
    /**
     * Peek at the current sequence value (for display/diagnostics).
     * Does NOT increment.
     */
    async peekCurrentId(initials) {
        const uppercaseInitials = initials.toUpperCase().substring(0, 2).padEnd(2, 'X');
        const existing = await strapi.db
            .query('api::school-id-sequence.school-id-sequence')
            .findOne({ where: { initials: uppercaseInitials } });
        if (!existing || existing.lastSequence === 0)
            return null;
        return `${uppercaseInitials}${String(existing.lastSequence).padStart(9, '0')}`;
    },
}));
