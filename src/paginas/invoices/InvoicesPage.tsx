
import { useState } from 'react';
import { Card, Button, Modal } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import { mockInvoices, mockPayments } from '../../utilidades/mockCrudData';
import type { Invoice } from '../../tipos/invoice';
import type { Payment } from '../../tipos/payment';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Invoice>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'invoiceNumber', header: 'Factura' },
  { accessorKey: 'clientId', header: 'Cliente' },
  { accessorKey: 'total', header: 'Total' },
  { accessorKey: 'status', header: 'Estado' },
];

const paymentColumns: ColumnDef<Payment>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'amount', header: 'Monto' },
  { accessorKey: 'method', header: 'Método' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: 'date', header: 'Fecha', cell: (info) => new Date(info.getValue() as Date).toLocaleDateString() },
];

const InvoicesPage = () => {
  const [data, setData] = useState<Invoice[]>(mockInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayments, setShowPayments] = useState(false);

  const handleEdit = (item: Invoice) => {
    alert('Editar factura: ' + item.id);
  };

  const handleDelete = (item: Invoice) => {
    setData(data.filter(d => d.id !== item.id));
  };

  const handleViewPayments = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPayments(true);
  };

  // Filtrar pagos para la factura seleccionada
  const filteredPayments = mockPayments.filter(
    payment => selectedInvoice && payment.invoiceId === selectedInvoice.id
  );

  return (
    <>
      <Card 
        title="Gestión de Facturas" 
        actions={
          <div className="space-x-2">
            <Button onClick={() => alert('Nuevo registro')}>Nueva Factura</Button>
          </div>
        }
      >
        <TanStackCrudTable 
          columns={[
            ...columns,
            {
              id: 'payments',
              header: 'Pagos',
              cell: (info) => (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleViewPayments(info.row.original)}
                >
                  Ver Pagos
                </Button>
              ),
            }
          ]} 
          data={data} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
        />
      </Card>

      {/* Modal de pagos */}
      <Modal
        isOpen={showPayments}
        onClose={() => setShowPayments(false)}
        title={`Pagos de la Factura ${selectedInvoice?.invoiceNumber}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Detalles de la Factura</h3>
            <Button 
              size="sm"
              onClick={() => alert('Registrar nuevo pago')}
            >
              Registrar Pago
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Total Factura</p>
              <p className="text-lg font-medium">${selectedInvoice?.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <p className="text-lg font-medium capitalize">{selectedInvoice?.status}</p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-medium mb-4">Historial de Pagos</h4>
            <TanStackCrudTable
              columns={paymentColumns}
              data={filteredPayments}
              onEdit={(payment) => alert(`Editar pago ${payment.id}`)}
              onDelete={(payment) => alert(`Eliminar pago ${payment.id}`)}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default InvoicesPage;
