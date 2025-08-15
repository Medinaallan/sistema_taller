// Servicio
export interface Service {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  estimatedTime?: string;
  createdAt: Date;
  updatedAt: Date;
}
