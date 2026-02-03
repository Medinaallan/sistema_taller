import { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { companyConfigService, CompanyInfo } from '../../../servicios/companyConfigService';

export function CompanyDataSection() {
  const [companyData, setCompanyData] = useState<CompanyInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyConfigService.fetchCompanyInfo();
      if (data) {
        setCompanyData(data);
        setEditData(data);
      } else {
        setError('No se pudo cargar la configuración de la empresa');
      }
    } catch (err) {
      console.error('Error al cargar datos de la empresa:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CompanyInfo, value: string | number) => {
    setEditData(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);
  };

  const handleSave = async () => {
    if (!editData) return;
    setLoading(true);
    try {
      const result = await companyConfigService.updateCompanyInfo(editData);
      if (result.success) {
        setCompanyData(editData);
        setIsEditing(false);
        alert('Datos guardados correctamente');
      } else {
        alert('Error al guardar: ' + result.message);
      }
    } catch (err) {
      alert('Error al guardar los datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData(companyData);
    setIsEditing(false);
  };

  // Estado de carga
  if (loading && !companyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando configuración...</span>
      </div>
    );
  }

  // Estado de error
  if (error && !companyData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={loadCompanyData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!companyData || !editData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-600 font-medium">No hay datos de empresa configurados</p>
      </div>
    );
  }

  const InputField = ({ 
    label, 
    field, 
    type = 'text', 
    required = false,
    className = '',
    placeholder = ''
  }: {
    label: string;
    field: keyof CompanyInfo;
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
          value={editData[field] ?? ''}
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
    field: keyof CompanyInfo;
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
          value={editData[field] ?? ''}
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
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
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
            label="Nombre de la Empresa"
            field="nombreEmpresa"
            required
          />
          <InputField
            label="RTN"
            field="rtn"
            placeholder="0801-1998-123456"
            required
          />
          <InputField
            label="Dirección"
            field="direccion"
            className="md:col-span-2"
            required
          />
        </div>
      </div>

      {/* Información de Contacto */}
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
            field="telefono"
            type="tel"
            placeholder="2234-5678"
          />
          <InputField
            label="Correo Electrónico"
            field="correo"
            type="email"
          />
        </div>
      </div>

      {/* Configuración Fiscal */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Configuración Fiscal</h3>
          </div>
        </div>
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Impuesto (%) <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={editData.impuestoPorcentaje || 0}
                onChange={(e) => setEditData(prev => prev ? ({ ...prev, impuestoPorcentaje: parseFloat(e.target.value) || 0 }) : null)}
                placeholder="15.00"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900">
                {companyData.impuestoPorcentaje}%
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moneda <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <select
                value={editData.moneda || 'HNL'}
                onChange={(e) => setEditData(prev => prev ? ({ ...prev, moneda: e.target.value }) : null)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="HNL">HNL - Lempira Hondureño</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            ) : (
              <p className="mt-1 text-sm text-gray-900">
                {companyData.moneda || 'HNL'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mensaje Pie de Factura */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Configuración de Factura</h3>
          </div>
        </div>
        <div className="px-6 py-4">
          <TextAreaField
            label="Mensaje Pie de Factura"
            field="mensajePieFactura"
            rows={3}
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
