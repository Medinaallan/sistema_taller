import { useState } from 'react';
import { UserManagementSection } from './secciones/UserManagementSection';
import { CompanyDataSection } from './secciones/CompanyDataSection';
import { BillingConfigSection } from './secciones/BillingConfigSection';
import {
  UsersIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CogIcon,
  IdentificationIcon,
  CalculatorIcon,
  BanknotesIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface ConfigSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  path: string;
}

const configSections: ConfigSection[] = [
  {
    id: 'usuarios',
    title: 'Gestión de Usuarios',
    description: 'Administrar usuarios, roles y permisos del sistema',
    icon: UsersIcon,
    path: 'usuarios'
  },
  {
    id: 'empresa',
    title: 'Datos de la Empresa',
    description: 'Configuración de información fiscal y datos del taller',
    icon: BuildingOfficeIcon,
    path: 'empresa'
  },
  {
    id: 'facturacion',
    title: 'Configuración de Facturación',
    description: 'CAI, rangos de facturación y configuración fiscal',
    icon: DocumentTextIcon,
    path: 'facturacion'
  },
  {
    id: 'impuestos',
    title: 'Configuración de Impuestos',
    description: 'ISV, retenciones y otros impuestos',
    icon: CalculatorIcon,
    path: 'impuestos'
  },
  {
    id: 'moneda',
    title: 'Configuración de Moneda',
    description: 'Tipos de cambio y moneda predeterminada',
    icon: CurrencyDollarIcon,
    path: 'moneda'
  },
  {
    id: 'metodos-pago',
    title: 'Métodos de Pago',
    description: 'Configurar formas de pago aceptadas',
    icon: BanknotesIcon,
    path: 'metodos-pago'
  },
  {
    id: 'personal',
    title: 'Gestión de Personal',
    description: 'Empleados, mecánicos y sus especialidades',
    icon: IdentificationIcon,
    path: 'personal'
  },
  {
    id: 'horarios',
    title: 'Horarios de Trabajo',
    description: 'Configuración de horarios y disponibilidad',
    icon: ClockIcon,
    path: 'horarios'
  },
  {
    id: 'servicios',
    title: 'Catálogo de Servicios',
    description: 'Gestionar tipos de servicios y precios base',
    icon: TagIcon,
    path: 'servicios'
  },
  {
    id: 'sistema',
    title: 'Configuración del Sistema',
    description: 'Respaldos, restauración y configuración general',
    icon: CogIcon,
    path: 'sistema'
  }
];

export default function AdminPage() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const renderSelectedSection = () => {
    if (!selectedSection) return null;

    const section = configSections.find(s => s.id === selectedSection);
    if (!section) return null;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <button
          onClick={() => setSelectedSection(null)}
          className="mb-6 text-sm text-blue-600 hover:text-blue-800"
        >
          ← Volver a todas las configuraciones
        </button>
        {selectedSection === 'usuarios' && <UserManagementSection />}
        {selectedSection === 'empresa' && <CompanyDataSection />}
        {selectedSection === 'facturacion' && <BillingConfigSection />}
        {/* Aquí se agregarán las demás secciones */}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Administración del Sistema
      </h1>

      {!selectedSection ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configSections.map((section) => (
            <div
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <section.icon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        renderSelectedSection()
      )}
    </div>
  );
}
