/**
 * student lifecycles.ts
 * Ensures JSON attributes (emergencyContacts, multiCurrencyWallets) are converted from
 * empty strings to null or valid JSON objects before PostgreSQL DB insertion.
 */

function sanitizeStudentJson(data: any) {
  if (!data) return;
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

export default {
  async beforeCreate(event: any) {
    sanitizeStudentJson(event.params?.data);
  },
  async beforeUpdate(event: any) {
    sanitizeStudentJson(event.params?.data);
  },
};
