import { useEffect, useState } from 'react';
import { cashService } from '../../servicios/cashService';
import { useApp } from '../../contexto/useApp';
import Swal from 'sweetalert2';
import { printArqueoTicket } from '../../utilidades/ticketPrinter';

export default function ArqueosPage() {
  const { state } = useApp();
  const [loading, setLoading] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const loadCurrentSummary = async () => {
    if (!state.user?.id) return;
    try {
      const resp = await cashService.getCurrentSummary(Number(state.user.id));
      if (resp && resp.success) {
        setCurrentSummary(resp.data);
      } else {
        setCurrentSummary(null);
      }
    } catch (err) {
      console.error('Error loading current summary', err);
      setCurrentSummary(null);
    }
  };

  const formatCurrency = (v: any) => {
    const n = Number(v || 0);
    try {
      return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n);
    } catch (e) {
      return `L.${n.toFixed(2)}`;
    }
  };

  const formatDate = (d: any) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleString();
    } catch (e) {
      return String(d);
    }
  };

  const buildArqueoDetailHtml = (r: any) => {
    return `
      <div style="text-align:left; font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
        <h3 style="margin:0 0 8px 0; font-size:18px;">Detalle de Arqueo</h3>
        <table style="width:100%; border-collapse:separate; border-spacing:8px 6px;">
          <tbody>
            <tr><td style="width:40%; font-weight:600;">Arqueo ID</td><td>${r.arqueo_id ?? '-'}</td></tr>
            <tr><td style="font-weight:600;">Responsable</td><td>${r.nombre_completo ?? '-'}</td></tr>
            <tr><td style="font-weight:600;">Fecha Apertura</td><td>${formatDate(r.fecha_apertura)}</td></tr>
            <tr><td style="font-weight:600;">Fecha Cierre</td><td>${formatDate(r.fecha_cierre)}</td></tr>
            <tr><td style="font-weight:600;">Monto Inicial</td><td>${formatCurrency(r.monto_inicial)}</td></tr>
            <tr><td style="font-weight:600;">Ventas en Efectivo</td><td>${formatCurrency((r.monto_ventas_efectivo ?? r.ventas_efectivo ?? r.ventas) || 0)}</td></tr>
            <tr><td style="font-weight:600;">Otros Pagos</td><td>${formatCurrency(r.monto_otros_pagos ?? r.otros_pagos ?? 0)}</td></tr>
            <tr><td style="font-weight:600;">Efectivo Esperado</td><td>${formatCurrency(r.monto_final_esperado ?? r.efectivo_esperado ?? r.total_esperado_en_caja ?? 0)}</td></tr>
            <tr><td style="font-weight:600;">Monto Final Real</td><td>${r.monto_final_real != null ? formatCurrency(r.monto_final_real) : '-'}</td></tr>
            <tr><td style="font-weight:600;">Diferencia</td><td style="color:${(r.diferencia || 0) === 0 ? '#16a34a' : '#dc2626'}; font-weight:600;">${r.diferencia != null ? formatCurrency(r.diferencia) : '-'}</td></tr>
            <tr><td style="font-weight:600;">Estado</td><td>${r.estado ?? '-'}</td></tr>
            <tr><td style="vertical-align:top; font-weight:600;">Observaciones</td><td>${r.observaciones ? String(r.observaciones).replace(/\n/g, '<br/>') : '-'}</td></tr>
          </tbody>
        </table>
      </div>
    `;
  };

  const loadHistory = async () => {
    if (!state.user?.id) return;
    setLoading(true);
    try {
      const resp = await cashService.getHistory(Number(state.user.id), fechaInicio, fechaFin);
      if (resp && resp.success) {
        setHistoryData(resp.data || []);
      } else {
        setHistoryData([]);
      }
    } catch (err) {
      console.error('Error loading history', err);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentSummary();
    loadHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Arqueos de Caja</h1>
        <p className="text-gray-600">Resumen actual y historial de arqueos</p>
      </div>

      {/* RESUMEN ACTUAL */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Resumen de Caja Actual</h2>
        {currentSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">Estado</p>
              <p className="text-xl font-bold text-blue-700">{currentSummary.estado}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Monto Inicial</p>
              <p className="text-xl font-bold text-green-700">L.{(currentSummary.monto_inicial || 0).toFixed(2)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <p className="text-sm text-gray-600">Fecha Apertura</p>
              <p className="text-xl font-bold text-purple-700">
                {currentSummary.fecha_apertura ? new Date(currentSummary.fecha_apertura).toLocaleString() : '-'}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded">
              <p className="text-sm text-gray-600">Ventas en Efectivo</p>
              <p className="text-xl font-bold text-yellow-700">L.{(currentSummary.ventas_efectivo || 0).toFixed(2)}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded">
              <p className="text-sm text-gray-600">Ventas Otros</p>
              <p className="text-xl font-bold text-indigo-700">L.{(currentSummary.ventas_otros || 0).toFixed(2)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Esperado en Caja</p>
              <p className="text-xl font-bold text-red-700">L.{(currentSummary.total_esperado_en_caja || 0).toFixed(2)}</p>
            </div>
            {currentSummary.monto_final_real != null && (
              <>
                <div className="bg-teal-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Monto Final Real</p>
                  <p className="text-xl font-bold text-teal-700">L.{(currentSummary.monto_final_real || 0).toFixed(2)}</p>
                </div>
                <div className="bg-pink-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Diferencia</p>
                  <p className="text-xl font-bold text-pink-700">L.{(currentSummary.diferencia || 0).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Fecha Cierre</p>
                  <p className="text-xl font-bold text-gray-700">
                    {currentSummary.fecha_cierre ? new Date(currentSummary.fecha_cierre).toLocaleString() : '-'}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No hay caja abierta actualmente</p>
        )}
        <div className="mt-4">
          <button
            onClick={() => {
              loadCurrentSummary();
              loadHistory();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* HISTORIAL */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Historial de Arqueos</h2>
        
        {/* Filtros de fecha */}
        <div className="flex items-center space-x-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="pt-6">
            <button
              onClick={loadHistory}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Filtrar
            </button>
          </div>
          {(fechaInicio || fechaFin) && (
            <div className="pt-6">
              <button
                onClick={() => {
                  setFechaInicio('');
                  setFechaFin('');
                  loadHistory();
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Arqueo ID</th>
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3">Fecha Apertura</th>
                  <th className="py-2 px-3">Fecha Cierre</th>
                  <th className="py-2 px-3">Monto Inicial</th>
                  <th className="py-2 px-3">Monto Final Real</th>
                  <th className="py-2 px-3">Efectivo Esperado</th>
                  <th className="py-2 px-3">Diferencia</th>
                  <th className="py-2 px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historyData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4 text-gray-500">
                      No hay historial de arqueos
                    </td>
                  </tr>
                ) : (
                  historyData.map((r, idx) => (
                    <tr key={r.arqueo_id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 align-top">{idx + 1}</td>
                      <td className="py-2 px-3 align-top">{r.arqueo_id}</td>
                      <td className="py-2 px-3 align-top">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          r.estado === 'Abierta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="py-2 px-3 align-top">
                        {r.fecha_apertura ? new Date(r.fecha_apertura).toLocaleString() : '-'}
                      </td>
                      <td className="py-2 px-3 align-top">
                        {r.fecha_cierre ? new Date(r.fecha_cierre).toLocaleString() : '-'}
                      </td>
                      <td className="py-2 px-3 align-top">L.{(r.monto_inicial || 0).toFixed(2)}</td>
                      <td className="py-2 px-3 align-top">
                        {r.monto_final_real != null ? `L.${r.monto_final_real.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2 px-3 align-top">
                        {r.efectivo_esperado != null ? `L.${r.efectivo_esperado.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2 px-3 align-top">
                        {r.diferencia != null ? (
                          <span className={r.diferencia === 0 ? 'text-green-600' : 'text-red-600'}>
                            L.{r.diferencia.toFixed(2)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-2 px-3 align-top">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => Swal.fire({
                              title: 'Detalle de Arqueo',
                              html: buildArqueoDetailHtml(r),
                              width: 700,
                              confirmButtonText: 'OK'
                            })}
                            className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => printArqueoTicket(r)}
                            className="px-2 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                          >
                            Ticket
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
