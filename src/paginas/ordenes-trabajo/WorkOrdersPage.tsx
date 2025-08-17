import { useState } from 'react';
import { CrudTable } from '../../componentes/comunes/CrudTable';
import { WorkOrder } from '../../tipos/workOrder';

const mockWorkOrders: WorkOrder[] = [
  {
    id: '1',
    vehicleId: 'VEH001',
    clientId: 'CLI001',
    status: 'in-progress',
    description: 'Cambio de aceite y filtros',
    estimatedCompletionDate: new Date('2025-08-18'),
    laborCost: 50.00,
    partsCost: 100.00,
    totalCost: 150.00,
    createdAt: new Date('2025-08-17'),
    updatedAt: new Date('2025-08-17'),
    technicianNotes: 'Mantenimiento preventivo regular'
  }
];

const columns = [
  { key: 'id' as keyof WorkOrder, label: 'ID' },
  { key: 'clientId' as keyof WorkOrder, label: 'Cliente' },
  { key: 'vehicleId' as keyof WorkOrder, label: 'Vehículo' },
  { key: 'status' as keyof WorkOrder, label: 'Estado' },
  { key: 'description' as keyof WorkOrder, label: 'Descripción' },
  { key: 'totalCost' as keyof WorkOrder, label: 'Costo Total' },
];

export function WorkOrdersPage() {
  const [data, setData] = useState<WorkOrder[]>(mockWorkOrders);

  const handleEdit = (item: WorkOrder) => {
    // TODO: Implement edit functionality
    console.log('Edit item:', item);
  };

  const handleDelete = (item: WorkOrder) => {
    setData(data.filter(existing => existing.id !== item.id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Órdenes de Trabajo</h1>
      <div className="mb-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            // TODO: Implement create functionality
            console.log('Create new work order');
          }}
        >
          Nueva Orden
        </button>
      </div>
      <CrudTable
        data={data}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
