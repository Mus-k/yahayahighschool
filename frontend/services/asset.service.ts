import { apiClient } from './api.service';
import { financeService } from './finance.service';
import { sequenceService } from './sequence.service';
import type { FixedAsset, DepreciationScheduleItem } from '@/types/enterprise.types';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Fixed Asset Management ERP Service
// Integrated Fixed Asset Register, Depreciation Engine & GL Journal Posting
// Live database integration with Strapi
// ─────────────────────────────────────────────────────────────────────────────

const mapAsset = (raw: any): FixedAsset => ({
  id: raw.documentId,
  assetTag: raw.assetTag,
  name: raw.name,
  category: raw.category,
  purchaseDate: raw.purchaseDate || new Date().toISOString().split('T')[0],
  purchaseCostUSD: Number(raw.purchaseCost ?? 0),
  salvageValueUSD: Number(raw.salvageValue ?? 0),
  usefulLifeYears: Number(raw.usefulLifeYears ?? 5),
  currentBookValueUSD: Number(raw.currentBookValue ?? 0),
  accumulatedDepreciationUSD: Number(raw.accumulatedDepreciation ?? 0),
  depreciationMethod: raw.depreciationMethod || 'Straight Line',
  location: raw.location || 'Central Campus',
  assignedDepartment: raw.assignedDepartment || 'Campus Operations',
  assignedStaffName: raw.assignedStaffName || '',
  barcode: raw.barcode || `99000${Math.floor(1000000 + Math.random() * 9000000)}`,
  status: raw.status || 'active',
});

export const assetService = {
  /**
   * Get all Fixed Assets in Register.
   */
  async getAssets(): Promise<FixedAsset[]> {
    try {
      const res = await apiClient.get('/fixed-assets?pagination[limit]=500&sort=createdAt:desc');
      return (res.data?.data || []).map(mapAsset);
    } catch (err) {
      console.error('[AssetService] getAssets failed:', err);
      return [];
    }
  },

  /**
   * Register a New Fixed Asset & Post Asset Capitalization Journal Entry.
   */
  async registerAsset(payload: {
    name: string;
    category: FixedAsset['category'];
    purchaseDate?: string;
    purchaseCostUSD: number;
    salvageValueUSD: number;
    usefulLifeYears: number;
    depreciationMethod: FixedAsset['depreciationMethod'];
    location: string;
    assignedDepartment?: string;
    assignedStaffName?: string;
  }): Promise<FixedAsset> {
    const assetTag = sequenceService.generateDocumentNumber('AST');
    const cost = payload.purchaseCostUSD || 0;
    const salvage = payload.salvageValueUSD || 0;
    const life = payload.usefulLifeYears || 5;
    const barcode = `99000${Math.floor(1000000 + Math.random() * 9000000)}`;

    const data = {
      assetTag,
      name: payload.name,
      category: payload.category,
      purchaseDate: payload.purchaseDate || new Date().toISOString().split('T')[0],
      purchaseCost: cost,
      salvageValue: salvage,
      usefulLifeYears: life,
      currentBookValue: cost,
      accumulatedDepreciation: 0,
      depreciationMethod: payload.depreciationMethod || 'Straight Line',
      location: payload.location,
      assignedDepartment: payload.assignedDepartment || '',
      assignedStaffName: payload.assignedStaffName || '',
      barcode,
      status: 'active',
    };

    const res = await apiClient.post('/fixed-assets', { data });
    const createdAsset = mapAsset(res.data.data);

    // Auto Finance Integration: Post Asset Capitalization GL Journal Entry
    try {
      await financeService.postManualJournalEntry({
        reference: assetTag,
        description: `Fixed Asset Capitalization: ${createdAsset.name}`,
        lines: [
          { id: '1', accountCode: '1500', accountName: 'Property, Plant & Equipment Assets (Series 1500)', debit: cost, credit: 0 },
          { id: '2', accountCode: '1010', accountName: 'Commercial Bank Treasury', debit: 0, credit: cost }
        ]
      });
      toast.success(`Finance Integration: Posted Capitalization Journal for ${assetTag}`);
    } catch (err) {
      console.warn('Failed to post asset capitalization journal:', err);
    }

    toast.success(`Registered Fixed Asset ${assetTag}: ${createdAsset.name}`);
    return createdAsset;
  },

  /**
   * Run Monthly Depreciation on Asset & Update DB + Post GL Journal.
   */
  async runDepreciationSchedule(asset: FixedAsset): Promise<{ schedule: DepreciationScheduleItem[]; monthlyDepreciation: number }> {
    const depreciableBase = asset.purchaseCostUSD - asset.salvageValueUSD;
    const annualDepreciation = depreciableBase / Math.max(1, asset.usefulLifeYears);
    const monthlyDepreciation = Number((annualDepreciation / 12).toFixed(2));

    const schedule: DepreciationScheduleItem[] = [];
    let currentBookValue = asset.purchaseCostUSD;
    let accumDep = 0;

    for (let yr = 1; yr <= asset.usefulLifeYears; yr++) {
      const depAmt = Number(annualDepreciation.toFixed(2));
      accumDep += depAmt;
      currentBookValue -= depAmt;
      schedule.push({
        year: yr,
        periodName: `Year ${yr} (${2026 + yr - 1})`,
        beginningBookValueUSD: currentBookValue + depAmt,
        depreciationAmountUSD: depAmt,
        endingBookValueUSD: Math.max(asset.salvageValueUSD, currentBookValue),
        accumulatedDepreciationUSD: accumDep,
        isPosted: yr === 1
      });
    }

    // Update asset state in DB: add 1 month's depreciation
    const newAccumDep = Number((asset.accumulatedDepreciationUSD + monthlyDepreciation).toFixed(2));
    const newBookValue = Math.max(asset.salvageValueUSD, Number((asset.purchaseCostUSD - newAccumDep).toFixed(2)));

    try {
      await apiClient.put(`/fixed-assets/${asset.id}`, {
        data: {
          accumulatedDepreciation: newAccumDep,
          currentBookValue: newBookValue,
        }
      });
    } catch (err) {
      console.warn('[AssetService] Failed to update asset depreciation in DB:', err);
    }

    // Auto Finance Integration: Post Monthly Depreciation Journal Entry
    try {
      await financeService.postManualJournalEntry({
        reference: `DEP-${asset.assetTag}`,
        description: `Monthly Depreciation Expense for ${asset.name} (${asset.assetTag})`,
        lines: [
          { id: '1', accountCode: '5030', accountName: 'Asset Depreciation & Maintenance Expense', debit: monthlyDepreciation, credit: 0 },
          { id: '2', accountCode: '1500', accountName: 'Accumulated Depreciation contra-Asset', debit: 0, credit: monthlyDepreciation }
        ]
      });
      toast.success(`Finance Integration: Posted Monthly Depreciation Journal`);
    } catch (err) {
      console.warn('Failed to post depreciation journal:', err);
    }

    return { schedule, monthlyDepreciation };
  },

  /**
   * Delete an Asset from Register.
   */
  async deleteAsset(id: string): Promise<void> {
    await apiClient.delete(`/fixed-assets/${id}`);
    toast.success('Asset removed from register.');
  }
};
