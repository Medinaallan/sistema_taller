// Detalle de Orden (puede ser parte o servicio)
export interface OrderDetail {
  id: string;
  workOrderId: string;
  type: 'part' | 'service';
  itemId: string; // partId o serviceId
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
