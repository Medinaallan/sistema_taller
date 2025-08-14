import { useState } from 'react';
import { Card, Button, Select, Input } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import type { ReportFilters, FinancialStats } from '../../tipos/reportes';
import { formatCurrency } from '../../utilidades/mockData';

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
      </div>
    </Card>
  );
}

// Componente para el reporte financiero
function FinancialReport({ stats }: { stats: FinancialStats }) {
  return (
    <Card>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Reporte Financiero</h2>
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
          <Button variant="outline">
            Exportar a Excel
          </Button>
          <Button variant="outline">
            Exportar a PDF
          </Button>
          <Button>
            Generar Reporte Completo
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Componente para el reporte de servicios
function ServiceReport() {
  return (
    <Card>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Reporte de Servicios</h2>
        <div className="bg-gray-50 p-6 rounded-lg border text-center">
          <p className="text-gray-600">
            aun falta xd xd xd xd
          </p>
        </div>
      </div>
    </Card>
  );
}

// Componente para el reporte de satisfacción
function SatisfactionReport() {
  return (
    <Card>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Reporte de Satisfacción</h2>
        <div className="bg-gray-50 p-6 rounded-lg border text-center">
          <p className="text-gray-600">
            tambien falta jsjs xD
          </p>
        </div>
      </div>
    </Card>
  );
}

// Componente principal de la página de reportes
export function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  });

  const [financialStats] = useState<FinancialStats>({
    totalSales: 0.00,
    taxableAmount: 0.00,
    isv: 0.00,
    totalWithTax: 0.00,
    cashPayments: 0.00,
    cardPayments: 0.00,
    transferPayments: 0.00,
    pendingPayments: 0.00,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600">Análisis detallado de servicios, finanzas y satisfacción</p>
      </div>

      <ReportFilters filters={filters} onChange={setFilters} />
      <FinancialReport stats={financialStats} />
      <ServiceReport />
      <SatisfactionReport />
    </div>
  );
}
