import { useState, useEffect } from 'react';
import { Modal, Button } from '../comunes/UI';
import { TanStackCrudTable } from '../comunes/TanStackCrudTable';
import NewAppointmentModal from '../appointments/NewAppointmentModal';
import EditAppointmentModal from '../appointments/EditAppointmentModal';
import AppointmentActions from '../appointments/AppointmentActions';
import type { ColumnDef } from '@tanstack/react-table';
import type { WorkOrder, Appointment, Quotation, Invoice } from '../../tipos';
import { mockWorkOrders, mockQuotations, mockInvoices } from '../../utilidades/globalMockDatabase';
import { appointmentsService, servicesService } from '../../servicios/apiService';
import { showError, showAlert, showConfirm } from '../../utilidades/sweetAlertHelpers';
import { obtenerClientes } from '../../servicios/clientesApiService';
import { FunnelIcon, ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utilidades/globalMockDatabase';

// Definición de columnas para cada tipo
const workOrderColumns: ColumnDef<WorkOrder>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: 'description', header: 'Descripción' },
  { 
    accessorKey: 'estimatedCompletionDate', 
    header: 'Fecha Estimada',
    cell: (info) => new Date(info.getValue() as string).toLocaleDateString()
  },
  { 
    accessorKey: 'totalCost', 
    header: 'Costo Total',
    cell: (info) => formatCurrency(info.getValue() as number)
  },
];

const quotationColumns: ColumnDef<Quotation>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { accessorKey: 'vehicleId', header: 'Vehículo' },
  { 
    accessorKey: 'total', 
    header: 'Total',
    cell: (info) => formatCurrency(info.getValue() as number)
  },
  { accessorKey: 'status', header: 'Estado' },
];

const invoiceColumns: ColumnDef<Invoice>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'invoiceNumber', header: 'No. Factura' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { 
    accessorKey: 'total', 
    header: 'Total',
    cell: (info) => formatCurrency(info.getValue() as number)
  },
  { accessorKey: 'status', header: 'Estado' },
];

interface GestionModalProps {
  type: 'workOrders' | 'appointments' | 'quotations' | 'invoices';
  isOpen: boolean;
  onClose: () => void;
}

export function GestionModal({ type, isOpen, onClose }: GestionModalProps) {
  const [workOrders, setWorkOrders] = useState(mockWorkOrders);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [quotations, setQuotations] = useState(mockQuotations);
  const [invoices, setInvoices] = useState(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [isEditAppointmentModalOpen, setIsEditAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);

  // Función para buscar el nombre del cliente por ID
  const getClienteName = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.name : clienteId;
  };

  // Función para buscar el nombre del servicio por ID
  const getServiceName = (servicioId: string) => {
    const servicio = servicios.find(s => s.id === servicioId);
    return servicio ? servicio.name || servicio.nombre : servicioId;
  };

  // Función para cargar clientes
  const loadClientes = async () => {
    try {
      const clientesData = await obtenerClientes();
      setClientes(clientesData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  // Función para cargar servicios
  const loadServicios = async () => {
    try {
      const response = await servicesService.getAll();
      if (response.success) {
        const mappedServices = response.data.map((service: any) => ({
          id: service.id,
          name: service.nombre,
          nombre: service.nombre,
        }));
        setServicios(mappedServices);
      }
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  };

  // Columnas dinámicas para appointments que usan las funciones helper
  const appointmentColumns: ColumnDef<Appointment>[] = [
    { accessorKey: 'id', header: 'ID', size: 120 },
    { 
      accessorKey: 'clientId', 
      header: 'Cliente',
      cell: (info) => getClienteName(info.getValue() as string),
      size: 180
    },
    { 
      accessorKey: 'serviceTypeId', 
      header: 'Servicio',
      cell: (info) => getServiceName(info.getValue() as string),
      size: 150
    },
    { 
      accessorKey: 'date', 
      header: 'Fecha',
      cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
      size: 100
    },
    { accessorKey: 'time', header: 'Hora', size: 80 },
    { 
      id: 'actions',
      header: 'Estado y Acciones',
      cell: (info) => (
        <AppointmentActions
          appointment={info.row.original}
          clientName={getClienteName(info.row.original.clientId)}
          serviceName={getServiceName(info.row.original.serviceTypeId)}
          onUpdate={loadAppointments}
        />
      ),
      size: 200
    },
  ];

  // Función para cargar citas desde el backend
  const loadAppointments = async () => {
    if (type !== 'appointments') return;
    
    try {
      setLoadingAppointments(true);
      const response = await appointmentsService.getAll();
      
      if (response.success) {
        // Convertir los datos del CSV al formato esperado por el frontend
        const appointmentsData = response.data.map((csvAppointment: any) => ({
          id: csvAppointment.id,
          date: new Date(csvAppointment.fecha),
          time: csvAppointment.hora,
          clientId: csvAppointment.clienteId,
          vehicleId: csvAppointment.vehiculoId,
          serviceTypeId: csvAppointment.servicio,
          status: csvAppointment.estado,
          notes: (csvAppointment.notas || '').replace(/^"|"$/g, ''), // Remover comillas extras
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        
        setAppointments(appointmentsData);
      } else {
        console.error('Error cargando citas:', response.message);
      }
    } catch (error) {
      console.error('Error cargando citas:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Cargar citas cuando se abre el modal de tipo 'appointments'
  useEffect(() => {
    if (isOpen && type === 'appointments') {
      const loadAllData = async () => {
        await Promise.all([
          loadAppointments(),
          loadClientes(),
          loadServicios()
        ]);
      };
      loadAllData();
    }
  }, [isOpen, type]);

  // Función para filtrar los datos
  const filterData = (data: any[]) => {
    return data.filter(item => {
      const matchesSearch = searchTerm === '' || 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesStatus = statusFilter === '' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const modalConfig = {
    workOrders: {
      title: 'Órdenes de Trabajo',
      columns: workOrderColumns,
      data: workOrders,
      setData: setWorkOrders,
    },
    appointments: {
      title: 'Citas',
      columns: appointmentColumns,
      data: appointments,
      setData: setAppointments,
    },
    quotations: {
      title: 'Cotizaciones',
      columns: quotationColumns,
      data: quotations,
      setData: setQuotations,
    },
    invoices: {
      title: 'Facturas',
      columns: invoiceColumns,
      data: invoices,
      setData: setInvoices,
    },
  };

  const config = modalConfig[type];

  const handleEdit = (item: any) => {
    if (type === 'appointments') {
      setSelectedAppointment(item);
      setIsEditAppointmentModalOpen(true);
    } else {
      console.log('Editar:', item);
    }
  };

  const handleDelete = async (item: any) => {
    if (type === 'appointments') {
      if (await showConfirm(`¿Está seguro de que desea eliminar la cita ${item.id}?`)) {
        try {
          const response = await appointmentsService.delete(item.id);
          if (response.success) {
            // Recargar la lista después de eliminar
            await loadAppointments();
          } else {
            showError('Error al eliminar la cita: ' + response.message);
          }
        } catch (error) {
          console.error('Error eliminando cita:', error);
          showError('Error al eliminar la cita');
        }
      }
    } else {
      // Para otros tipos, usar la lógica original
      const updatedData = config.data.filter((d: any) => d.id !== item.id);
      switch (type) {
        case 'workOrders':
          setWorkOrders(updatedData as WorkOrder[]);
          break;
        case 'quotations':
          setQuotations(updatedData as Quotation[]);
          break;
        case 'invoices':
          setInvoices(updatedData as Invoice[]);
          break;
      }
    }
  };

  const handleCreateAppointment = async (_newAppointment: Omit<Appointment, 'id'>) => {
    // La cita ya se creó en el backend desde el modal NewAppointmentModal
    // Solo necesitamos recargar la lista para mostrar la nueva cita
    await loadAppointments();
  };

  const handleEditAppointment = async () => {
    // La cita ya se actualizó en el backend desde el modal EditAppointmentModal
    // Solo necesitamos recargar la lista para mostrar los cambios
    await loadAppointments();
  };

  const handleCloseEditModal = () => {
    setIsEditAppointmentModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleNewRecord = () => {
    if (type === 'appointments') {
      setIsNewAppointmentModalOpen(true);
    } else {
      showAlert('Nuevo registro');
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={config.title} size="xl" className="sm:max-w-7xl">
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{filterData(config.data).length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {config.data.filter((item: any) => item.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <FunnelIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {config.data.filter((item: any) => item.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ArrowPathIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de herramientas */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="in-progress">En Progreso</option>
                <option value="completed">Completados</option>
                <option value="cancelled">Cancelados</option>
              </select>
              <Button variant="secondary">
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filtrar
              </Button>
            </div>
            <Button onClick={handleNewRecord}>
              Nuevo {config.title.slice(0, -1)}
            </Button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {type === 'appointments' && loadingAppointments ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">Cargando citas...</div>
            </div>
          ) : (
            <TanStackCrudTable
              columns={config.columns}
              data={filterData(config.data)}
              onEdit={type === 'appointments' ? undefined : handleEdit}
              onDelete={type === 'appointments' ? undefined : handleDelete}
            />
          )}
        </div>

        {/* Footer con resumen */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              {config.data.length} {config.title.toLowerCase()} en total
            </div>
            <div className="flex space-x-4">
              <span>{config.data.filter((item: any) => item.status === 'pending').length} pendientes</span>
              <span>{config.data.filter((item: any) => item.status === 'in-progress').length} en progreso</span>
              <span>{config.data.filter((item: any) => item.status === 'completed').length} completados</span>
              <span>{config.data.filter((item: any) => item.status === 'cancelled').length} cancelados</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    {/* Modal de nueva cita - solo se muestra si el tipo es appointments */}
    {type === 'appointments' && (
      <>
        <NewAppointmentModal
          isOpen={isNewAppointmentModalOpen}
          onClose={() => setIsNewAppointmentModalOpen(false)}
          onSubmit={handleCreateAppointment}
        />
        
        <EditAppointmentModal
          isOpen={isEditAppointmentModalOpen}
          onClose={handleCloseEditModal}
          onSubmit={handleEditAppointment}
          appointment={selectedAppointment}
        />
      </>
    )}
    </>
  );
}
