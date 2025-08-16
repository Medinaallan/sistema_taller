import { useState } from 'react';
import { Modal, Button, Card } from '../comunes/UI';
import { TanStackCrudTable } from '../comunes/TanStackCrudTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { WorkOrder } from '../../tipos/workOrder';
import type { Appointment } from '../../tipos/appointment';
import type { Quotation } from '../../tipos/quotation';
import type { Invoice } from '../../tipos/invoice';
import { mockWorkOrders, mockAppointments, mockQuotations, mockInvoices } from '../../utilidades/mockCrudData';
import { FunnelIcon, ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utilidades/mockData';

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

const appointmentColumns: ColumnDef<Appointment>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { accessorKey: 'serviceTypeId', header: 'Servicio' },
  { 
    accessorKey: 'date', 
    header: 'Fecha',
    cell: (info) => new Date(info.getValue() as string).toLocaleDateString()
  },
  { accessorKey: 'time', header: 'Hora' },
  { accessorKey: 'status', header: 'Estado' },
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
  const [appointments, setAppointments] = useState(mockAppointments);
  const [quotations, setQuotations] = useState(mockQuotations);
  const [invoices, setInvoices] = useState(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
    console.log('Editar:', item);
  };

  const handleDelete = (item: any) => {
    const updatedData = config.data.filter(d => d.id !== item.id);
    switch (type) {
      case 'workOrders':
        setWorkOrders(updatedData as WorkOrder[]);
        break;
      case 'appointments':
        setAppointments(updatedData as Appointment[]);
        break;
      case 'quotations':
        setQuotations(updatedData as Quotation[]);
        break;
      case 'invoices':
        setInvoices(updatedData as Invoice[]);
        break;
    }
  };

  return (
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
                  {config.data.filter(item => item.status === 'pending').length}
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
                  {config.data.filter(item => item.status === 'completed').length}
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
            <Button onClick={() => alert('Nuevo registro')}>
              Nuevo {config.title.slice(0, -1)}
            </Button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <TanStackCrudTable
            columns={config.columns}
            data={filterData(config.data)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Footer con resumen */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              {config.data.length} {config.title.toLowerCase()} en total
            </div>
            <div className="flex space-x-4">
              <span>{config.data.filter(item => item.status === 'pending').length} pendientes</span>
              <span>{config.data.filter(item => item.status === 'in-progress').length} en progreso</span>
              <span>{config.data.filter(item => item.status === 'completed').length} completados</span>
              <span>{config.data.filter(item => item.status === 'cancelled').length} cancelados</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}