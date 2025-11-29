import { useState, useEffect } from 'react';
import { Modal, Button, Card } from '../comunes/UI';
import quotationsService, { type QuotationData } from '../../servicios/quotationsService';

interface ViewQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationId: string | null;
}

interface QuotationItem {
  cot_item_id: string;
  cotizacion_id: string;
  tipo_item: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_unitario: number;
  total_linea: number;
}

const ViewQuotationModal = ({ isOpen, onClose, quotationId }: ViewQuotationModalProps) => {
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && quotationId) {
      loadQuotationDetails();
    }
  }, [isOpen, quotationId]);

  const loadQuotationDetails = async () => {
    if (!quotationId) return;
    
    try {
      setLoading(true);
      const quotData = await quotationsService.getQuotationById(quotationId);
      setQuotation(quotData);
      
      const itemsData = await quotationsService.getQuotationItems(quotationId);
      setItems(itemsData as QuotationItem[]);
    } catch (error) {
      console.error('Error cargando detalles de cotización:', error);
      alert('Error cargando detalles: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cotización #${quotation?.numero_cotizacion || 'Cargando...'}`} size="lg">
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="text-gray-500">Cargando detalles...</div>
          </div>
        ) : quotation ? (
          <>
            {/* Información General */}
            <Card title="Información General" variant="subtle">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Número</p>
                  <p className="font-mono font-semibold text-lg">{quotation.numero_cotizacion}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Estado</p>
                  <p className={`font-semibold text-sm ${
                    quotation.estado_cotizacion === 'Pendiente' ? 'text-gray-600' :
                    quotation.estado_cotizacion === 'Enviada' ? 'text-blue-600' :
                    quotation.estado_cotizacion === 'Aprobada' ? 'text-green-600' :
                    quotation.estado_cotizacion === 'Rechazada' ? 'text-red-600' :
                    'text-purple-600'
                  }`}>
                    {quotationsService.formatStatus(quotation.estado_cotizacion)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Cliente</p>
                  <p className="font-semibold">{quotation.nombre_cliente}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Vehículo</p>
                  <p className="font-mono font-semibold">{quotation.placa_vehiculo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Cita #</p>
                  <p className="font-mono">{quotation.numero_cita}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">OT #</p>
                  <p className="font-mono">{quotation.numero_ot || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Creación</p>
                  <p>{new Date(quotation.fecha_creacion).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Vencimiento</p>
                  <p>{quotation.fecha_vencimiento ? new Date(quotation.fecha_vencimiento).toLocaleDateString('es-ES') : '-'}</p>
                </div>
              </div>
              {quotation.comentario && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500 uppercase mb-1">Comentarios</p>
                  <p className="text-sm text-gray-700">{quotation.comentario}</p>
                </div>
              )}
            </Card>

            {/* Items */}
            <Card title={`Items (${items.length})`} variant="subtle">
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Sin items agregados</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-2">Tipo</th>
                        <th className="px-4 py-2">Descripción</th>
                        <th className="px-4 py-2">Cant.</th>
                        <th className="px-4 py-2">P. Unit.</th>
                        <th className="px-4 py-2">Desc.</th>
                        <th className="px-4 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.cot_item_id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.tipo_item === 'Servicio' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {item.tipo_item}
                            </span>
                          </td>
                          <td className="px-4 py-2">{item.descripcion}</td>
                          <td className="px-4 py-2 text-center font-mono">{item.cantidad.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right font-mono">L{item.precio_unitario.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right font-mono">{item.descuento_unitario > 0 ? `L${item.descuento_unitario.toFixed(2)}` : '-'}</td>
                          <td className="px-4 py-2 text-right font-semibold">L{item.total_linea.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Total */}
            <Card variant="subtle" className="bg-blue-50">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Total Cotización:</span>
                <span className="text-2xl font-bold text-blue-600">L{quotation.total?.toFixed(2)}</span>
              </div>
            </Card>

            {/* Botón cerrar */}
            <div className="flex justify-end gap-2">
              <Button onClick={onClose} variant="secondary">
                Cerrar
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No se encontró la cotización
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ViewQuotationModal;
