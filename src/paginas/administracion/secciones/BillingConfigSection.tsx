import { useState, useEffect } from 'react';
import { Card, Button, Input, Select } from '../../../componentes/comunes/UI';
import { showError, showSuccess, showWarning, showConfirm } from '../../../utilidades/sweetAlertHelpers';
import companyConfigService, {
  type CompanyInfo,
  type BillingConfig as BillingConfigType,
  type CAIConfig as CAIConfigType
} from '../../../servicios/companyConfigService';

interface CAIFormData {
  cai: string;
  fechaLimiteEmision: string;
  rangoInicial: string;
  rangoFinal: string;
  numeroActual: string;
  tipoDocumento: 'factura' | 'nota-debito' | 'nota-credito' | 'nota-remision' | 'comprobante-retencion';
  puntoEmision: string;
  establecimiento: string;
}

export function BillingConfigSection() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [config, setConfig] = useState<BillingConfigType | null>(null);
  const [loading, setLoading] = useState(true);

  const [newCAI, setNewCAI] = useState<CAIFormData>({
    cai: '',
    fechaLimiteEmision: '',
    rangoInicial: '',
    rangoFinal: '',
    numeroActual: '',
    tipoDocumento: 'factura',
    puntoEmision: '001',
    establecimiento: '001'
  });

  const [showCAIForm, setShowCAIForm] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      await companyConfigService.initialize();
      const fullConfig = companyConfigService.getConfig();
      setCompanyInfo(fullConfig.companyInfo);
      setConfig(fullConfig.billingConfig);
    } catch (error) {
      console.error('Error cargando configuración:', error);
      showError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el código numérico del tipo de documento
  const getDocumentCode = (tipoDocumento: CAIFormData['tipoDocumento']): string => {
    const codes = {
      'factura': '01',
      'nota-debito': '02',
      'nota-credito': '03',
      'nota-remision': '04',
      'comprobante-retencion': '05'
    };
    return codes[tipoDocumento] || '01';
  };

  // Función para obtener el nombre legible del tipo de documento
  const getDocumentTypeName = (tipoDocumento: CAIFormData['tipoDocumento']): string => {
    const names = {
      'factura': 'Factura',
      'nota-debito': 'Nota de Débito',
      'nota-credito': 'Nota de Crédito',
      'nota-remision': 'Nota de Remisión',
      'comprobante-retencion': 'Comprobante de Retención'
    };
    return names[tipoDocumento] || 'Factura';
  };

  const handleConfigChange = (field: keyof BillingConfigType, value: any) => {
    if (!config) return;
    
    const updatedConfig = {
      ...config,
      [field]: value
    };
    setConfig(updatedConfig);
  };

  const handleCAIChange = (field: keyof CAIFormData, value: string) => {
    setNewCAI(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCAI = async () => {
    if (!newCAI.cai || !newCAI.fechaLimiteEmision || !newCAI.rangoInicial || !newCAI.rangoFinal) {
      showError('Por favor complete todos los campos obligatorios del CAI');
      return;
    }

    try {
      const caiData: Omit<CAIConfigType, 'id'> = {
        cai: newCAI.cai,
        fechaLimiteEmision: newCAI.fechaLimiteEmision,
        rangoInicial: newCAI.rangoInicial,
        rangoFinal: newCAI.rangoFinal,
        numeroActual: newCAI.numeroActual || newCAI.rangoInicial,
        tipoDocumento: newCAI.tipoDocumento,
        puntoEmision: newCAI.puntoEmision,
        establecimiento: newCAI.establecimiento,
        activo: true
      };

      const result = await companyConfigService.addCAI(caiData);
      
      if (result.success) {
        // Actualizar el estado local
        await loadConfig();

        setNewCAI({
          cai: '',
          fechaLimiteEmision: '',
          rangoInicial: '',
          rangoFinal: '',
          numeroActual: '',
          tipoDocumento: 'factura',
          puntoEmision: '001',
          establecimiento: '001'
        });
        setShowCAIForm(false);
        showSuccess('CAI agregado exitosamente');
      } else {
        showError(result.message || 'Error al agregar el CAI');
      }
    } catch (error) {
      console.error('Error agregando CAI:', error);
      showError('Error al agregar el CAI');
    }
  };

  const removeCAI = async (caiId: string) => {
    if (!await showConfirm('¿Está seguro de que desea eliminar este CAI?')) {
      return;
    }

    try {
      const result = await companyConfigService.deleteCAI(caiId);
      if (result.success) {
        await loadConfig();
        showSuccess('CAI eliminado exitosamente');
      } else {
        showError(result.message || 'No se pudo eliminar el CAI');
      }
    } catch (error) {
      console.error('Error eliminando CAI:', error);
      showError('Error al eliminar el CAI');
    }
  };

  const validateRTN = (rtn: string): boolean => {
    // RTN hondureño debe tener 14 dígitos
    const cleanRTN = rtn.replace(/[^0-9]/g, '');
    return cleanRTN.length === 14;
  };

  const formatRTN = (rtn: string): string => {
    const cleaned = rtn.replace(/[^0-9]/g, '');
    if (cleaned.length >= 4) {
      return cleaned.slice(0, 4) + '-' + cleaned.slice(4, 8) + '-' + cleaned.slice(8, 14);
    }
    return cleaned;
  };

  const handleSave = async () => {
    if (!config || !companyInfo) {
      showError('Error: No se ha cargado la configuración');
      return;
    }

    // Validar que los datos de la empresa estén configurados
    if (!companyInfo.rtn || !validateRTN(companyInfo.rtn)) {
      showError('RTN de la empresa no válido. Por favor configure primero los datos de la empresa.');
      return;
    }

    if (!companyInfo.businessName || !companyInfo.address) {
      showError('Faltan datos obligatorios de la empresa. Por favor configure primero los datos de la empresa.');
      return;
    }

    if (config.cais.length === 0) {
      showWarning('Debe configurar al menos un CAI para poder facturar');
      return;
    }

    try {
      // Guardar la configuración de facturación
      const result = await companyConfigService.updateBillingConfig(config);
      if (result.success) {
        showSuccess('Configuración de facturación guardada exitosamente');
      } else {
        showError(result.message || 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      showError('Error al guardar la configuración');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!config || !companyInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error al cargar la configuración</p>
        <Button onClick={loadConfig} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración de Facturación</h2>
          <p className="text-gray-600 mt-1">
            Configure los datos fiscales y CAI según la legislación hondureña
          </p>
        </div>
      </div>

      {/* Información de la Empresa - Solo Lectura */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Información Fiscal de la Empresa</h3>
            <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Datos importados de "Datos de la Empresa"
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">RTN (Registro Tributario Nacional)</p>
                <p className="text-lg text-gray-900 font-mono">{formatRTN(companyInfo.rtn)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Nombre Comercial</p>
                <p className="text-lg text-gray-900">{companyInfo.tradeName}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700">Razón Social</p>
                <p className="text-lg text-gray-900">{companyInfo.businessName}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700">Dirección Fiscal</p>
                <p className="text-lg text-gray-900">{companyInfo.address}, {companyInfo.city}, {companyInfo.state}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Teléfono</p>
                <p className="text-lg text-gray-900">{companyInfo.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Correo Electrónico</p>
                <p className="text-lg text-gray-900">{companyInfo.email}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Para modificar estos datos, diríjase a la sección "Datos de la Empresa"
              </div>
              
            </div>
          </div>
        </div>
      </Card>

      {/* Régimen Fiscal */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Régimen Fiscal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Select
                label="Régimen Fiscal"
                value={config.regimenFiscal}
                onChange={(e) => handleConfigChange('regimenFiscal', e.target.value as BillingConfigType['regimenFiscal'])}
                options={[
                  { value: 'normal', label: 'Régimen Normal' },
                  { value: 'simplificado', label: 'Régimen Simplificado' },
                  { value: 'opcional', label: 'Régimen Opcional' }
                ]}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="obligado-contabilidad"
                  type="checkbox"
                  checked={config.obligadoLlevarContabilidad}
                  onChange={(e) => handleConfigChange('obligadoLlevarContabilidad', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="obligado-contabilidad" className="ml-2 text-sm text-gray-700">
                  Obligado a llevar contabilidad
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="contribuyente-isv"
                  type="checkbox"
                  checked={config.contribuyenteISV}
                  onChange={(e) => handleConfigChange('contribuyenteISV', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="contribuyente-isv" className="ml-2 text-sm text-gray-700">
                  Contribuyente ISV (15%)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="agente-retencion"
                  type="checkbox"
                  checked={config.agenteRetencionISV}
                  onChange={(e) => handleConfigChange('agenteRetencionISV', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="agente-retencion" className="ml-2 text-sm text-gray-700">
                  Agente de Retención ISV
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="sujeto-percepcion"
                  type="checkbox"
                  checked={config.sujetoPercepcionISV}
                  onChange={(e) => handleConfigChange('sujetoPercepcionISV', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="sujeto-percepcion" className="ml-2 text-sm text-gray-700">
                  Sujeto a Percepción ISV
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Configuración de CAI */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Códigos de Autorización de Impresión (CAI)</h3>
            <Button
              onClick={() => setShowCAIForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              + Agregar CAI
            </Button>
          </div>

          {/* Lista de CAIs existentes */}
          {config.cais.length > 0 && (
            <div className="space-y-4 mb-6">
              {config.cais.map((cai) => (
                <div key={cai.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                      <div>
                        <p className="text-sm font-medium text-gray-700">CAI</p>
                        <p className="text-sm text-gray-900">{cai.cai}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Tipo</p>
                        <p className="text-sm text-gray-900">
                          {getDocumentCode(cai.tipoDocumento)} - {getDocumentTypeName(cai.tipoDocumento)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Rango</p>
                        <p className="text-sm text-gray-900">{cai.rangoInicial} - {cai.rangoFinal}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Vencimiento</p>
                        <p className="text-sm text-gray-900">{cai.fechaLimiteEmision}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        cai.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {cai.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <Button
                        onClick={() => removeCAI(cai.id)}
                        className="ml-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulario para nuevo CAI */}
          {showCAIForm && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-blue-50">
              <h4 className="font-medium mb-4">Nuevo CAI</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Código CAI*"
                  value={newCAI.cai}
                  onChange={(e) => handleCAIChange('cai', e.target.value)}
                  placeholder="CAI proporcionado por SAR"
                />
                <Input
                  label="Fecha Límite de Emisión*"
                  type="date"
                  value={newCAI.fechaLimiteEmision}
                  onChange={(e) => handleCAIChange('fechaLimiteEmision', e.target.value)}
                />

                <div className="md:col-span-2">
                  
                </div>

                <Select
                  label="Tipo de Documento"
                  value={newCAI.tipoDocumento}
                  onChange={(e) => handleCAIChange('tipoDocumento', e.target.value)}
                  options={[
                    { value: 'factura', label: 'Factura' },
                    { value: 'nota-debito', label: 'Nota de Débito' },
                    { value: 'nota-credito', label: 'Nota de Crédito' },
                    { value: 'nota-remision', label: 'Nota de Remisión' },
                    { value: 'comprobante-retencion', label: 'Comprobante de Retención' }
                  ]}
                />
                <Input
                  label="Código de Documento"
                  value={`${getDocumentCode(newCAI.tipoDocumento)} - ${getDocumentTypeName(newCAI.tipoDocumento)}`}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                  helperText="Código automático según el tipo de documento seleccionado"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Establecimiento"
                    value={newCAI.establecimiento}
                    onChange={(e) => handleCAIChange('establecimiento', e.target.value)}
                    placeholder="001"
                    maxLength={3}
                  />
                  <Input
                    label="Punto de Emisión"
                    value={newCAI.puntoEmision}
                    onChange={(e) => handleCAIChange('puntoEmision', e.target.value)}
                    placeholder="001"
                    maxLength={3}
                  />
                </div>
                <Input
                  label="Desde (Número)*"
                  value={newCAI.rangoInicial}
                  onChange={(e) => handleCAIChange('rangoInicial', e.target.value)}
                  placeholder="FAC-00000001"
                />
                <Input
                  label="Hasta (Número)*"
                  value={newCAI.rangoFinal}
                  onChange={(e) => handleCAIChange('rangoFinal', e.target.value)}
                  placeholder="FAC-99999999"
                />
                <Input
                  label="Número Actual"
                  value={newCAI.numeroActual}
                  onChange={(e) => handleCAIChange('numeroActual', e.target.value)}
                  placeholder="FAC-00000001"
                  helperText="Se usará el rango inicial si se deja vacío"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  onClick={() => setShowCAIForm(false)}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={addCAI}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Guardar CAI
                </Button>
              </div>
            </div>
          )}

          {config.cais.length === 0 && !showCAIForm && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No hay CAI configurados</p>
              <p className="text-sm">Debe configurar al menos un CAI para poder emitir facturas</p>
            </div>
          )}
        </div>
      </Card>

      {/* Información Legal */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Información Legal</h3>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Requisitos Legales de Facturación en Honduras:</strong>
                </p>
                <ul className="mt-2 text-xs text-blue-700 list-disc list-inside space-y-1">
                  <li>RTN: Obligatorio para todas las empresas (14 dígitos)</li>
                  <li>CAI: Código de Autorización de Impresión otorgado por SAR</li>
                  <li>ISV: Impuesto Sobre Ventas del 15% (si aplica)</li>
                  <li>Numeración correlativa obligatoria</li>
                  <li>Fecha límite de emisión según CAI</li>
                  <li>Conservación de facturas por 5 años</li>
                  <li>Declaración mensual de ISV</li>
                </ul>
                <div className="mt-4">
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4">
        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 px-6"
        >
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}
