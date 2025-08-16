import { useState } from 'react';
import { Button } from '../../componentes/comunes/UI';
import { GestionModal } from '../../componentes/gestion/GestionModals';

// Tipos de gestión disponibles
type GestionType = 'workOrders' | 'appointments' | 'quotations' | 'invoices';

interface GestionOption {
  type: GestionType;
  name: string;
  description: string;
}

const gestionOptions: GestionOption[] = [
  {
    type: 'workOrders',
    name: 'Órdenes de Trabajo',
    description: 'Gestione las órdenes de trabajo del taller'
  },
  {
    type: 'appointments',
    name: 'Citas',
    description: 'Administre las citas programadas'
  },
  {
    type: 'quotations',
    name: 'Cotizaciones',
    description: 'Gestione las cotizaciones de servicios'
  },
  {
    type: 'invoices',
    name: 'Facturas',
    description: 'Administre facturas y sus pagos asociados'
  }
];

export default function GestionPage() {
  const [selectedType, setSelectedType] = useState<GestionType | null>(null);

  const handleOpenModal = (type: GestionType) => {
    setSelectedType(type);
  };

  const handleCloseModal = () => {
    setSelectedType(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Gestión del Taller</h1>
        <p className="mt-2 text-gray-600">
          Seleccione una sección para gestionar los diferentes aspectos del taller
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {gestionOptions.map((option) => (
          <div
            key={option.type}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-blue-500 transition-colors duration-200"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">{option.name}</h3>
            <p className="text-gray-600 mb-4">{option.description}</p>
            <Button 
              onClick={() => handleOpenModal(option.type)}
              className="w-full"
            >
              Gestionar
            </Button>
          </div>
        ))}
      </div>

      {selectedType && (
        <GestionModal
          type={selectedType}
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
