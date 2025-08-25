import { useState } from 'react';
import { Card, Button, Input, Select } from '../../../componentes/comunes/UI';

interface CAIConfig {
  cai: string;
  fechaLimiteEmision: string;
  rangeFrom: string;
  rangeTo: string;
  currentNumber: string;
  tipoDocumento: 'factura' | 'nota-debito' | 'nota-credito' | 'nota-remision' | 'comprobante-retencion';
  puntoEmision: string;
  establecimiento: string;
}

interface CompanyData {
  businessName: string;
  tradeName: string;
  rtn: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
}

interface BillingConfig {
  regimenFiscal: 'normal' | 'simplificado' | 'opcional';
  obligadoLlevarContabilidad: boolean;
  contribuyenteISV: boolean;
  agenteRetencionISV: boolean;
  sujetoPercepcionISV: boolean;
  cais: CAIConfig[];
}

// Datos de la empresa simulados (normalmente vendrían del contexto global o API)
const mockCompanyData: CompanyData = {
  businessName: 'Taller Mecánico XD',
  tradeName: 'La Esperanza',
  rtn: '1001200300188',
  address: 'Col. Las Flores, Calle Principal #123',
  city: 'LA ESPERANZA',
  state: 'INTIBUCA',
  phone: '2783-5678',
  email: 'info@talleresp.com'
};

export function BillingConfigSection() {
  const [config, setConfig] = useState<BillingConfig>({
    regimenFiscal: 'normal',
    obligadoLlevarContabilidad: true,
    contribuyenteISV: true,
    agenteRetencionISV: false,
    sujetoPercepcionISV: false,
    cais: []
  });

  const [newCAI, setNewCAI] = useState<CAIConfig>({
    cai: '',
    fechaLimiteEmision: '',
    rangeFrom: '',
    rangeTo: '',
    currentNumber: '',
    tipoDocumento: 'factura',
    puntoEmision: '001',
    establecimiento: '001'
  });

  const [showCAIForm, setShowCAIForm] = useState(false);

  // Función para obtener el código numérico del tipo de documento
  const getDocumentCode = (tipoDocumento: CAIConfig['tipoDocumento']): string => {
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
  const getDocumentTypeName = (tipoDocumento: CAIConfig['tipoDocumento']): string => {
    const names = {
      'factura': 'Factura',
      'nota-debito': 'Nota de Débito',
      'nota-credito': 'Nota de Crédito',
      'nota-remision': 'Nota de Remisión',
      'comprobante-retencion': 'Comprobante de Retención'
    };
    return names[tipoDocumento] || 'Factura';
  };

  const handleConfigChange = (field: keyof BillingConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCAIChange = (field: keyof CAIConfig, value: string) => {
    setNewCAI(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCAI = () => {
    if (!newCAI.cai || !newCAI.fechaLimiteEmision || !newCAI.rangeFrom || !newCAI.rangeTo) {
      alert('Por favor complete todos los campos obligatorios del CAI');
      return;
    }

    setConfig(prev => ({
      ...prev,
      cais: [...prev.cais, { ...newCAI }]
    }));

    setNewCAI({
      cai: '',
      fechaLimiteEmision: '',
      rangeFrom: '',
      rangeTo: '',
      currentNumber: '',
      tipoDocumento: 'factura',
      puntoEmision: '001',
      establecimiento: '001'
    });
    setShowCAIForm(false);
  };

  const removeCAI = (index: number) => {
    setConfig(prev => ({
      ...prev,
      cais: prev.cais.filter((_, i) => i !== index)
    }));
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

  const handleSave = () => {
    // Validar que los datos de la empresa estén configurados
    if (!mockCompanyData.rtn || !validateRTN(mockCompanyData.rtn)) {
      alert('RTN de la empresa no válido. Por favor configure primero los datos de la empresa.');
      return;
    }

    if (!mockCompanyData.businessName || !mockCompanyData.address) {
      alert('Faltan datos obligatorios de la empresa. Por favor configure primero los datos de la empresa.');
      return;
    }

    if (config.cais.length === 0) {
      alert('Debe configurar al menos un CAI para poder facturar');
      return;
    }

    // Aquí se guardaría la configuración
    console.log('Configuración de facturación guardada:', config);
    alert('Configuración de facturación guardada exitosamente');
  };

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
                <p className="text-lg text-gray-900 font-mono">{formatRTN(mockCompanyData.rtn)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Nombre Comercial</p>
                <p className="text-lg text-gray-900">{mockCompanyData.tradeName}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700">Razón Social</p>
                <p className="text-lg text-gray-900">{mockCompanyData.businessName}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700">Dirección Fiscal</p>
                <p className="text-lg text-gray-900">{mockCompanyData.address}, {mockCompanyData.city}, {mockCompanyData.state}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Teléfono</p>
                <p className="text-lg text-gray-900">{mockCompanyData.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Correo Electrónico</p>
                <p className="text-lg text-gray-900">{mockCompanyData.email}</p>
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
                onChange={(e) => handleConfigChange('regimenFiscal', e.target.value as BillingConfig['regimenFiscal'])}
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
              {config.cais.map((cai, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
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
                        <p className="text-sm text-gray-900">{cai.rangeFrom} - {cai.rangeTo}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Vencimiento</p>
                        <p className="text-sm text-gray-900">{cai.fechaLimiteEmision}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeCAI(index)}
                      className="ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                    >
                      Eliminar
                    </Button>
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
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Formato de Numeración del Documento:
                    </p>
                    <div className="font-mono text-lg text-yellow-800 bg-white px-3 py-2 rounded border">
                      {newCAI.establecimiento || '001'}-{newCAI.puntoEmision || '001'}-{getDocumentCode(newCAI.tipoDocumento)}-{(newCAI.rangeFrom || '00000001').padStart(8, '0')}
                    </div>
                    <div className="text-xs text-yellow-600 mt-2 grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <div className="font-medium">Est.</div>
                        <div>{newCAI.establecimiento || '001'}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Pto.</div>
                        <div>{newCAI.puntoEmision || '001'}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Tipo</div>
                        <div>{getDocumentCode(newCAI.tipoDocumento)}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Correlativo</div>
                        <div>{(newCAI.rangeFrom || '00000001').padStart(8, '0')}</div>
                      </div>
                    </div>
                  </div>
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
                  value={newCAI.rangeFrom}
                  onChange={(e) => handleCAIChange('rangeFrom', e.target.value)}
                  placeholder="00000001"
                />
                <Input
                  label="Hasta (Número)*"
                  value={newCAI.rangeTo}
                  onChange={(e) => handleCAIChange('rangeTo', e.target.value)}
                  placeholder="10000000"
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
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    Códigos de Tipos de Documento Fiscal:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                    <div>01 → Factura</div>
                    <div>02 → Nota de Débito</div>
                    <div>03 → Nota de Crédito</div>
                    <div>04 → Nota de Remisión</div>
                    <div>05 → Comprobante de Retención</div>
                  </div>
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
