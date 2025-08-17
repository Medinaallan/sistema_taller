
import { useState, useEffect } from 'react';
import { Card, Button, Modal } from '../../componentes/comunes/UI';
import { TanStackCrudTable } from '../../componentes/comunes/TanStackCrudTable';
import type { ColumnDef } from '@tanstack/react-table';
import { useApp } from '../../contexto/useApp';
import { mockServiceTypes } from '../../utilidades/mockData';
import type { ServiceType } from '../../tipos/index';

const columns: ColumnDef<ServiceType>[] = [
  { 
    accessorKey: 'name', 
    header: 'Nombre',
    cell: ({ row }) => row.original.name
  },
  { 
    accessorKey: 'description', 
    header: 'Descripción',
    cell: ({ row }) => row.original.description
  },
  { 
    accessorKey: 'basePrice', 
    header: 'Precio Base',
    cell: ({ row }) => `L. ${row.original.basePrice}`
  },
  { 
    accessorKey: 'estimatedDuration', 
    header: 'Duración Est.',
    cell: ({ row }) => `${row.original.estimatedDuration} hrs`
  }
];

const ServicesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const { state, dispatch } = useApp();
  
  useEffect(() => {
    // Inicializar los tipos de servicio en el estado global si no existen
    if (!state.serviceTypes || state.serviceTypes.length === 0) {
      dispatch({ type: 'SET_SERVICE_TYPES', payload: mockServiceTypes });
    }
  }, []);

  const data = state.serviceTypes || mockServiceTypes;

  const handleEdit = (service: ServiceType) => {
    setShowForm(true);
    // TODO: Implementar edición
    console.log('Editar servicio:', service);
  };

  const handleDelete = (service: ServiceType) => {
    if (window.confirm('¿Está seguro de eliminar este servicio?')) {
      dispatch({ type: 'DELETE_SERVICE_TYPE', payload: service.id });
    }
  };

  const handleCreate = () => {
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="Servicio"
          size="md"
        >
          <div>
            {/* TODO: Implementar formulario */}
            <p>Formulario de servicio en construcción...</p>
          </div>
        </Modal>
      )}
      <Card 
        title="Catálogo de Servicios" 
        subtitle="Gestión de tipos de servicios y precios base"
        actions={
          <Button onClick={handleCreate} variant="primary">
            Nuevo Servicio
          </Button>
        }
      >
        <TanStackCrudTable 
          columns={columns} 
          data={data} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
};

export default ServicesPage;
