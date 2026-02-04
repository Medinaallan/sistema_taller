import { useState, useEffect } from 'react';
import { Card, Button, Input, Select } from '../../../componentes/comunes/UI';
import { showError, showSuccess, showWarning, showConfirm } from '../../../utilidades/sweetAlertHelpers';
import companyConfigService, {
  type CompanyInfo,
  type BillingConfig as BillingConfigType,
  type CAIRegistroData
} from '../../../servicios/companyConfigService';

interface CAIFormData {
  cai: string;
  fechaLimiteEmision: string;
  rangoInicial: string;
  rangoFinal: string;
  tipoDocumento: string; // '01', '02', '03', '04', '05'
  puntoEmision: string;
  establecimiento: string;
  ultimoNumeroUtilizado?: number;
  activo?: boolean;
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
    tipoDocumento: '01',
    puntoEmision: '001',
    establecimiento: '001'
  });

  const [editingCAI, setEditingCAI] = useState<{ id: string; data: CAIFormData } | null>(null);
  const [showCAIForm, setShowCAIForm] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading config...');
      await companyConfigService.initialize();
      const fullConfig = companyConfigService.getConfig();
      console.log('📋 Full config received:', fullConfig);
      console.log('📝 CAIs in config:', fullConfig.billingConfig.cais);
      setCompanyInfo(fullConfig.companyInfo);
      setConfig(fullConfig.billingConfig);
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      showError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el nombre legible del tipo de documento
  const getDocumentTypeName = (tipoDocumento: string): string => {
    const names: Record<string, string> = {
      '01': 'Factura',
      '02': 'Nota de Débito',
      '03': 'Nota de Crédito',
      '04': 'Nota de Remisión',
      '05': 'Comprobante de Retención'
    };
    return names[tipoDocumento] || 'Desconocido';
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

    // Validar longitud de rangos (máximo 8 caracteres)
    if (newCAI.rangoInicial.length > 8 || newCAI.rangoFinal.length > 8) {
      showError('Los rangos deben tener máximo 8 caracteres');
      return;
    }

    // Validar longitud de punto de emisión y establecimiento (3 caracteres)
    if (newCAI.puntoEmision.length !== 3 || newCAI.establecimiento.length !== 3) {
      showError('El punto de emisión y establecimiento deben tener 3 dígitos');
      return;
    }

    try {
      const caiData: CAIRegistroData = {
        cai: newCAI.cai,
        fechaLimiteEmision: newCAI.fechaLimiteEmision,
        rangoInicial: newCAI.rangoInicial.padStart(8, '0'),
        rangoFinal: newCAI.rangoFinal.padStart(8, '0'),
        tipoDocumento: newCAI.tipoDocumento,
        puntoEmision: newCAI.puntoEmision,
        establecimiento: newCAI.establecimiento
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
          tipoDocumento: '01',
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

  const startEditCAI = (cai: any) => {
    setEditingCAI({
      id: cai.id,
      data: {
        cai: cai.cai,
        fechaLimiteEmision: cai.fechaLimiteEmision.split('T')[0], // Formatear fecha
        rangoInicial: cai.rangoInicial,
        rangoFinal: cai.rangoFinal,
        tipoDocumento: cai.tipoDocumento,
        puntoEmision: cai.puntoEmision,
        establecimiento: cai.establecimiento,
        ultimoNumeroUtilizado: cai.ultimoNumeroUtilizado || 0,
        activo: cai.activo
      }
    });
    setShowCAIForm(false);
  };

  const handleEditCAIChange = (field: keyof CAIFormData, value: any) => {
    if (!editingCAI) return;
    setEditingCAI({
      ...editingCAI,
      data: {
        ...editingCAI.data,
        [field]: value
      }
    });
  };

  const saveEditCAI = async () => {
    if (!editingCAI) return;

    const { data } = editingCAI;

    if (!data.cai || !data.fechaLimiteEmision || !data.rangoInicial || !data.rangoFinal) {
      showError('Por favor complete todos los campos obligatorios del CAI');
      return;
    }

    // Validaciones
    if (data.rangoInicial.length > 8 || data.rangoFinal.length > 8) {
      showError('Los rangos deben tener máximo 8 caracteres');
      return;
    }

    if (data.puntoEmision.length !== 3 || data.establecimiento.length !== 3) {
      showError('El punto de emisión y establecimiento deben tener 3 dígitos');
      return;
    }

    try {
      const caiData: CAIRegistroData & { ultimoNumeroUtilizado?: number; activo?: boolean } = {
        cai: data.cai,
        fechaLimiteEmision: data.fechaLimiteEmision,
        rangoInicial: data.rangoInicial.padStart(8, '0'),
        rangoFinal: data.rangoFinal.padStart(8, '0'),
        tipoDocumento: data.tipoDocumento,
        puntoEmision: data.puntoEmision,
        establecimiento: data.establecimiento,
        ultimoNumeroUtilizado: data.ultimoNumeroUtilizado,
        activo: data.activo
      };

      const result = await companyConfigService.updateCAI(editingCAI.id, caiData);
      
      if (result.success) {
        await loadConfig();
        setEditingCAI(null);
        showSuccess('CAI actualizado exitosamente');
      } else {
        showError(result.message || 'Error al actualizar el CAI');
      }
    } catch (error) {
      console.error('Error actualizando CAI:', error);
      showError('Error al actualizar el CAI');
    }
  };

  const cancelEditCAI = () => {
    setEditingCAI(null);
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
              onClick={() => {
                setEditingCAI(null);
                setShowCAIForm(true);
              }}
              className="bg-green-600 hover:bg-green-700"
              disabled={editingCAI !== null}
            >
              + Agregar CAI
            </Button>
          </div>

          {/* Lista de CAIs existentes */}
          {config.cais.length > 0 && !editingCAI && (
            <div className="space-y-4 mb-6">
              <div className="text-xs text-gray-500 mb-2">
                 {config.cais.length} CAI configurados
              </div>
              {config.cais.map((cai) => (
                <div key={cai.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        cai.estadoFiscal === 'Vigente' ? 'bg-green-100 text-green-800' :
                        cai.estadoFiscal === 'Vencido' ? 'bg-red-100 text-red-800' :
                        cai.estadoFiscal === 'Agotado' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cai.estadoFiscal || (cai.activo ? 'Activo' : 'Inactivo')}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                        {getDocumentTypeName(cai.tipoDocumento)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => startEditCAI(cai)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => removeCAI(cai.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">CAI</p>
                      <p className="text-sm text-gray-900 font-mono break-all">{cai.cai}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Formato de Numeración</p>
                      <p className="text-sm text-gray-900 font-mono">
                        {cai.establecimiento}-{cai.puntoEmision}-{cai.tipoDocumento}-XXXXXXXX
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Rango Autorizado</p>
                      <p className="text-sm text-gray-900 font-mono">
                        {cai.rangoInicial} - {cai.rangoFinal}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Fecha Límite de Emisión</p>
                      <p className="text-sm text-gray-900">{new Date(cai.fechaLimiteEmision).toLocaleDateString('es-HN')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Último Número Utilizado</p>
                      <p className="text-sm text-gray-900 font-mono">
                        {cai.ultimoNumeroUtilizado || 0} / {parseInt(cai.rangoFinal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Facturas Disponibles</p>
                      <p className={`text-sm font-semibold ${
                        (cai.facturasDisponibles || 0) < 100 ? 'text-red-600' :
                        (cai.facturasDisponibles || 0) < 500 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {cai.facturasDisponibles || 0} restantes
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulario de edición de CAI */}
          {editingCAI && (
            <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50 mb-6">
              <h4 className="font-medium mb-4 text-blue-900">Editar CAI</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Código CAI (proporcionado por SAR)*"
                    value={editingCAI.data.cai}
                    onChange={(e) => handleEditCAIChange('cai', e.target.value.toUpperCase())}
                    placeholder="Ej: A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6"
                    maxLength={40}
                  />
                </div>
                
                <Select
                  label="Tipo de Documento*"
                  value={editingCAI.data.tipoDocumento}
                  onChange={(e) => handleEditCAIChange('tipoDocumento', e.target.value)}
                  options={[
                    { value: '01', label: '01 - Factura' },
                    { value: '02', label: '02 - Nota de Débito' },
                    { value: '03', label: '03 - Nota de Crédito' },
                    { value: '04', label: '04 - Nota de Remisión' },
                    { value: '05', label: '05 - Comprobante de Retención' }
                  ]}
                />
                <Input
                  label="Fecha Límite de Emisión*"
                  type="date"
                  value={editingCAI.data.fechaLimiteEmision}
                  onChange={(e) => handleEditCAIChange('fechaLimiteEmision', e.target.value)}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Establecimiento*"
                    value={editingCAI.data.establecimiento}
                    onChange={(e) => handleEditCAIChange('establecimiento', e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="001"
                    maxLength={3}
                    helperText="3 dígitos"
                  />
                  <Input
                    label="Punto de Emisión*"
                    value={editingCAI.data.puntoEmision}
                    onChange={(e) => handleEditCAIChange('puntoEmision', e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="001"
                    maxLength={3}
                    helperText="3 dígitos"
                  />
                </div>
                
                <div className="p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Formato de Correlativo:</p>
                  <p className="text-lg font-mono text-blue-700">
                    {editingCAI.data.establecimiento || '000'}-{editingCAI.data.puntoEmision || '000'}-{editingCAI.data.tipoDocumento}-XXXXXXXX
                  </p>
                </div>
                
                <Input
                  label="Rango Inicial (8 dígitos)*"
                  value={editingCAI.data.rangoInicial}
                  onChange={(e) => handleEditCAIChange('rangoInicial', e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="00000001"
                  maxLength={8}
                  helperText="Solo números, máximo 8 dígitos"
                />
                <Input
                  label="Rango Final (8 dígitos)*"
                  value={editingCAI.data.rangoFinal}
                  onChange={(e) => handleEditCAIChange('rangoFinal', e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="99999999"
                  maxLength={8}
                  helperText="Solo números, máximo 8 dígitos"
                />
                
                <Input
                  label="Último Número Utilizado"
                  type="number"
                  value={editingCAI.data.ultimoNumeroUtilizado?.toString() || '0'}
                  onChange={(e) => handleEditCAIChange('ultimoNumeroUtilizado', parseInt(e.target.value) || 0)}
                  helperText="Número del último correlativo utilizado"
                />
                
                <div className="flex items-center pt-6">
                  <input
                    id="edit-activo"
                    type="checkbox"
                    checked={editingCAI.data.activo || false}
                    onChange={(e) => handleEditCAIChange('activo', e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="edit-activo" className="ml-2 text-sm text-gray-700 font-medium">
                    CAI Activo
                  </label>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong></strong> Modificar estos datos puede afectar la numeración de facturas. 
                  Asegúrese de que los cambios cumplan con la legislación fiscal hondureña.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  onClick={cancelEditCAI}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveEditCAI}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}

          {/* Formulario para nuevo CAI */}
          {showCAIForm && !editingCAI && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-blue-50">
              <h4 className="font-medium mb-4">Nuevo CAI</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Código CAI (proporcionado por SAR)*"
                    value={newCAI.cai}
                    onChange={(e) => handleCAIChange('cai', e.target.value.toUpperCase())}
                    placeholder="Ej: A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6"
                    maxLength={40}
                  />
                </div>
                
                <Select
                  label="Tipo de Documento*"
                  value={newCAI.tipoDocumento}
                  onChange={(e) => handleCAIChange('tipoDocumento', e.target.value)}
                  options={[
                    { value: '01', label: '01 - Factura' },
                    { value: '02', label: '02 - Nota de Débito' },
                    { value: '03', label: '03 - Nota de Crédito' },
                    { value: '04', label: '04 - Nota de Remisión' },
                    { value: '05', label: '05 - Comprobante de Retención' }
                  ]}
                />
                <Input
                  label="Fecha Límite de Emisión*"
                  type="date"
                  value={newCAI.fechaLimiteEmision}
                  onChange={(e) => handleCAIChange('fechaLimiteEmision', e.target.value)}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Establecimiento*"
                    value={newCAI.establecimiento}
                    onChange={(e) => handleCAIChange('establecimiento', e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="001"
                    maxLength={3}
                    helperText="3 dígitos"
                  />
                  <Input
                    label="Punto de Emisión*"
                    value={newCAI.puntoEmision}
                    onChange={(e) => handleCAIChange('puntoEmision', e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="001"
                    maxLength={3}
                    helperText="3 dígitos"
                  />
                </div>
                
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Formato de Correlativo:</p>
                  <p className="text-lg font-mono text-blue-600">
                    {newCAI.establecimiento || '000'}-{newCAI.puntoEmision || '000'}-{newCAI.tipoDocumento}-XXXXXXXX
                  </p>
                </div>
                
                <Input
                  label="Rango Inicial (8 dígitos)*"
                  value={newCAI.rangoInicial}
                  onChange={(e) => handleCAIChange('rangoInicial', e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="00000001"
                  maxLength={8}
                  helperText="Solo números, máximo 8 dígitos"
                />
                <Input
                  label="Rango Final (8 dígitos)*"
                  value={newCAI.rangoFinal}
                  onChange={(e) => handleCAIChange('rangoFinal', e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="99999999"
                  maxLength={8}
                  helperText="Solo números, máximo 8 dígitos"
                />
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Ejemplo de numeración:</strong> Si configura Establecimiento: 001, Punto de Emisión: 001, 
                  Tipo: 01 (Factura), Rango: 00000001 a 00001000, las facturas se numerarán como: 
                  <span className="font-mono ml-1">001-001-01-00000001</span>
                </p>
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

          {config.cais.length === 0 && !showCAIForm && !editingCAI && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No hay CAI configurados</p>
              <p className="text-sm">Debe configurar al menos un CAI para poder emitir facturas</p>
              <p className="text-xs mt-2 text-gray-400">
                Debug: config.cais.length = {config.cais.length}
              </p>
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
