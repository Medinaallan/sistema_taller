import { useState, useEffect } from 'react';

// Interfaz para Factura desde BD
interface FacturaDB {
  factura_id: number;
  numero: string;
  cai_grabado: string;
  fecha_emision: string;
  estado: 'Pendiente' | 'Pagada';
  cliente_id: number;
  nombre_cliente: string;
  telefono: string;
  subtotal: number;
  impuestos: number;
  total: number;
  saldo_pendiente: number;
  numero_ot: string;
}

interface PendingInvoice extends FacturaDB {
  clientName: string;
  vehicleName: string;
  totalAmount: number;
  clientEmail?: string;
  clientPhone?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
}

export const usePendingInvoices = () => {
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingInvoicesFromDB = async (): Promise<PendingInvoice[]> => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    
    try {
      
      
      // Obtener facturas con estado "Pendiente" usando el SP
      const response = await fetch(`${API_BASE_URL}/invoices?estado=Pendiente`);
      
      if (!response.ok) {
        throw new Error('Error al obtener facturas pendientes');
      }
      
      const result = await response.json();
      const facturas = result.data as FacturaDB[];
      
      
      
      // Mapear facturas a la interfaz PendingInvoice
      const pendingInvoices: PendingInvoice[] = facturas.map(factura => ({
        ...factura,
        clientName: factura.nombre_cliente || 'Cliente no especificado',
        vehicleName: '', // No viene en el SP, si necesitas vehículo debes hacer un join o query adicional
        totalAmount: factura.total,
        clientPhone: factura.telefono || '',
        clientEmail: '',
        vehiclePlate: '',
        vehicleColor: ''
      }));
      
      return pendingInvoices;
    } catch (error) {
      console.error('❌ Error obteniendo facturas pendientes:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchPendingInvoices = async () => {
      try {
        setLoading(true);
        const facturas = await fetchPendingInvoicesFromDB();
        setPendingInvoices(facturas);
      } catch (error) {
        console.error('Error fetching pending invoices:', error);
        setPendingInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingInvoices();
  }, []);

  // Esta función ya no es necesaria porque las facturas se generan automáticamente
  // al completar la OT. Ahora solo actualizamos el estado de la factura a "Pagada"
  const markAsInvoiced = async (facturaId: number) => {
    try {
      
      
      // TODO: Implementar endpoint para cambiar estado de factura a "Pagada"
      // Por ahora, solo actualizamos el estado local
      
      setPendingInvoices(prev => 
        prev.filter(invoice => invoice.factura_id !== facturaId)
      );
      
      return {
        success: true,
        message: 'Factura marcada como pagada'
      };
    } catch (error) {
      console.error('Error marcando factura como pagada:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const refreshPendingInvoices = async () => {
    setLoading(true);
    try {
      
      const facturas = await fetchPendingInvoicesFromDB();
      setPendingInvoices(facturas);
    } catch (error) {
      console.error('Error refreshing pending invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    pendingInvoices,
    loading,
    markAsInvoiced,
    refreshPendingInvoices
  };
};

export default usePendingInvoices;