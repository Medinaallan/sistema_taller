import { useState, useEffect } from 'react';
import { 
  UserIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'mechanic' | 'receptionist' | 'client';
  status: 'active' | 'inactive';
  permissions: UserPermissions;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  mustChangePassword: boolean;
}

interface UserPermissions {
  // Módulos principales
  dashboard: boolean;
  clients: boolean;
  vehicles: boolean;
  workOrders: boolean;
  inventory: boolean;
  appointments: boolean;
  reports: boolean;
  administration: boolean;
  
  // Permisos específicos
  canCreateWorkOrders: boolean;
  canEditWorkOrders: boolean;
  canDeleteWorkOrders: boolean;
  canViewReports: boolean;
  canManageInventory: boolean;
  canManageUsers: boolean;
  canConfigureSystem: boolean;
  canProcessPayments: boolean;
  canGenerateInvoices: boolean;
  canManageClients: boolean;
}

const defaultPermissions: UserPermissions = {
  dashboard: true,
  clients: false,
  vehicles: false,
  workOrders: false,
  inventory: false,
  appointments: false,
  reports: false,
  administration: false,
  canCreateWorkOrders: false,
  canEditWorkOrders: false,
  canDeleteWorkOrders: false,
  canViewReports: false,
  canManageInventory: false,
  canManageUsers: false,
  canConfigureSystem: false,
  canProcessPayments: false,
  canGenerateInvoices: false,
  canManageClients: false,
};

const rolePermissions: Record<string, UserPermissions> = {
  admin: {
    dashboard: true,
    clients: true,
    vehicles: true,
    workOrders: true,
    inventory: true,
    appointments: true,
    reports: true,
    administration: true,
    canCreateWorkOrders: true,
    canEditWorkOrders: true,
    canDeleteWorkOrders: true,
    canViewReports: true,
    canManageInventory: true,
    canManageUsers: true,
    canConfigureSystem: true,
    canProcessPayments: true,
    canGenerateInvoices: true,
    canManageClients: true,
  },
  mechanic: {
    dashboard: true,
    clients: true,
    vehicles: true,
    workOrders: true,
    inventory: true,
    appointments: true,
    reports: false,
    administration: false,
    canCreateWorkOrders: false,
    canEditWorkOrders: true,
    canDeleteWorkOrders: false,
    canViewReports: false,
    canManageInventory: false,
    canManageUsers: false,
    canConfigureSystem: false,
    canProcessPayments: false,
    canGenerateInvoices: false,
    canManageClients: false,
  },
  receptionist: {
    dashboard: true,
    clients: true,
    vehicles: true,
    workOrders: true,
    inventory: false,
    appointments: true,
    reports: false,
    administration: false,
    canCreateWorkOrders: true,
    canEditWorkOrders: true,
    canDeleteWorkOrders: false,
    canViewReports: false,
    canManageInventory: false,
    canManageUsers: false,
    canConfigureSystem: false,
    canProcessPayments: true,
    canGenerateInvoices: true,
    canManageClients: true,
  },
  client: {
    ...defaultPermissions,
    dashboard: true,
  }
};

const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    fullName: 'Administrador del Sistema',
    email: 'admin@taller.com',
    phone: '+504 9999-9999',
    role: 'admin',
    status: 'active',
    permissions: rolePermissions.admin,
    lastLogin: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    mustChangePassword: false
  },
  {
    id: '2',
    username: 'recepcionista1',
    fullName: 'María González',
    email: 'maria@taller.com',
    phone: '+504 8888-8888',
    role: 'receptionist',
    status: 'active',
    permissions: rolePermissions.receptionist,
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
    mustChangePassword: false
  },
  {
    id: '3',
    username: 'mecanico1',
    fullName: 'Carlos Rodríguez',
    email: 'carlos@taller.com',
    phone: '+504 7777-7777',
    role: 'mechanic',
    status: 'active',
    permissions: rolePermissions.mechanic,
    lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date(),
    mustChangePassword: true
  }
];

export function UserManagementSection() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Cargar usuarios desde el SP
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${apiUrl}/users/list`);
      
      if (!response.ok) {
        console.error('Error fetching users:', response.status);
        // Usar datos mockeados si hay error
        return;
      }
      
      const result = await response.json();
      console.log('✅ Usuarios obtenidos del SP:', result.data);
      
      if (result.success && Array.isArray(result.data)) {
        // Mapear datos del SP al formato de User
        const mappedUsers: User[] = result.data
          .filter((spUser: any) => spUser.rol?.toLowerCase() !== 'cliente') // Excluir clientes
          .map((spUser: any) => ({
            id: spUser.usuario_id?.toString() || '',
            username: spUser.nombre_completo || '',
            fullName: spUser.nombre_completo || '',
            email: spUser.correo || '',
            phone: spUser.telefono || '',
            role: (spUser.rol?.toLowerCase() || 'client') as User['role'],
            status: 'active' as const,
            permissions: rolePermissions[spUser.rol?.toLowerCase() || 'client'] || defaultPermissions,
            lastLogin: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            mustChangePassword: false
          }));
        
        console.log(' Usuarios mapeados (excluyendo clientes):', mappedUsers);
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error(' Error cargando usuarios:', error);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDelete = (user: User) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      setUsers(users.filter(u => u.id !== user.id));
    }
  };

  const handlePermissions = (user: User) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleToggleStatus = (user: User) => {
    setUsers(users.map(u => 
      u.id === user.id 
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      mechanic: 'Mecánico',
      receptionist: 'Recepcionista',
      client: 'Cliente'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const formatLastLogin = (date?: Date) => {
    if (!date) return 'Nunca';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    return 'Ahora';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="mt-1 text-sm text-gray-500">
            Administra los usuarios del sistema, roles y permisos de acceso
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowUserModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Usuario
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, usuario o email..."
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Rol
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="receptionist">Recepcionista</option>
              <option value="mechanic">Mecánico</option>
              <option value="client">Cliente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Información
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone || 'Sin teléfono'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'mechanic' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'receptionist' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {user.status === 'active' ? (
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircleIcon className="h-3 w-3 mr-1" />
                        )}
                        {user.status === 'active' ? 'Activo' : 'Inactivo'}
                      </button>
                      {user.mustChangePassword && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          <KeyIcon className="h-3 w-3 mr-1" />
                          Cambio de clave
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatLastLogin(user.lastLogin)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handlePermissions(user)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        title="Gestionar Permisos"
                      >
                        <ShieldCheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                        title="Restablecer Contraseña"
                      >
                        <KeyIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Editar Usuario"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Eliminar Usuario"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron usuarios</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza agregando un nuevo usuario'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
              <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Usuarios Activos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Administradores</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <KeyIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Cambio de Clave</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.mustChangePassword).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity and Security Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {users
              .filter(u => u.lastLogin)
              .sort((a, b) => (b.lastLogin?.getTime() || 0) - (a.lastLogin?.getTime() || 0))
              .slice(0, 5)
              .map((user) => (
                <div key={user.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Último acceso: {formatLastLogin(user.lastLogin)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'mechanic' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'receptionist' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Security Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estado de Seguridad</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Usuarios con contraseñas seguras</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {users.filter(u => !u.mustChangePassword).length}/{users.length}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm text-gray-600">Usuarios inactivos</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {users.filter(u => u.status === 'inactive').length}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-600">Sin acceso reciente ({'>'}7 días)</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {users.filter(u => {
                  if (!u.lastLogin) return true;
                  const daysSinceLogin = Math.floor((new Date().getTime() - u.lastLogin.getTime()) / (1000 * 60 * 60 * 24));
                  return daysSinceLogin > 7;
                }).length}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">Usuarios con permisos elevados</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {users.filter(u => u.role === 'admin' || u.permissions.canManageUsers).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const inactiveUsers = users.filter(u => u.status === 'inactive');
              if (inactiveUsers.length > 0) {
                alert(`Hay ${inactiveUsers.length} usuario(s) inactivo(s) que podrían requerir atención.`);
              } else {
                alert('Todos los usuarios están activos.');
              }
            }}
            className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Revisar Usuarios Inactivos</span>
          </button>
          
          <button
            onClick={() => {
              const usersNeedingPasswordChange = users.filter(u => u.mustChangePassword);
              if (usersNeedingPasswordChange.length > 0) {
                alert(`${usersNeedingPasswordChange.length} usuario(s) necesitan cambiar su contraseña.`);
              } else {
                alert('Todas las contraseñas están actualizadas.');
              }
            }}
            className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <KeyIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Revisar Contraseñas</span>
          </button>
          
          <button
            onClick={() => {
              const data = users.map(u => ({
                Usuario: u.username,
                Nombre: u.fullName,
                Email: u.email,
                Rol: getRoleLabel(u.role),
                Estado: u.status === 'active' ? 'Activo' : 'Inactivo',
                'Último Acceso': formatLastLogin(u.lastLogin)
              }));
              console.log('Exportar datos:', data);
              alert('Funcionalidad de exportación lista para implementar.');
            }}
            className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <DocumentArrowDownIcon className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Exportar Usuarios</span>
          </button>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSave={(userData) => {
            if (selectedUser) {
              // Update existing user - ya fue guardado en la BD vía SP_EDITAR_USUARIO en el modal
              setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...userData, updatedAt: new Date() } : u));
              console.log('✅ Usuario actualizado localmente y en BD');
            } else {
              // Add new user
              const newUser: User = {
                id: Date.now().toString(),
                username: userData.username || '',
                fullName: userData.fullName || '',
                email: userData.email || '',
                phone: userData.phone,
                role: userData.role || 'receptionist',
                status: userData.status || 'active',
                permissions: rolePermissions[userData.role || 'receptionist'] || defaultPermissions,
                createdAt: new Date(),
                updatedAt: new Date(),
                mustChangePassword: true
              };
              setUsers([...users, newUser]);
            }
            setShowUserModal(false);
            setSelectedUser(null);
            // Recargar lista después de 500ms para asegurar BD actualizada
            setTimeout(() => loadUsers(), 500);
          }}
        />
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <PermissionsModal
          user={selectedUser}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedUser(null);
          }}
          onSave={(permissions) => {
            setUsers(users.map(u => 
              u.id === selectedUser.id 
                ? { ...u, permissions, updatedAt: new Date() }
                : u
            ));
            setShowPermissionsModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <PasswordResetModal
          user={selectedUser}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSave={() => {
            setUsers(users.map(u => 
              u.id === selectedUser.id 
                ? { ...u, mustChangePassword: true, updatedAt: new Date() }
                : u
            ));
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

// User Modal Component
interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
}

function UserModal({ user, onClose, onSave }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'receptionist',
    status: user?.status || 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (user) {
        // Editar usuario existente usando SP_EDITAR_USUARIO
        console.log('📝 Editando usuario:', user.id);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        
        const response = await fetch(`${apiUrl}/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre_completo: formData.fullName,
            correo: formData.email,
            telefono: formData.phone
          })
        });

        const result = await response.json();
        console.log('✅ Resultado de edición:', result);

        if (!response.ok || !result.success) {
          throw new Error(result.msg || result.message || 'Error al editar usuario');
        }

        alert('✅ Usuario actualizado exitosamente');
        onSave(formData);
      } else {
        // Crear nuevo usuario
        onSave(formData);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error:', errorMsg);
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de Usuario
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                disabled={!!user}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
              />
              {user && <p className="text-xs text-gray-500 mt-1">No se puede cambiar</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Se validará con SP_VALIDAR_CORREO_USUARIO</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {!user && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as User['role']})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="receptionist">Recepcionista</option>
                    <option value="mechanic">Mecánico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as User['status']})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '⏳ Guardando...' : (user ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Permissions Modal Component
interface PermissionsModalProps {
  user: User;
  onClose: () => void;
  onSave: (permissions: UserPermissions) => void;
}

function PermissionsModal({ user, onClose, onSave }: PermissionsModalProps) {
  const [permissions, setPermissions] = useState<UserPermissions>(user.permissions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(permissions);
  };

  const updatePermission = (key: keyof UserPermissions, value: boolean) => {
    setPermissions({ ...permissions, [key]: value });
  };

  const permissionSections = [
    {
      title: 'Módulos del Sistema',
      permissions: [
        { key: 'dashboard' as keyof UserPermissions, label: 'Dashboard', description: 'Acceso al panel principal' },
        { key: 'clients' as keyof UserPermissions, label: 'Clientes', description: 'Gestión de clientes' },
        { key: 'vehicles' as keyof UserPermissions, label: 'Vehículos', description: 'Gestión de vehículos' },
        { key: 'workOrders' as keyof UserPermissions, label: 'Órdenes de Trabajo', description: 'Gestión de órdenes de trabajo' },
        { key: 'inventory' as keyof UserPermissions, label: 'Inventario', description: 'Gestión de inventario' },
        { key: 'appointments' as keyof UserPermissions, label: 'Citas', description: 'Gestión de citas' },
        { key: 'reports' as keyof UserPermissions, label: 'Reportes', description: 'Acceso a reportes' },
        { key: 'administration' as keyof UserPermissions, label: 'Administración', description: 'Configuración del sistema' },
      ]
    },
    {
      title: 'Permisos Específicos',
      permissions: [
        { key: 'canCreateWorkOrders' as keyof UserPermissions, label: 'Crear Órdenes', description: 'Crear nuevas órdenes de trabajo' },
        { key: 'canEditWorkOrders' as keyof UserPermissions, label: 'Editar Órdenes', description: 'Modificar órdenes de trabajo' },
        { key: 'canDeleteWorkOrders' as keyof UserPermissions, label: 'Eliminar Órdenes', description: 'Eliminar órdenes de trabajo' },
        { key: 'canViewReports' as keyof UserPermissions, label: 'Ver Reportes', description: 'Acceso a reportes del sistema' },
        { key: 'canManageInventory' as keyof UserPermissions, label: 'Gestionar Inventario', description: 'Modificar inventario' },
        { key: 'canManageUsers' as keyof UserPermissions, label: 'Gestionar Usuarios', description: 'Administrar usuarios del sistema' },
        { key: 'canConfigureSystem' as keyof UserPermissions, label: 'Configurar Sistema', description: 'Acceso a configuraciones' },
        { key: 'canProcessPayments' as keyof UserPermissions, label: 'Procesar Pagos', description: 'Gestionar pagos y facturación' },
        { key: 'canGenerateInvoices' as keyof UserPermissions, label: 'Generar Facturas', description: 'Crear facturas' },
        { key: 'canManageClients' as keyof UserPermissions, label: 'Gestionar Clientes', description: 'Administrar información de clientes' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Permisos de {user.fullName}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {permissionSections.map((section) => (
              <div key={section.title} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3">{section.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.permissions.map((perm) => (
                    <div key={perm.key} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={perm.key}
                          type="checkbox"
                          checked={permissions[perm.key]}
                          onChange={(e) => updatePermission(perm.key, e.target.checked)}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={perm.key} className="font-medium text-gray-700">
                          {perm.label}
                        </label>
                        <p className="text-gray-500 text-xs">{perm.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Guardar Permisos
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Password Reset Modal Component
interface PasswordResetModalProps {
  user: User;
  onClose: () => void;
  onSave: () => void;
}

function PasswordResetModal({ user, onClose, onSave }: PasswordResetModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requireChange, setRequireChange] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    onSave();
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
    setConfirmPassword(result);
  };

  const copyToClipboard = async () => {
    if (newPassword) {
      try {
        await navigator.clipboard.writeText(newPassword);
        alert('Contraseña copiada al portapapeles');
      } catch (err) {
        console.error('Error al copiar:', err);
        // Fallback para navegadores que no soportan clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = newPassword;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Contraseña copiada al portapapeles');
      }
    }
  };

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score, label: 'Débil', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Moderada', color: 'bg-yellow-500' };
    return { score, label: 'Fuerte', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Restablecer Contraseña
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Establecer nueva contraseña para <strong>{user.fullName}</strong>
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pr-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  minLength={6}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  {newPassword && (
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="mr-2 p-1 text-gray-400 hover:text-gray-600"
                      title="Copiar contraseña"
                    >
                      📋
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="mr-3 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Fortaleza de la contraseña:</span>
                    <span className={`font-medium ${
                      strength.label === 'Fuerte' ? 'text-green-600' :
                      strength.label === 'Moderada' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${(strength.score / 6) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                minLength={6}
              />
            </div>

            <div className="flex items-center">
              <input
                id="requireChange"
                type="checkbox"
                checked={requireChange}
                onChange={(e) => setRequireChange(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requireChange" className="ml-2 block text-sm text-gray-900">
                Requerir cambio de contraseña en el próximo inicio de sesión
              </label>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Generador de Contraseñas</h4>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  🎲 Generar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  12 caracteres
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Mayúsculas y minúsculas
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Números
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Símbolos especiales
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Restablecer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
