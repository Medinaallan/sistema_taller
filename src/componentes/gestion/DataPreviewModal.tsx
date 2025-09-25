import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Car, 
  CheckCircle, 
  AlertTriangle, 
  Eye,
  ArrowRight
} from 'lucide-react';

interface ClientData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  password: string;
}

interface VehicleData {
  clienteEmail: string;
  marca: string;
  modelo: string;
  año: number;
  placa: string;
  color: string;
}

interface PreviewData {
  clients: ClientData[];
  vehicles: VehicleData[];
  validationErrors: string[];
  warnings: string[];
}

interface DataPreviewModalProps {
  isOpen: boolean;
  previewData: PreviewData | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  isOpen,
  previewData,
  isLoading = false,
  onConfirm,
  onCancel,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'vehicles'>('clients');

  if (!isOpen) return null;

  const hasErrors = previewData?.validationErrors && previewData.validationErrors.length > 0;
  const hasWarnings = previewData?.warnings && previewData.warnings.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Eye className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Vista Previa de Datos
              </h2>
              <p className="text-sm text-gray-600">
                Revisa los datos antes de confirmar la importación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="text-gray-600">Procesando datos...</p>
            </div>
          </div>
        ) : previewData ? (
          <>
            {/* Stats */}
            <div className="p-6 border-b bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {previewData.clients.length}
                      </p>
                      <p className="text-sm text-gray-600">Clientes a importar</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Car className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {previewData.vehicles.length}
                      </p>
                      <p className="text-sm text-gray-600">Vehículos a importar</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Errores y advertencias */}
              {(hasErrors || hasWarnings) && (
                <div className="mt-4 space-y-2">
                  {hasErrors && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-red-900 mb-1">
                            Errores encontrados ({previewData.validationErrors.length})
                          </h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {previewData.validationErrors.slice(0, 3).map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                            {previewData.validationErrors.length > 3 && (
                              <li className="text-red-600">
                                ... y {previewData.validationErrors.length - 3} más
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasWarnings && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-900 mb-1">
                            Advertencias ({previewData.warnings.length})
                          </h4>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {previewData.warnings.slice(0, 2).map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                            {previewData.warnings.length > 2 && (
                              <li className="text-yellow-600">
                                ... y {previewData.warnings.length - 2} más
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('clients')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'clients'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Clientes ({previewData.clients.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'vehicles'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4" />
                  <span>Vehículos ({previewData.vehicles.length})</span>
                </div>
              </button>
            </div>

            {/* Contenido de las tablas */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-auto">
                {activeTab === 'clients' ? (
                  <div className="p-6">
                    {previewData.clients.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Teléfono
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Dirección
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {previewData.clients.map((client, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {client.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {client.email}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {client.phone}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {client.address || 'No especificada'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No hay clientes para importar</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6">
                    {previewData.vehicles.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cliente
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Marca
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Modelo
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Año
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Placa
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Color
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {previewData.vehicles.map((vehicle, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {vehicle.clienteEmail}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {vehicle.marca}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {vehicle.modelo}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {vehicle.año}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {vehicle.placa}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {vehicle.color}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No hay vehículos para importar</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Los datos están listos para importar</span>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  disabled={hasErrors}
                  className={`
                    px-6 py-2 rounded-lg transition-colors flex items-center space-x-2
                    ${hasErrors
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                  `}
                >
                  <span>Confirmar Importación</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="text-gray-600">No hay datos para mostrar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPreviewModal;