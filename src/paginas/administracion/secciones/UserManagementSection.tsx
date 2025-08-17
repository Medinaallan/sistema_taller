import { useState } from 'react';
import { CrudTable } from '../../../componentes/comunes/CrudTable';

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
}

const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    fullName: 'Administrador del Sistema',
    email: 'admin@taller.com',
    role: 'admin',
    status: 'active',
    lastLogin: new Date(),
    createdAt: new Date()
  }
];

const columns = [
  { key: 'username' as keyof User, label: 'Usuario' },
  { key: 'fullName' as keyof User, label: 'Nombre Completo' },
  { key: 'email' as keyof User, label: 'Correo' },
  { key: 'role' as keyof User, label: 'Rol' },
  { key: 'status' as keyof User, label: 'Estado' }
];

export function UserManagementSection() {
  const [users, setUsers] = useState<User[]>(mockUsers);

  const handleEdit = (user: User) => {
    // TODO: Implement edit functionality
    console.log('Edit user:', user);
  };

  const handleDelete = (user: User) => {
    setUsers(users.filter(u => u.id !== user.id));
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="mt-1 text-sm text-gray-500">
            Administra los usuarios del sistema y sus roles
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Agregar Usuario
          </button>
        </div>
      </div>

      <div className="mt-8">
        <CrudTable
          data={users}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900">Roles del Sistema</h3>
        <div className="mt-4 border-t border-gray-200 pt-4">
          <dl className="space-y-4">
            <div>
              <dt className="font-medium text-gray-600">Administrador</dt>
              <dd className="mt-1 text-sm text-gray-500">Acceso completo al sistema y configuraciones</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Recepcionista</dt>
              <dd className="mt-1 text-sm text-gray-500">Gestión de clientes, citas y órdenes de trabajo</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Mecánico</dt>
              <dd className="mt-1 text-sm text-gray-500">Acceso a órdenes de trabajo y diagnósticos</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Cliente</dt>
              <dd className="mt-1 text-sm text-gray-500">Vista limitada de sus vehículos y servicios</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
