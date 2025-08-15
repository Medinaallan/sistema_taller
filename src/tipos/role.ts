// Rol de usuario
export interface Role {
  id: string;
  name: string; // Ej: 'admin', 'mechanic', 'receptionist', 'client'
  description?: string;
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}
