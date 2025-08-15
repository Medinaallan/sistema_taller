// Cita de servicio
export interface Appointment {
  id: string;
  clientId: string;
  vehicleId: string;
  serviceTypeId: string;
  date: Date;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
