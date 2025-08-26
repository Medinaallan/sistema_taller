import { useState } from 'react';
import { 
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  IdentificationIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface CompanyData {
  businessName: string;
  tradeName: string;
  rtn: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  logo?: string;
  economicActivity: string;
  legalRepresentative: string;
  legalRepresentativeId: string;
  establishedDate: string;
  fiscalRegime: string;
  notes?: string;
}

const initialCompanyData: CompanyData = {
  businessName: 'Taller Mecánico XD',
  tradeName: 'La Esperanza',
  rtn: '1001200300100',
  address: 'Col. Las Flores, Calle Principal #123',
  city: 'LA ESPERANZA',
  state: 'INTIBUCA',
  postalCode: '14101',
  country: 'Honduras',
  phone: '2783-5678',
  mobile: '9789-6227',
  email: 'info@talleresp.com',
  website: 'www.talleresp.com',
  economicActivity: 'Reparación y mantenimiento de vehículos automotores',
  legalRepresentative: 'GERENTE XD ',
  legalRepresentativeId: '1001-1985-12345',
  establishedDate: '2010-03-15',
  fiscalRegime: 'Contribuyente Nacional',
  notes: 'Taller especializado en mecánica general y diagnóstico automotriz'
};

export function CompanyDataSection() {
  const [companyData, setCompanyData] = useState<CompanyData>(initialCompanyData);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CompanyData>(initialCompanyData);

  const handleInputChange = (field: keyof CompanyData, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setCompanyData(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(companyData);
    setIsEditing(false);
  };

  const InputField = ({ 
    label, 
    field, 
    type = 'text', 
    required = false,
    className = '',
    placeholder = ''
  }: {
    label: string;
    field: keyof CompanyData;
    type?: string;
    required?: boolean;
    className?: string;
    placeholder?: string;
  }) => (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {isEditing ? (
        <input
          type={type}
          value={editData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      ) : (
        <p className="mt-1 text-sm text-gray-900">
          {companyData[field] || 'No especificado'}
        </p>
      )}
    </div>
  );

  const TextAreaField = ({ 
    label, 
    field, 
    rows = 3,
    className = ''
  }: {
    label: string;
    field: keyof CompanyData;
    rows?: number;
    className?: string;
  }) => (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {isEditing ? (
        <textarea
          rows={rows}
          value={editData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      ) : (
        <p className="mt-1 text-sm text-gray-900">
          {companyData[field] || 'No especificado'}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Datos de la Empresa</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configuración de información fiscal y datos del taller
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {isEditing ? (
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Guardar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Editar Datos
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Información General</h3>
          </div>
        </div>
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Razón Social"
            field="businessName"
            required
          />
          <InputField
            label="Nombre Comercial"
            field="tradeName"
            required
          />
          <InputField
            label="RTN"
            field="rtn"
            placeholder="0801-1998-123456"
            required
          />
          
          <InputField
            label="Actividad Económica"
            field="economicActivity"
            className="md:col-span-2"
          />
          <InputField
            label="Fecha de Constitución"
            field="establishedDate"
            type="date"
          />
          
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Dirección</h3>
          </div>
        </div>
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Dirección"
            field="address"
            className="md:col-span-2"
            required
          />
          <InputField
            label="Ciudad"
            field="city"
            required
          />
          <InputField
            label="Departamento/Estado"
            field="state"
            required
          />
          <InputField
            label="Código Postal"
            field="postalCode"
          />
          <InputField
            label="País"
            field="country"
            required
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Información de Contacto</h3>
          </div>
        </div>
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Teléfono"
            field="phone"
            type="tel"
            placeholder="2234-5678"
            required
          />
          <InputField
            label="Teléfono Móvil"
            field="mobile"
            type="tel"
            placeholder="9876-5432"
          />
          <InputField
            label="Correo Electrónico"
            field="email"
            type="email"
            required
          />
          <InputField
            label="Sitio Web"
            field="website"
            type="url"
            placeholder="www.empresa.com"
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <IdentificationIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Representante Legal</h3>
          </div>
        </div>
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Nombre del Representante"
            field="legalRepresentative"
            required
          />
          <InputField
            label="Identidad del Representante"
            field="legalRepresentativeId"
            placeholder="0801-1985-12345"
            required
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Información Adicional</h3>
          </div>
        </div>
        <div className="px-6 py-4">
          <TextAreaField
            label="Notas"
            field="notes"
            rows={4}
          />
        </div>
      </div>

      {/* Logo Upload Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Logo de la Empresa</h3>
        </div>
        <div className="px-6 py-4">
          {isEditing ? (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="logo-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Subir logo</span>
                    <input id="logo-upload" name="logo-upload" type="file" className="sr-only" />
                  </label>
                  <p className="pl-1">o arrastrar y soltar</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 2MB</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="mt-2 text-sm text-gray-500">No hay logo cargado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
