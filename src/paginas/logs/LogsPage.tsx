import { useState, useEffect } from 'react';
import { Card, Button, Input } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { logService, type LogFilters } from '../../servicios/logService';
import type { Log } from '../../tipos';
import type { ColumnDef } from '@tanstack/react-table';
import { 
  ArrowDownTrayIcon, 
  TrashIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const severityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800'
};

const actionColors = {
  CREATE: 'bg-blue-100 text-blue-800',
  UPDATE: 'bg-purple-100 text-purple-800',
  DELETE: 'bg-red-100 text-red-800',
  VIEW: 'bg-gray-100 text-gray-800',
  LOGIN: 'bg-green-100 text-green-800',
  LOGOUT: 'bg-gray-100 text-gray-800'
};

// Tipos de logs
type LogCategory = 'system' | 'business';

interface LogCategoryInfo {
  id: LogCategory;
  name: string;
  description: string;
  icon: string;
  entities: string[];
}

const logCategories: LogCategoryInfo[] = [
  {
    id: 'system',
    name: 'Logs del Sistema',
    description: 'Auditoría informática: inicios de sesión, seguridad, sistema',
    icon: '',
    entities: ['auth', 'user', 'logs', 'system']
  },
  {
    id: 'business',
    name: 'Logs de Negocio',
    description: 'Operaciones del taller: clientes, vehículos, citas, cotizaciones, órdenes',
    icon: '',
    entities: ['client', 'vehicle', 'appointment', 'quotation', 'workorder', 'service']
  }
];

const LogsPage = () => {
  const [data, setData] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [activeCategory, setActiveCategory] = useState<LogCategory>('system');
  
  // Filtros
  const [filters, setFilters] = useState<LogFilters>({
    search: '',
    startDate: '',
    endDate: '',
    userId: '',
    action: '',
    entity: '',
    severity: ''
  });

  // Columnas de la tabla
  const columns: ColumnDef<Log>[] = [
    { 
      accessorKey: 'timestamp', 
      header: 'Fecha/Hora',
      size: 150,
      cell: ({ getValue }) => {
        const date = new Date(getValue() as string);
        return (
          <div className="text-sm">
            <div>{date.toLocaleDateString('es-ES')}</div>
            <div className="text-gray-500">{date.toLocaleTimeString('es-ES')}</div>
          </div>
        );
      }
    },
    { 
      accessorKey: 'userName', 
      header: 'Usuario',
      size: 140,
      cell: ({ row }) => {
        const getUserDisplayName = (userName: string) => {
          if (userName === 'Usuario Anónimo' || userName === 'anonymous') {
            return 'Visitante';
          }
          if (userName === 'System') {
            return 'Sistema';
          }
          return userName;
        };

        const getRoleDisplayName = (userRole: string) => {
          const roleMap: { [key: string]: string } = {
            'admin': 'Administrador',
            'receptionist': 'Recepcionista', 
            'mechanic': 'Mecánico',
            'client': 'Cliente',
            'guest': 'Invitado',
            'system': 'Sistema',
            'unknown': 'Desconocido'
          };
          return roleMap[userRole] || userRole;
        };

        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {getUserDisplayName(row.original.userName)}
            </div>
            <div className="text-xs text-gray-500">
              {getRoleDisplayName(row.original.userRole)}
            </div>
          </div>
        );
      }
    },
    { 
      accessorKey: 'action', 
      header: 'Acción',
      size: 80,
      cell: ({ getValue }) => {
        const action = getValue() as keyof typeof actionColors;
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${actionColors[action] || 'bg-gray-100 text-gray-800'}`}>
            {action}
          </span>
        );
      }
    },
    { 
      accessorKey: 'entity', 
      header: 'Entidad',
      size: 100,
      cell: ({ getValue }) => {
        const getEntityDisplayName = (entity: string) => {
          const entityMap: { [key: string]: string } = {
            'client': 'Cliente',
            'user': 'Usuario',
            'vehicle': 'Vehículo',
            'service': 'Servicio',
            'appointment': 'Cita',
            'quotation': 'Cotización',
            'workorder': 'Orden de Trabajo',
            'auth': 'Autenticación',
            'logs': 'Logs',
            'test': 'Prueba',
            'system': 'Sistema',
            'unknown': 'Desconocido'
          };
          return entityMap[entity] || entity;
        };

        const getEntityColor = (entity: string) => {
          const colorMap: { [key: string]: string } = {
            'client': 'bg-blue-50 text-blue-700',
            'user': 'bg-green-50 text-green-700',
            'vehicle': 'bg-purple-50 text-purple-700',
            'service': 'bg-orange-50 text-orange-700',
            'appointment': 'bg-pink-50 text-pink-700',
            'quotation': 'bg-indigo-50 text-indigo-700',
            'workorder': 'bg-yellow-50 text-yellow-700',
            'auth': 'bg-red-50 text-red-700',
            'logs': 'bg-gray-50 text-gray-700',
            'system': 'bg-slate-50 text-slate-700'
          };
          return colorMap[entity] || 'bg-blue-50 text-blue-700';
        };

        const entity = getValue() as string;
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${getEntityColor(entity)}`}>
            {getEntityDisplayName(entity)}
          </span>
        );
      }
    },
    { 
      accessorKey: 'severity', 
      header: 'Severidad',
      size: 80,
      cell: ({ getValue }) => {
        const severity = getValue() as keyof typeof severityColors;
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${severityColors[severity]}`}>
            {severity}
          </span>
        );
      }
    },
    { 
      accessorKey: 'description', 
      header: 'Descripción',
      size: 350,
      cell: ({ getValue, row }) => {
        const getReadableDescription = (description: string) => {
          // Mapear términos técnicos a descripciones amigables
          let readable = description;

          // Reemplazar términos técnicos
          readable = readable
            .replace(/CREATE en/, 'Creó')
            .replace(/UPDATE en/, 'Actualizó')
            .replace(/DELETE en/, 'Eliminó')
            .replace(/VIEW en/, 'Consultó')
            .replace(/LOGIN/, 'Inició sesión')
            .replace(/LOGOUT/, 'Cerró sesión')
            .replace(/EXITOSO/, '✓')
            .replace(/ERROR \d+/, '❌')
            .replace(/client/, 'cliente')
            .replace(/user/, 'usuario')
            .replace(/vehicle/, 'vehículo')
            .replace(/service/, 'servicio')
            .replace(/appointment/, 'cita')
            .replace(/quotation/, 'cotización')
            .replace(/workorder/, 'orden de trabajo')
            .replace(/auth/, 'autenticación')
            .replace(/logs/, 'registros')
            .replace(/system/, 'sistema');

          // Casos especiales para hacer más legible
          if (description.includes('Login exitoso')) {
            readable = ' Usuario inició sesión correctamente';
          } else if (description.includes('Intento de login fallido')) {
            readable = ' Intento de inicio de sesión fallido';
          } else if (description.includes('Logout')) {
            readable = ' Usuario cerró sesión';
          } else if (description.includes('Log de prueba manual')) {
            readable = ' Registro de prueba del sistema';
          } else if (description.includes('Logs cleanup')) {
            readable = ' Limpieza automática de registros antiguos';
          }

          return readable;
        };

        const originalDescription = getValue() as string;
        const readableDescription = getReadableDescription(originalDescription);

        return (
          <div className="text-sm">
            <div className="text-gray-900 font-medium truncate max-w-xs" title={originalDescription}>
              {readableDescription}
            </div>
            {row.original.entityId && (
              <div className="text-xs text-gray-500">
                ID: {row.original.entityId}
              </div>
            )}
          </div>
        );
      }
    },
    { 
      accessorKey: 'ipAddress', 
      header: 'Dirección IP',
      size: 140,
      cell: ({ getValue }) => {
        const ip = getValue() as string;
        
        const getIpDisplayName = (ipAddress: string) => {
          if (!ipAddress || ipAddress === 'unknown') {
            return 'No disponible';
          }
          if (ipAddress === 'system') {
            return 'Sistema interno';
          }
          if (ipAddress.includes('::1') || ipAddress === '127.0.0.1') {
            return `${ipAddress} (Local)`;
          }
          return ipAddress;
        };

        const getIpColor = (ipAddress: string) => {
          if (!ipAddress || ipAddress === 'unknown') {
            return 'text-gray-400';
          }
          if (ipAddress === 'system') {
            return 'text-blue-600';
          }
          if (ipAddress.includes('::1') || ipAddress === '127.0.0.1') {
            return 'text-green-600';
          }
          return 'text-gray-700';
        };

        return (
          <div className="text-xs">
            <div className={`font-mono ${getIpColor(ip)}`}>
              {getIpDisplayName(ip)}
            </div>
          </div>
        );
      }
    }
  ];

  // Cargar logs filtrados por categoría
  const loadLogs = async (page: number = 1, newFilters?: LogFilters, category?: LogCategory) => {
    try {
      setLoading(true);
      const filtersToUse = newFilters || filters;
      const categoryToUse = category || activeCategory;
      
      // Obtener todos los logs primero
      const response = await logService.getLogs(page, 200, filtersToUse); // Aumentar límite para filtrar localmente
      
      // Filtrar por categoría
      const categoryInfo = logCategories.find(cat => cat.id === categoryToUse);
      const filteredLogs = categoryInfo 
        ? response.logs.filter(log => categoryInfo.entities.includes(log.entity))
        : response.logs;
      
      // Aplicar paginación manual
      const itemsPerPage = 50;
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
      const totalFilteredPages = Math.ceil(filteredLogs.length / itemsPerPage);
      
      setData(paginatedLogs);
      setTotalPages(totalFilteredPages);
      setCurrentPage(page);
      setTotal(filteredLogs.length);
    } catch (error) {
      console.error('Error cargando logs:', error);
      alert('Error cargando los logs. Verifica que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar logs al montar el componente y cuando cambie la categoría
  useEffect(() => {
    loadLogs(1, filters, activeCategory);
  }, [activeCategory]);

  // Cargar logs iniciales
  useEffect(() => {
    loadLogs();
  }, []);

  // Cambiar categoría
  const handleCategoryChange = (category: LogCategory) => {
    setActiveCategory(category);
    setCurrentPage(1); // Resetear a la primera página
  };

  // Aplicar filtros
  const handleFilter = () => {
    loadLogs(1, filters, activeCategory);
    setShowFilters(false);
  };

  // Limpiar filtros
  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      startDate: '',
      endDate: '',
      userId: '',
      action: '',
      entity: '',
      severity: ''
    };
    setFilters(emptyFilters);
    loadLogs(1, emptyFilters, activeCategory);
    setShowFilters(false);
  };

  // Exportar logs
  const handleExport = async () => {
    try {
      setLoading(true);
      const blob = await logService.exportLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando logs:', error);
      alert('Error exportando los logs');
    } finally {
      setLoading(false);
    }
  };

  // Ver detalles del log
  const handleViewDetails = (log: Log) => {
    setSelectedLog(log);
  };

  // Limpiar logs antiguos
  const handleCleanLogs = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar logs antiguos (>90 días)?')) return;
    
    try {
      setLoading(true);
      const result = await logService.cleanOldLogs(90);
      alert(`Se eliminaron ${result.deleted} logs antiguos`);
      loadLogs(currentPage, filters, activeCategory);
    } catch (error) {
      console.error('Error limpiando logs:', error);
      alert('Error limpiando logs antiguos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs del Sistema</h1>
          <p className="text-gray-600">Auditoría y registro de actividades ({total} registros)</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Exportar
          </Button>
          
          <Button
            variant="outline"
            onClick={handleCleanLogs}
            disabled={loading}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
            Limpiar Antiguos
          </Button>
        </div>
      </div>

      {/* Pestañas de categorías */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {logCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeCategory === category.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{category.icon}</span>
                <div className="text-left">
                  <div className="font-semibold">{category.name}</div>
                  <div className="text-xs text-gray-400">{category.description}</div>
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Búsqueda
              </label>
              <Input
                type="text"
                placeholder="Buscar en descripción..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acción
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              >
                <option value="">Todas las acciones</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="VIEW">VIEW</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entidad
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.entity}
                onChange={(e) => setFilters(prev => ({ ...prev, entity: e.target.value }))}
              >
                <option value="">Todas las entidades</option>
                <option value="client">🏢 Cliente</option>
                <option value="user">👤 Usuario</option>
                <option value="vehicle">🚗 Vehículo</option>
                <option value="service">🔧 Servicio</option>
                <option value="appointment">📅 Cita</option>
                <option value="quotation">💰 Cotización</option>
                <option value="workorder">📋 Orden de trabajo</option>
                <option value="auth">🔐 Autenticación</option>
                <option value="logs">📄 Registros</option>
                <option value="system">⚙️ Sistema</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severidad
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              >
                <option value="">Todas las severidades</option>
                <option value="LOW">🟢 Baja</option>
                <option value="MEDIUM">🟡 Media</option>
                <option value="HIGH">🟠 Alta</option>
                <option value="CRITICAL">🔴 Crítica</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpiar
            </Button>
            <Button onClick={handleFilter}>
              Aplicar Filtros
            </Button>
          </div>
        </Card>
      )}

      {/* Tabla de logs */}
      <Card>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <TanStackCrudTable 
              columns={columns} 
              data={data} 
              onEdit={handleViewDetails}
            />
            
            {/* Paginación personalizada */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 px-4 py-2 border-t">
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages} ({total} registros)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => loadLogs(currentPage - 1, filters, activeCategory)}
                    disabled={currentPage === 1 || loading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => loadLogs(currentPage + 1, filters, activeCategory)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal de detalles del log */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Detalles del Log</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>ID:</strong>
                  <p className="text-sm text-gray-600 font-mono">{selectedLog.id}</p>
                </div>
                <div>
                  <strong>Timestamp:</strong>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedLog.timestamp).toLocaleString('es-ES')}
                  </p>
                </div>
                <div>
                  <strong>Usuario:</strong>
                  <p className="text-sm text-gray-600">{selectedLog.userName} ({selectedLog.userRole})</p>
                </div>
                <div>
                  <strong>IP:</strong>
                  <p className="text-sm text-gray-600 font-mono">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <strong>Acción:</strong>
                  <span className={`px-2 py-1 text-xs rounded-full ${actionColors[selectedLog.action as keyof typeof actionColors] || 'bg-gray-100 text-gray-800'}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <strong>Severidad:</strong>
                  <span className={`px-2 py-1 text-xs rounded-full ${severityColors[selectedLog.severity]}`}>
                    {selectedLog.severity}
                  </span>
                </div>
              </div>
              
              <div>
                <strong>Descripción:</strong>
                <p className="text-sm text-gray-600 mt-1">{selectedLog.description}</p>
              </div>
              
              {selectedLog.details && (
                <div>
                  <strong>Detalles técnicos:</strong>
                  <pre className="text-xs bg-gray-50 p-3 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.userAgent && (
                <div>
                  <strong>User Agent:</strong>
                  <p className="text-xs text-gray-500 font-mono mt-1 break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPage;


