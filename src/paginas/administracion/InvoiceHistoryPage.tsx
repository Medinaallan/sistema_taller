import { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../../componentes/comunes/UI';
import { DocumentTextIcon, PrinterIcon, EyeIcon, XCircleIcon } from '@heroicons/react/24/outline';
import invoicesService, { type Invoice } from '../../servicios/invoicesService';
import Swal from 'sweetalert2';

export function InvoiceHistoryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pagada' | 'pendiente' | 'anulada'>('all');
  const [stats, setStats] = useState({ total: 0, hoy: 0, montoTotal: 0, montoHoy: 0 });

  useEffect(() => {
    loadInvoices();
    loadStats();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, filterStatus, invoices]);

  const loadInvoices = async () => {
    const allInvoices = await invoicesService.getAllInvoices();
    setInvoices((allInvoices || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const loadStats = async () => {
    const statistics = await invoicesService.getStatistics();
    setStats(statistics as any);
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(inv => inv.estado === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(inv =>
        inv.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  };

  const handlePrintInvoice = async (invoice: Invoice) => {
    // Load the freshest invoice from backend to ensure persisted fields (discount, exento, exonerado)
    let freshInvoice = invoice;
    try {
      const got = await invoicesService.getInvoiceById(invoice.id);
      if (got) freshInvoice = got;
    } catch (err) {
      // fallback to passed invoice
    }
    const { value: format } = await Swal.fire({
      title: 'Seleccionar Formato de Impresión',
      html: `
        <div style="display: flex; flex-direction: column; gap: 15px; padding: 20px;">
          <button id="btn-carta" style="padding: 15px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 10px;">
            <span>📄</span>
            <div style="text-align: left;">
              <div style="font-weight: bold;">Formato Carta SAR</div>
              <div style="font-size: 12px; opacity: 0.9;">Tamaño carta (8.5" x 11") - Formato oficial</div>
            </div>
          </button>
          <button id="btn-ticket" style="padding: 15px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 10px;">
            <span>🧾</span>
            <div style="text-align: left;">
              <div style="font-weight: bold;">Formato Ticket POS</div>
              <div style="font-size: 12px; opacity: 0.9;">80mm - Para impresoras térmicas</div>
            </div>
          </button>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        const btnCarta = document.getElementById('btn-carta');
        const btnTicket = document.getElementById('btn-ticket');
        
        if (btnCarta) {
          btnCarta.onclick = () => {
            Swal.clickConfirm();
            Swal.close();
            invoicesService.printInvoiceCarta(freshInvoice);
          };
        }
        
        if (btnTicket) {
          btnTicket.onclick = () => {
            Swal.clickConfirm();
            Swal.close();
            invoicesService.printInvoiceTicket(freshInvoice);
          };
        }
      }
    });
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    const itemsHTML = invoice.items.map(item => `
      <tr>
        <td style="text-align: left; padding: 5px;">${item.name}</td>
        <td style="text-align: center; padding: 5px;">${item.quantity}</td>
        <td style="text-align: right; padding: 5px;">L ${item.price.toFixed(2)}</td>
        <td style="text-align: right; padding: 5px;">L ${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    await Swal.fire({
      title: `Factura ${invoice.numero}`,
      html: `
        <div style="text-align: left;">
          <p><strong>Cliente:</strong> ${invoice.clientName}</p>
          <p><strong>Fecha:</strong> ${new Date(invoice.fecha).toLocaleString('es-HN')}</p>
          <hr style="margin: 15px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="text-align: left; padding: 5px;">Descripción</th>
                <th style="text-align: center; padding: 5px;">Cant.</th>
                <th style="text-align: right; padding: 5px;">Precio</th>
                <th style="text-align: right; padding: 5px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          <hr style="margin: 15px 0;">
          <div style="text-align: right;">
            <p><strong>Subtotal:</strong> L ${invoice.subtotal.toFixed(2)}</p>
            ${invoice.discount > 0 ? `<p><strong>Descuento:</strong> - L ${invoice.discount.toFixed(2)}</p>` : ''}
            <p><strong>ISV (15%):</strong> L ${invoice.tax.toFixed(2)}</p>
            <p style="font-size: 1.2em; margin-top: 10px;"><strong>TOTAL:</strong> L ${invoice.total.toFixed(2)}</p>
          </div>
        </div>
      `,
      width: 700,
      confirmButtonText: '🖨️ Imprimir',
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#3b82f6'
    }).then((result) => {
      if (result.isConfirmed) {
        handlePrintInvoice(invoice);
      }
    });
  };

  const handleAnularInvoice = async (invoice: Invoice) => {
    const result = await Swal.fire({
      title: '¿Anular Factura?',
      text: `¿Está seguro de anular la factura ${invoice.numero}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const success = await invoicesService.anularInvoice(invoice.id);
      if (success) {
        await Swal.fire({
          icon: 'success',
          title: 'Factura Anulada',
          text: `La factura ${invoice.numero} ha sido anulada exitosamente`,
          confirmButtonColor: '#3b82f6'
        });
        await loadInvoices();
        await loadStats();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Facturas</h1>
          <p className="text-gray-600">Gestiona y consulta todas las facturas generadas</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Facturas</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <DocumentTextIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{stats.hoy}</div>
            <div className="text-sm text-gray-600">Facturas Hoy</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">L {stats.montoTotal.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Monto Total</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">L {stats.montoHoy.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Monto Hoy</div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Buscar facturas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número de factura o cliente..."
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="pagada">Pagadas</option>
              <option value="pendiente">Pendientes</option>
              <option value="anulada">Anuladas</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabla de facturas */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.numero}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.fecha).toLocaleString('es-HN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    L {invoice.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        invoice.estado === 'pagada' ? 'success' :
                        invoice.estado === 'pendiente' ? 'warning' :
                        'default'
                      }
                    >
                      {invoice.estado.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewInvoice(invoice)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-5 w-5 inline" />
                    </button>
                    <button
                      onClick={() => handlePrintInvoice(invoice)}
                      className="text-purple-600 hover:text-purple-900"
                      title="Imprimir"
                    >
                      <PrinterIcon className="h-5 w-5 inline" />
                    </button>
                    {invoice.estado !== 'anulada' && (
                      <button
                        onClick={() => handleAnularInvoice(invoice)}
                        className="text-red-600 hover:text-red-900"
                        title="Anular"
                      >
                        <XCircleIcon className="h-5 w-5 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron facturas
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default InvoiceHistoryPage;
