// Bitácora de acciones
export interface Log {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  description?: string;
  timestamp: Date;
}
