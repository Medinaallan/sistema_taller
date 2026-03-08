import { useState, useCallback, useEffect } from 'react';
import { appConfig } from '../../config/config';
import { Card, Button, Select, Input } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import type { ReportFilters, FinancialStats } from '../../tipos/index';
import { formatCurrency } from '../../utilidades/globalMockDatabase';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
// Chart.js React components - REMOVED (no longer needed)
// Interfaces for mechanics - REMOVED (no longer needed)

// Registramos todos los elementos necesarios para los gráficos
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Configuración global de los gráficos
ChartJS.defaults.color = '#64748b';
ChartJS.defaults.font.family = 'Inter, system-ui, sans-serif';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Componente para el filtro de fechas y otros filtros
function ReportFilters({ filters, onChange }: { 
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
}) {
  const { state } = useApp();
  const mechanicOptions = state.users
    .filter(user => user.role === 'mechanic')
    .map(user => ({ value: user.id, label: user.name }));

  return (
    <Card>
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Filtros de Reporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            type="date"
            label="Fecha Inicio"
            value={filters.startDate.toISOString().split('T')[0]}
            onChange={(e) => onChange({
              ...filters,
              startDate: new Date(e.target.value)
            })}
          />
          <Input
            type="date"
            label="Fecha Fin"
            value={filters.endDate.toISOString().split('T')[0]}
            onChange={(e) => onChange({
              ...filters,
              endDate: new Date(e.target.value)
            })}
          />
          <Select
            label="Mecánico"
            value={filters.mechanicId || ''}
            onChange={(e) => onChange({
              ...filters,
              mechanicId: e.target.value || undefined
            })}
            options={[
              { value: '', label: 'Todos los mecánicos' },
              ...mechanicOptions
            ]}
          />
          <Select
            label="Estado"
            value={filters.status || ''}
            onChange={(e) => onChange({
              ...filters,
              status: (e.target.value as ReportFilters['status']) || undefined
            })}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'completed', label: 'Completadas' },
              { value: 'in-progress', label: 'En Proceso' },
              { value: 'pending', label: 'Pendientes' },
              { value: 'rejected', label: 'Rechazadas' }
            ]}
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button>
            Filtrar Reporte
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Componente para el reporte financiero
function FinancialReport({ stats, loading, onRefresh, onGenerateExcel }: { stats: FinancialStats; loading?: boolean; onRefresh?: () => Promise<void>; onGenerateExcel?: () => Promise<void> }) {
  return (
    <Card>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Reporte Financiero</h2>
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando datos...</span>
          </div>
        )}
        {!loading && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Ventas Totales</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Importe Gravado</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.taxableAmount)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">ISV (15%)</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.isv)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Total con Impuestos</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalWithTax)}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Pagos en Efectivo</p>
            <p className="text-xl font-semibold">{formatCurrency(stats.cashPayments)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Pagos con Tarjeta</p>
            <p className="text-xl font-semibold">{formatCurrency(stats.cardPayments)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Transferencias</p>
            <p className="text-xl font-semibold">{formatCurrency(stats.transferPayments)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Pagos Pendientes</p>
            <p className="text-xl font-semibold text-red-600">{formatCurrency(stats.pendingPayments)}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <Button
            onClick={async () => {
              if (onGenerateExcel) {
                await onGenerateExcel();
              }
            }}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generar Reporte Excel
          </Button>
          <Button
            onClick={async () => {
              if (onRefresh) {
                await Swal.fire({
                  icon: 'info',
                  title: 'Generando Reporte',
                  text: 'Actualizando datos financieros...',
                  showConfirmButton: false,
                  timer: 1000
                });
                await onRefresh();
                Swal.fire({
                  icon: 'success',
                  title: 'Reporte Actualizado',
                  text: 'Los datos se han actualizado correctamente',
                  confirmButtonColor: '#3b82f6',
                  timer: 2000
                });
              }
            }}
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Actualizar Datos'}
          </Button>
        </div>
        </>
        )}
      </div>
    </Card>
  );
}

// Componente ServiceReport - DESHABILITADO (código removido)
// Componente SatisfactionReport - DESHABILITADO (código removido)

// Componente principal de la página de reportes
// function prepareFinancialData(stats: FinancialStats) {
//   return [
//     ['REPORTE FINANCIERO'],
//     [''],
//     ['RESUMEN GENERAL'],
//     ['Métrica', 'Valor'],
//     ['Ventas Totales', stats.totalSales],
//     ['Importe Gravado', stats.taxableAmount],
//     ['ISV (15%)', stats.isv],
//     ['Total con Impuestos', stats.totalWithTax],
//     [''],
//     ['DISTRIBUCIÓN DE PAGOS'],
//     ['Método', 'Monto', 'Porcentaje'],
//     ['Efectivo', stats.cashPayments, (stats.cashPayments / stats.totalSales * 100).toFixed(2) + '%'],
//     ['Tarjeta', stats.cardPayments, (stats.cardPayments / stats.totalSales * 100).toFixed(2) + '%'],
//     ['Transferencia', stats.transferPayments, (stats.transferPayments / stats.totalSales * 100).toFixed(2) + '%'],
//     ['Pendiente', stats.pendingPayments, (stats.pendingPayments / stats.totalSales * 100).toFixed(2) + '%'],
//     ['Total', stats.totalSales, '100%']
//   ];
// }

// function prepareServicesData(serviceData: any) {
//   const totalServices = serviceData.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
//   
//   return [
//     ['REPORTE DE SERVICIOS'],
//     [''],
//     ['DISTRIBUCIÓN DE SERVICIOS'],
//     ['Tipo de Servicio', 'Cantidad', 'Porcentaje'],
//     ...serviceData.labels.map((label: string, index: number) => [
//       label, 
//       serviceData.datasets[0].data[index],
//       ((serviceData.datasets[0].data[index] / totalServices) * 100).toFixed(2) + '%'
//     ]),
//     ['Total', totalServices, '100%'],
//     [''],
//     ['MÉTRICAS ACTUALES'],
//     ['Indicador', 'Valor', 'Tendencia'],
//     ['Servicios este periodo', '0', '+ 0% vs periodo anterior'],
//     ['Ingresos Totales', formatCurrency(0), '+ 0% vs periodo anterior'],
//     ['Tiempo Promedio', '0h', '0% mas lento o eficiente']
//   ];
// }

// function prepareSatisfactionData(satisfactionData: any) {
//   const totalResponses = satisfactionData.datasets[0].data.reduce((a: number, b: number) => a + b, 0);

//   return [
//     ['REPORTE DE SATISFACCIÓN'],
//     [''],
//     ['DISTRIBUCIÓN DE CALIFICACIONES'],
//     ['Calificación', 'Cantidad', 'Porcentaje'],
//     ...satisfactionData.labels.map((label: string, index: number) => [
//       label,
//       satisfactionData.datasets[0].data[index],
//       ((satisfactionData.datasets[0].data[index] / totalResponses) * 100).toFixed(2) + '%'
//     ]),
//     ['Total', totalResponses, '100%'],
//     [''],
//     ['MÉTRICAS ACTUALES'],
//     ['Indicador', 'Valor', 'Estado'],
//     ['Calificación del Servicio', '0.0 / 5 estrellas', 'Sin datos anteriores'],
//     ['Opiniones de Clientes', '0', 'Este mes'],
//     ['Atención al Cliente', '0%', 'Tiempo de respuesta'],
//     ['Satisfacción General', '0%', 'de clientes satisfechos']
//   ];
// }

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  });
  const [loading, setLoading] = useState(false);

  // Estado inicial para datos financieros
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    totalSales: 0,
    taxableAmount: 0,
    isv: 0,
    totalWithTax: 0,
    cashPayments: 0,
    cardPayments: 0,
    transferPayments: 0,
    pendingPayments: 0,
  });

  // Función para cargar datos financieros desde SP_OBTENER_PAGOS
  const loadFinancialData = useCallback(async () => {
    setLoading(true);
    try {
      const API_BASE_URL = appConfig.backendBaseUrl;
      const base = API_BASE_URL.replace(/\/$/, '');
      const url = base.endsWith('/api') ? `${base}/invoice-payments/history` : `${base}/api/invoice-payments/history`;
      
      // Formatear fechas para el API (YYYY-MM-DD)
      const fechaInicio = filters.startDate.toISOString().split('T')[0];
      const fechaFin = filters.endDate.toISOString().split('T')[0];
      
      const response = await fetch(`${url}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener datos de pagos');
      }
      
      const result = await response.json();
      const pagos = result.data || [];
      
      // Calcular estadísticas desde los pagos
      let totalSales = 0;
      let cashPayments = 0;
      let cardPayments = 0;
      let transferPayments = 0;
      let pendingPayments = 0;
      
      pagos.forEach((pago: any) => {
        const monto = parseFloat(pago.monto || 0);
        const saldoPendiente = parseFloat(pago.saldo_pendiente || 0);
        
        // Sumar al total de ventas
        if (pago.estado_factura !== 'anulada') {
          totalSales += monto;
        }
        
        // Clasificar por método de pago
        const metodoPago = (pago.metodo_pago || '').toLowerCase();
        if (metodoPago.includes('efectivo')) {
          cashPayments += monto;
        } else if (metodoPago.includes('tarjeta')) {
          cardPayments += monto;
        } else if (metodoPago.includes('transferencia')) {
          transferPayments += monto;
        }
        
        // Sumar saldos pendientes
        if (saldoPendiente > 0) {
          pendingPayments += saldoPendiente;
        }
      });
      
      // Calcular base gravable e ISV (asumiendo que todo está gravado al 15%)
      // total = base + isv, donde isv = base * 0.15
      // entonces: total = base * 1.15, por lo tanto: base = total / 1.15
      const taxableAmount = totalSales / 1.15;
      const isv = taxableAmount * 0.15;
      const totalWithTax = totalSales;
      
      setFinancialStats({
        totalSales,
        taxableAmount,
        isv,
        totalWithTax,
        cashPayments,
        cardPayments,
        transferPayments,
        pendingPayments,
      });
      
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos financieros',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  // Cargar datos al montar y cuando cambien los filtros
  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  // Función para generar reporte de ventas en Excel usando SheetJS
  const generateSalesExcelReport = useCallback(async () => {
    // Mostrar loading
    Swal.fire({
      icon: 'info',
      title: 'Generando Reporte',
      text: 'Obteniendo datos de ventas...',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const API_BASE_URL = appConfig.backendBaseUrl;
      const base = API_BASE_URL.replace(/\/$/, '');
      const url = base.endsWith('/api') ? `${base}/invoice-payments/history` : `${base}/api/invoice-payments/history`;
      
      // Formatear fechas para el API (YYYY-MM-DD)
      const fechaInicio = filters.startDate.toISOString().split('T')[0];
      const fechaFin = filters.endDate.toISOString().split('T')[0];
      
      const response = await fetch(`${url}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener datos de pagos');
      }
      
      const result = await response.json();
      const pagos = result.data || [];

      // Cerrar loading antes de mostrar cualquier otro modal
      Swal.close();

      if (pagos.length === 0) {
        await Swal.fire({
          icon: 'warning',
          title: 'Sin Datos',
          text: 'No hay pagos registrados en el rango de fechas seleccionado',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }

      // Agrupar pagos por factura para evitar duplicados
      const facturaMap = new Map();
      pagos.forEach((pago: any) => {
        const facturaId = pago.factura_id;
        if (!facturaMap.has(facturaId)) {
          // Calcular subtotal e impuesto desde el total (asumiendo 15% ISV)
          const total = parseFloat(pago.total_factura || 0);
          const subtotal = total / 1.15;
          const impuesto = total - subtotal;

          facturaMap.set(facturaId, {
            fecha: pago.fecha_creacion ? new Date(pago.fecha_creacion).toLocaleDateString('es-HN') : '',
            factura: pago.numero_factura || '',
            importeGravado: subtotal,
            isv: impuesto,
            importeExento: 0,
            importeExonerado: 0,
            total: total
          });
        }
      });

      const facturasUnicas = Array.from(facturaMap.values());

      // Cargar la plantilla Excel con ExcelJS (que SÍ preserva estilos)
      const templatePath = '/TempReportsPage.xlsx';
      const templateResponse = await fetch(templatePath);
      
      if (!templateResponse.ok) {
        throw new Error('No se pudo cargar la plantilla de Excel');
      }
      
      const templateBuffer = await templateResponse.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateBuffer);
      
      // Obtener la primera hoja
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No se pudo leer la hoja de la plantilla');
      }
      
      // Llenando datos en la plantilla
      
      // Actualizar fecha y hora de generación (celda E4)
      const fechaGeneracion = new Date().toLocaleString('es-HN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const cellE4 = worksheet.getCell('E4');
      cellE4.value = fechaGeneracion;
      
      // Actualizar fechas del reporte (B5 y E5)
      worksheet.getCell('B5').value = fechaInicio;
      worksheet.getCell('E5').value = fechaFin;
      
      
      const startRow = 8; // Fila 8 para el primer dato, fila 7 tiene los headers
      
      // Calcular totales
      let totales = {
        importeGravado: 0,
        isv: 0,
        importeExento: 0,
        importeExonerado: 0,
        total: 0
      };

      // Llenar cada factura
      facturasUnicas.forEach((factura, index) => {
        const rowNum = startRow + index;
        const row = worksheet.getRow(rowNum);
        
        // Llenar datos
        row.getCell(1).value = factura.fecha; // A: Fecha
        row.getCell(2).value = factura.factura; // B: Factura
        row.getCell(3).value = factura.importeGravado; // C: Importe Gravado
        row.getCell(4).value = factura.isv; // D: ISV
        row.getCell(5).value = factura.importeExento; // E: Importe Exento
        row.getCell(6).value = factura.importeExonerado; // F: Importe Exonerado
        row.getCell(7).value = factura.total; // G: Total
        
        // Aplicar SOLO bordes y formato numérico (SIN color de fondo)
        for (let col = 1; col <= 7; col++) {
          const cell = row.getCell(col);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Formato numérico para columnas C-G (3-7)
          if (col >= 3) {
            cell.numFmt = '#,##0.00';
          }
        }
        
        row.commit();
        
        // Sumar totales
        totales.importeGravado += factura.importeGravado;
        totales.isv += factura.isv;
        totales.importeExento += factura.importeExento;
        totales.importeExonerado += factura.importeExonerado;
        totales.total += factura.total;
      });
      
      // Calcular posición de filas: TOTALES primero, luego FIN DE PAGINA
      const lastDataRow = startRow + facturasUnicas.length - 1;
      const totalRow = lastDataRow + 1; // Fila para TOTALES 
      const finPaginaRow = totalRow + 2; // 1 fila vacía después de TOTALES
      
      // Escribir fila de TOTALES
      const totalRowObj = worksheet.getRow(totalRow);
      totalRowObj.getCell(1).value = 'TOTALES';
      totalRowObj.getCell(2).value = `${facturasUnicas.length} FACTURAS PROCESADAS`;
      totalRowObj.getCell(3).value = totales.importeGravado;
      totalRowObj.getCell(4).value = totales.isv;
      totalRowObj.getCell(5).value = totales.importeExento;
      totalRowObj.getCell(6).value = totales.importeExonerado;
      totalRowObj.getCell(7).value = totales.total;
      
      // Aplicar formato a TODAS las columnas de la fila de totales (A-G)
      for (let col = 1; col <= 7; col++) {
        const cell = totalRowObj.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9E1F2' }
        };
        cell.border = {
          top: { style: 'medium' },
          bottom: { style: 'medium' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Formato numérico para columnas C-G (3-7)
        if (col >= 3) {
          cell.numFmt = '#,##0.00';
        }
      }
      
      totalRowObj.commit();
      
      // Combinar celdas para "FIN DE PAGINA" (toda la fila de A a G)
      worksheet.mergeCells(`A${finPaginaRow}:G${finPaginaRow}`);
      const finPaginaCell = worksheet.getCell(`A${finPaginaRow}`);
      finPaginaCell.value = 'FIN DE PAGINA';
      finPaginaCell.alignment = { horizontal: 'center', vertical: 'middle' };
      finPaginaCell.font = { bold: true, color: { argb: 'FFC0C0C0' }, size: 14 };
      
      // Generar el archivo Excel
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Descargar archivo
      const fileName = `reporte_ventas_${fechaInicio}_${fechaFin}.xlsx`;
      saveAs(blob, fileName);
      
      
      await Swal.fire({
        icon: 'success',
        title: 'Reporte Generado',
        text: `Se descargó ${fileName} con ${facturasUnicas.length} facturas`,
        confirmButtonColor: '#3b82f6',
        timer: 3000
      });
      
    } catch (error) {
      Swal.close(); // Asegurar que se cierre el loading
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'No se pudo generar el reporte de ventas',
        confirmButtonColor: '#3b82f6'
      });
    }
  }, [filters.startDate, filters.endDate]);

  // Estados deshabilitados - no se usan actualmente
  // const [serviceData] = useState({
  //   labels: ['Cambio de Aceite', 'Alineación', 'Frenos', 'Motor', 'Suspensión', 'Otros'],
  //   datasets: [{
  //     label: 'Servicios',
  //     data: [0, 0, 0, 0, 0, 0],
  //     backgroundColor: [
  //       'rgba(255, 99, 132, 0.8)',
  //       'rgba(54, 162, 235, 0.8)',
  //       'rgba(255, 206, 86, 0.8)',
  //       'rgba(75, 192, 192, 0.8)',
  //       'rgba(153, 102, 255, 0.8)',
  //       'rgba(201, 203, 207, 0.8)',
  //     ],
  //     borderWidth: 1,
  //   }],
  // });

  // const [satisfactionData] = useState({
  //   labels: ['5 estrellas', '4 estrellas', '3 estrellas', '2 estrellas', '1 estrella'],
  //   datasets: [{
  //     label: 'Satisfacción',
  //     data: [0, 0, 0, 0, 0],
  //     backgroundColor: [
  //       '#4CAF50',  // Verde
  //       '#8BC34A',  // Verde claro
  //       '#FFC107',  // Amarillo
  //       '#FF9800',  // Naranja
  //       '#F44336',  // Rojo
  //     ],
  //     borderWidth: 1,
  //   }],
  // });

  // Función antigua de export - deshabilitada
  // const exportToExcel = useCallback(() => {
  //   const workbook = XLSX.utils.book_new();
  //   
  //   // Reporte Financiero
  //   const financialData = prepareFinancialData(financialStats);
  //   const financialWS = XLSX.utils.aoa_to_sheet(financialData);
  //   XLSX.utils.book_append_sheet(workbook, financialWS, "Reporte Financiero");

  //   // Reporte de Servicios
  //   const servicesData = prepareServicesData(serviceData);
  //   const servicesWS = XLSX.utils.aoa_to_sheet(servicesData);
  //   XLSX.utils.book_append_sheet(workbook, servicesWS, "Reporte de Servicios");

  //   // Reporte de Satisfacción
  //   const satisfactionPreparedData = prepareSatisfactionData(satisfactionData);
  //   const satisfactionWS = XLSX.utils.aoa_to_sheet(satisfactionPreparedData);
  //   XLSX.utils.book_append_sheet(workbook, satisfactionWS, "Reporte de Satisfacción");

  //   // Dar formato a las columnas (ajustado para 3 columnas)
  //   const columnWidth = [{ wch: 35 }, { wch: 15 }, { wch: 15 }];
  //   
  //   // Aplicar formato a cada hoja
  //   ["Reporte Financiero", "Reporte de Servicios", "Reporte de Satisfacción"].forEach(sheetName => {
  //     workbook.Sheets[sheetName]["!cols"] = columnWidth;
  //   });

  //   // Generar el archivo Excel
  //   const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  //   const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  //   saveAs(dataBlob, `reporte_consolidado_${filters.startDate.toISOString().split('T')[0]}_${filters.endDate.toISOString().split('T')[0]}.xlsx`);
  // }, [filters, financialStats, serviceData, satisfactionData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Análisis detallado de servicios, finanzas y satisfacción</p>
        </div>
      </div>

      <ReportFilters filters={filters} onChange={setFilters} />
      <FinancialReport stats={financialStats} loading={loading} onRefresh={loadFinancialData} onGenerateExcel={generateSalesExcelReport} />
      {/* <ServiceReport /> */}
      {/* <SatisfactionReport /> */}
    </div>
  );
}
