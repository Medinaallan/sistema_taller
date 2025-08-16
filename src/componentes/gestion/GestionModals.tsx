import { useState } from 'react';
import { Modal, Button } from '../comunes/UI';
import { TanStackCrudTable } from '../comunes/TanStackCrudTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { WorkOrder } from '../../tipos/workOrder';
import type { Appointment } from '../../tipos/appointment';
import type { Quotation } from '../../tipos/quotation';
import type { Invoice } from '../../tipos/invoice';
import { mockWorkOrders, mockAppointments, mockQuotations, mockInvoices } from '../../utilidades/mockCrudData';

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
    cell: (info) => `$${info.getValue() as number}`
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
    cell: (info) => `$${info.getValue() as number}`
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
    cell: (info) => `$${info.getValue() as number}`
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
    config.setData(config.data.filter(d => d.id !== item.id));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={config.title} size="xl">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Gestión de {config.title}</h3>
            <p className="text-sm text-gray-500">
              {config.data.length} registros encontrados
            </p>
          </div>
          <Button onClick={() => alert('Nuevo registro')}>
            Nuevo {config.title.slice(0, -1)}
          </Button>
        </div>

        <TanStackCrudTable
          columns={config.columns}
          data={config.data}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </Modal>
  );
}