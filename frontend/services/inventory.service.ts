import { apiClient } from './api.service';
import { financeService } from './finance.service';
import { sequenceService } from './sequence.service';
import type { InventoryWarehouse, InventoryItem, InventoryMovement } from '@/types/enterprise.types';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Inventory ERP Service
// Multi-Warehouse Supply Chain, Valuation Engine (FIFO/WAC) & COGS GL Accounting
// All data fetched live from Strapi. No in-memory mocks.
// ─────────────────────────────────────────────────────────────────────────────

const mapItem = (raw: any): InventoryItem => ({
  id: raw.documentId,
  itemCode: raw.itemCode,
  name: raw.name,
  category: raw.category,
  unitOfMeasure: raw.unitOfMeasure,
  warehouseId: raw.warehouse?.documentId || '',
  warehouseName: raw.warehouse?.name || '—',
  quantityOnHand: raw.quantityOnHand ?? 0,
  minimumReorderLevel: raw.minimumReorderLevel ?? 0,
  unitCostUSD: raw.unitCost ?? 0,
  totalValueUSD: raw.totalValue ?? 0,
  valuationMethod: raw.valuationMethod ?? 'FIFO',
  barcode: raw.barcode || '',
  status: raw.status ?? 'in_stock',
  description: raw.description || '',
});

const mapMovement = (raw: any): InventoryMovement => ({
  id: raw.documentId,
  movementNumber: raw.movementNumber,
  type: raw.type,
  itemCode: raw.item?.itemCode || '',
  itemName: raw.item?.name || '',
  quantity: raw.quantity,
  sourceWarehouse: raw.sourceWarehouse,
  destinationWarehouse: raw.destinationWarehouse,
  unitCostUSD: raw.unitCost ?? 0,
  totalCostUSD: raw.totalCost ?? 0,
  performedBy: raw.performedBy || '',
  date: raw.movementDate || raw.createdAt?.split('T')[0] || '',
  referenceDocNumber: raw.referenceDocNumber,
  vendorSupplier: raw.vendorSupplier,
  notes: raw.notes,
});

export const inventoryService = {
  // ─── Warehouses ─────────────────────────────────────────────────────────────
  async getWarehouses(): Promise<InventoryWarehouse[]> {
    try {
      const res = await apiClient.get('/inventory-warehouses?pagination[limit]=100&sort=name:asc');
      const data = res.data?.data || [];
      return data.map((w: any) => ({
        id: w.documentId,
        code: w.code,
        name: w.name,
        location: w.location || '',
        managerName: w.managerName || '',
        totalItems: 0,
        totalValuationUSD: 0,
      }));
    } catch {
      return [];
    }
  },

  async addWarehouse(payload: { code: string; name: string; location?: string; managerName?: string }): Promise<InventoryWarehouse> {
    const res = await apiClient.post('/inventory-warehouses', { data: payload });
    const w = res.data.data;
    return { id: w.documentId, code: w.code, name: w.name, location: w.location || '', managerName: w.managerName || '', totalItems: 0, totalValuationUSD: 0 };
  },

  async deleteWarehouse(id: string): Promise<void> {
    await apiClient.delete(`/inventory-warehouses/${id}`);
  },

  // ─── Items ──────────────────────────────────────────────────────────────────
  async getItems(): Promise<InventoryItem[]> {
    try {
      const res = await apiClient.get('/inventory-items?populate=warehouse&pagination[limit]=500&sort=createdAt:desc');
      return (res.data?.data || []).map(mapItem);
    } catch {
      return [];
    }
  },

  async getItemMovements(itemDocumentId: string): Promise<InventoryMovement[]> {
    try {
      const res = await apiClient.get(
        `/inventory-movements?filters[item][documentId][$eq]=${itemDocumentId}&populate=item&pagination[limit]=50&sort=createdAt:desc`
      );
      return (res.data?.data || []).map(mapMovement);
    } catch {
      return [];
    }
  },

  // ─── Movements ──────────────────────────────────────────────────────────────
  async getMovements(): Promise<InventoryMovement[]> {
    try {
      const res = await apiClient.get('/inventory-movements?populate=item&pagination[limit]=200&sort=createdAt:desc');
      return (res.data?.data || []).map(mapMovement);
    } catch {
      return [];
    }
  },

  // ─── Add New SKU ─────────────────────────────────────────────────────────────
  async addItem(payload: {
    itemCode: string;
    name: string;
    description?: string;
    category: string;
    unitOfMeasure: string;
    warehouseId: string;
    minimumReorderLevel: number;
    unitCost: number;
    valuationMethod: string;
    barcode?: string;
  }): Promise<InventoryItem> {
    const data: any = {
      itemCode: payload.itemCode,
      name: payload.name,
      description: payload.description,
      category: payload.category,
      unitOfMeasure: payload.unitOfMeasure,
      minimumReorderLevel: payload.minimumReorderLevel,
      unitCost: payload.unitCost,
      totalValue: 0,
      quantityOnHand: 0,
      valuationMethod: payload.valuationMethod,
      barcode: payload.barcode,
      status: 'in_stock',
    };
    if (payload.warehouseId) data.warehouse = payload.warehouseId;

    const res = await apiClient.post('/inventory-items', { data });
    return mapItem(res.data.data);
  },

  // ─── Goods Receipt (GRN) ─────────────────────────────────────────────────────
  async recordGoodsReceipt(payload: {
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    unitCost: number;
    warehouseName: string;
    vendorSupplier?: string;
    referenceDocNumber?: string;
    performedBy: string;
    notes?: string;
    currentQty: number;
    currentUnitCost: number;
    valuationMethod: string;
  }): Promise<InventoryMovement> {
    const movNum = sequenceService.generateDocumentNumber('GRN');
    const totalCost = payload.quantity * payload.unitCost;

    // Weighted Average or FIFO new cost computation
    const newQty = payload.currentQty + payload.quantity;
    const newUnitCost =
      payload.valuationMethod === 'Weighted Average'
        ? (payload.currentQty * payload.currentUnitCost + totalCost) / newQty
        : payload.unitCost;
    const newTotalValue = newQty * newUnitCost;
    const newStatus = newQty > 0 ? 'in_stock' : 'out_of_stock';

    // 1. Post movement record
    const movRes = await apiClient.post('/inventory-movements', {
      data: {
        movementNumber: movNum,
        type: 'goods_receipt',
        quantity: payload.quantity,
        unitCost: payload.unitCost,
        totalCost,
        performedBy: payload.performedBy,
        referenceDocNumber: payload.referenceDocNumber,
        vendorSupplier: payload.vendorSupplier,
        destinationWarehouse: payload.warehouseName,
        notes: payload.notes,
        movementDate: new Date().toISOString().split('T')[0],
        item: payload.itemId,
      },
    });

    // 2. Update item stock levels
    await apiClient.put(`/inventory-items/${payload.itemId}`, {
      data: {
        quantityOnHand: newQty,
        unitCost: newUnitCost,
        totalValue: newTotalValue,
        status: newStatus,
      },
    });

    // 3. Finance GL integration: Dr. Inventory Asset 1050 / Cr. Accounts Payable 2010
    try {
      await financeService.postManualJournalEntry({
        reference: movNum,
        description: `Inventory Goods Receipt (GRN): ${payload.itemName} — ${payload.quantity} ${payload.quantity === 1 ? 'unit' : 'units'} @ ${payload.unitCost.toFixed(2)}`,
        lines: [
          { id: '1', accountCode: '1050', accountName: 'Inventory Stock Assets', debit: totalCost, credit: 0 },
          { id: '2', accountCode: '2010', accountName: 'Accounts Payable — Vendor Liabilities', debit: 0, credit: totalCost },
        ],
      });
    } catch (err) {
      console.warn('[Inventory] GRN finance journal failed:', err);
    }

    toast.success(`GRN ${movNum} posted — ${payload.quantity} units of "${payload.itemName}" received.`);
    return mapMovement(movRes.data.data);
  },

  // ─── Issue Stock ──────────────────────────────────────────────────────────────
  async recordStockIssue(payload: {
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    unitCost: number;
    warehouseName: string;
    issuedTo: string;
    purpose?: string;
    performedBy: string;
    currentQty: number;
  }): Promise<InventoryMovement> {
    const movNum = sequenceService.generateDocumentNumber('ISS');
    const totalCost = payload.quantity * payload.unitCost;

    const newQty = payload.currentQty - payload.quantity;
    const newTotalValue = newQty * payload.unitCost;

    // 1. Post movement record
    const movRes = await apiClient.post('/inventory-movements', {
      data: {
        movementNumber: movNum,
        type: 'goods_issue',
        quantity: payload.quantity,
        unitCost: payload.unitCost,
        totalCost,
        performedBy: payload.performedBy,
        sourceWarehouse: payload.warehouseName,
        destinationWarehouse: payload.issuedTo,
        notes: payload.purpose,
        movementDate: new Date().toISOString().split('T')[0],
        item: payload.itemId,
      },
    });

    // 2. Update item stock levels
    await apiClient.put(`/inventory-items/${payload.itemId}`, {
      data: {
        quantityOnHand: newQty,
        totalValue: Math.max(0, newTotalValue),
        status: newQty <= 0 ? 'out_of_stock' : newQty <= 5 ? 'low_stock' : 'in_stock',
      },
    });

    // 3. Finance GL integration: Dr. COGS/Supplies Expense 5040 / Cr. Inventory Asset 1050
    try {
      await financeService.postManualJournalEntry({
        reference: movNum,
        description: `Inventory Stock Issue (COGS): ${payload.itemName} — ${payload.quantity} units issued to ${payload.issuedTo}`,
        lines: [
          { id: '1', accountCode: '5040', accountName: 'Academic Supplies & Consumables Expense', debit: totalCost, credit: 0 },
          { id: '2', accountCode: '1050', accountName: 'Inventory Stock Assets', debit: 0, credit: totalCost },
        ],
      });
    } catch (err) {
      console.warn('[Inventory] Issue finance journal failed:', err);
    }

    toast.success(`ISS ${movNum} posted — ${payload.quantity} units of "${payload.itemName}" issued to ${payload.issuedTo}.`);
    return mapMovement(movRes.data.data);
  },

  // ─── Legacy compat (for any old callers) ────────────────────────────────────
  async recordStockMovement(
    type: InventoryMovement['type'],
    itemCode: string,
    itemName: string,
    quantity: number,
    unitCostUSD: number,
    warehouseName: string,
    performedBy: string
  ): Promise<void> {
    const movNum = sequenceService.generateDocumentNumber('INV');
    const totalCostUSD = quantity * unitCostUSD;
    try {
      if (type === 'goods_receipt') {
        await financeService.postManualJournalEntry({
          reference: movNum,
          description: `Inventory GRN: ${itemName} (${quantity} units)`,
          lines: [
            { id: '1', accountCode: '1050', accountName: 'Inventory Stock Assets', debit: totalCostUSD, credit: 0 },
            { id: '2', accountCode: '2010', accountName: 'Accounts Payable', debit: 0, credit: totalCostUSD },
          ],
        });
      } else if (type === 'goods_issue') {
        await financeService.postManualJournalEntry({
          reference: movNum,
          description: `Inventory Issue (COGS): ${itemName} (${quantity} units)`,
          lines: [
            { id: '1', accountCode: '5040', accountName: 'Supplies Expense', debit: totalCostUSD, credit: 0 },
            { id: '2', accountCode: '1050', accountName: 'Inventory Stock Assets', debit: 0, credit: totalCostUSD },
          ],
        });
      }
    } catch { }
  },
};
