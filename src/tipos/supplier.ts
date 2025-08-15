// Proveedor
export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  productsSupplied?: string[]; // productIds
  createdAt: Date;
  updatedAt: Date;
}
