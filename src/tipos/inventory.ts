// Inventario
export interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  minStock: number;
  maxStock?: number;
  location?: string;
  supplierId?: string;
  lastEntryDate?: Date;
  lastExitDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
