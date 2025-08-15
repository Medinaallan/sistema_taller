// Producto
export interface Product {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  price: number;
  cost?: number;
  stock: number;
  supplierId?: string;
  createdAt: Date;
  updatedAt: Date;
}
