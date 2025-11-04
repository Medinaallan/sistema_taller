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

const LogsPage = () => {
  const [data, setData] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  
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
      size: 120,
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.userName}</div>
          <div className="text-gray-500">{row.original.userRole}</div>
        </div>
      )
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
      size: 80,
      cell: ({ getValue }) => (
        <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
          {getValue() as string}
        </span>
      )
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
      size: 300,
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-900 truncate max-w-xs" title={getValue() as string}>
          {getValue() as string}
        </div>
      )
    },
    { 
      accessorKey: 'ipAddress', 
      header: 'IP',
      size: 100,
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-500 font-mono">
          {getValue() as string}
        </span>
      )
    }
  ];

  // Cargar logs
  const loadLogs = async (page: number = 1, newFilters?: LogFilters) => {
    try {
      setLoading(true);
      const filtersToUse = newFilters || filters;
      const response = await logService.getLogs(page, 50, filtersToUse);
      
      setData(response.logs);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
      setTotal(response.total);
    } catch (error) {
      console.error('Error cargando logs:', error);
      alert('Error cargando los logs. Verifica que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar logs al montar el componente
  useEffect(() => {
    loadLogs();
  }, []);

  // Aplicar filtros
  const handleFilter = () => {
    loadLogs(1, filters);
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
    loadLogs(1, emptyFilters);
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
      loadLogs(currentPage);
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
                <option value="client">Cliente</option>
                <option value="user">Usuario</option>
                <option value="vehicle">Vehículo</option>
                <option value="service">Servicio</option>
                <option value="appointment">Cita</option>
                <option value="workorder">Orden de trabajo</option>
                <option value="auth">Autenticación</option>
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
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
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
                    onClick={() => loadLogs(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => loadLogs(currentPage + 1)}
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


