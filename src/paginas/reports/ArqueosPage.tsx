import React, { useEffect, useState } from 'react';
import { cashService } from '../../servicios/cashService';
import Swal from 'sweetalert2';

export default function ArqueosPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await cashService.getReport();
      if (resp && resp.success) setData(resp.data || []);
      else setData([]);
    } catch (err) {
      console.error('Error loading arqueos', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Arqueos de Caja</h1>
        <p className="text-gray-600">Listado de arqueos con ventas, ingresos y diferencias por sesión.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button onClick={load} className="px-3 py-1 bg-blue-600 text-white rounded">Actualizar</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Caja</th>
                  <th className="py-2 px-3">Responsable</th>
                  <th className="py-2 px-3">Hora Apertura</th>
                  <th className="py-2 px-3">Hora Cierre</th>
                  <th className="py-2 px-3">Monto Inicial</th>
                  <th className="py-2 px-3">Ventas</th>
                  <th className="py-2 px-3">Ingresos</th>
                  <th className="py-2 px-3">Efectivo</th>
                  <th className="py-2 px-3">Diferencia</th>
                  <th className="py-2 px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, idx) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 align-top">{idx + 1}</td>
                    <td className="py-2 px-3 align-top">{r.caja}</td>
                    <td className="py-2 px-3 align-top">{r.cashier}</td>
                    <td className="py-2 px-3 align-top">{r.openingTime ? new Date(r.openingTime).toLocaleString() : '-'}</td>
                    <td className="py-2 px-3 align-top">{r.closingTime ? new Date(r.closingTime).toLocaleString() : '********'}</td>
                    <td className="py-2 px-3 align-top">L.{(r.openingAmount || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 align-top">L.{(r.salesTotal || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 align-top">L.{(r.incomes || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 align-top">L.{(r.expectedCash || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 align-top">{r.difference != null ? `L.${r.difference.toFixed(2)}` : '-'}</td>
                    <td className="py-2 px-3 align-top">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => Swal.fire({ title: 'Detalle de Sesión', html: `<pre style="text-align:left">${JSON.stringify(r, null, 2)}</pre>`, width: 800 })} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Ver</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
