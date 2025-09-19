import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, Users, Car, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ImportStats {
  clientsProcessed: number;
  vehiclesProcessed: number;
  clientsSkipped: number;
  vehiclesSkipped: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  stats?: ImportStats;
  errors?: string[];
  error?: string;
}

const ExcelImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (result: ImportResult) => void;
}> = ({ isOpen, onClose, onImportComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel')) {
      uploadFile(file);
    } else {
      alert('Por favor seleccione un archivo Excel (.xlsx o .xls)');
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await fetch('/api/excel-import/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setUploadResult(result);
      
      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Error de conexión',
        error: 'No se pudo conectar con el servidor'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/excel-import/template');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'plantilla-importacion-clientes-vehiculos.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error descargando plantilla');
      }
    } catch (error) {
      alert('Error descargando plantilla');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const resetModal = () => {
    setUploadResult(null);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Importar Clientes y Vehículos
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Descarga de plantilla */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Download className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">
                  Paso 1: Descarga la plantilla
                </h3>
                <p className="text-blue-700 text-sm mb-3">
                  Descarga la plantilla Excel y completa los datos de clientes y vehículos siguiendo el formato.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Plantilla</span>
                </button>
              </div>
            </div>
          </div>

          {/* Área de subida */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-gray-600" />
              <span>Paso 2: Sube tu archivo Excel</span>
            </h3>
            
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
                ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-gray-400'}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="space-y-2">
                  <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600">Procesando archivo...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600 mb-2">
                      Arrastra tu archivo Excel aquí o haz clic para seleccionar
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Seleccionar archivo</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Formatos soportados: .xlsx, .xls (máximo 10MB)
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Resultado de la importación */}
          {uploadResult && (
            <div className={`
              rounded-lg p-4 border
              ${uploadResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
              }
            `}>
              <div className="flex items-start space-x-3">
                {uploadResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <h4 className={`font-medium mb-2 ${
                    uploadResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {uploadResult.success ? '¡Importación exitosa!' : 'Error en la importación'}
                  </h4>
                  
                  <p className={`text-sm mb-3 ${
                    uploadResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {uploadResult.message}
                  </p>

                  {uploadResult.stats && (
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="bg-white rounded p-3 border">
                        <div className="flex items-center space-x-2 mb-1">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Clientes</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {uploadResult.stats.clientsProcessed}
                        </p>
                        <p className="text-xs text-gray-600">procesados</p>
                        {uploadResult.stats.clientsSkipped > 0 && (
                          <p className="text-xs text-orange-600">
                            {uploadResult.stats.clientsSkipped} omitidos
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-white rounded p-3 border">
                        <div className="flex items-center space-x-2 mb-1">
                          <Car className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Vehículos</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {uploadResult.stats.vehiclesProcessed}
                        </p>
                        <p className="text-xs text-gray-600">procesados</p>
                        {uploadResult.stats.vehiclesSkipped > 0 && (
                          <p className="text-xs text-orange-600">
                            {uploadResult.stats.vehiclesSkipped} omitidos
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="bg-red-100 rounded p-3 mt-2">
                      <h5 className="text-sm font-medium text-red-900 mb-1">Errores encontrados:</h5>
                      <ul className="text-sm text-red-700 space-y-1">
                        {uploadResult.errors.map((error, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span>•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {uploadResult.error && (
                    <div className="bg-red-100 rounded p-3 mt-2">
                      <p className="text-sm text-red-700">{uploadResult.error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
          {uploadResult && uploadResult.success && (
            <button
              onClick={resetModal}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Importar otro archivo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelImportModal;