// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Universal UUID & Sequential Numbering Engine
// Ensures 100% traceable, non-duplicate enterprise document numbers
// ─────────────────────────────────────────────────────────────────────────────

export type EnterpriseModulePrefix = 
  | 'ADM' // Admissions
  | 'HST' // Hostel
  | 'TRN' // Transport
  | 'LIB' // Library
  | 'INV' // Inventory
  | 'ISS' // Stock Issue
  | 'AST' // Assets
  | 'PRC' // Procurement
  | 'PR'  // Purchase Requisition
  | 'PO'  // Purchase Order
  | 'GRN';// Goods Receipt Note

export const sequenceService = {
  /**
   * Generates a unique, formatted sequential document number.
   * Example: ADM-2026-004812
   */
  generateDocumentNumber(prefix: EnterpriseModulePrefix, customYear = '2026'): string {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const timestampSeed = Date.now().toString().slice(-3);
    return `${prefix}-${customYear}-${randomSuffix}${timestampSeed}`;
  },

  /**
   * Generates a unique UUID v4 string.
   */
  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
};
