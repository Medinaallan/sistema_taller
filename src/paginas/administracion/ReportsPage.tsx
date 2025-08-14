import { useState } from 'react';
import { Card, Button, Select, Input } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import type { ReportFilters, FinancialStats, ServiceStats, SatisfactionStats } from '../../tipos/reportes';
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
        <div className="mt-6 flex justify-end">
          <Button variant="outline">
            REPORTE COMETO DETALLADO
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Componente para el reporte de servicios
function ServiceReport({ stats }: { stats: ServiceStats }) {
  return (
    <Card>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Reporte de Servicios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Total Órdenes</p>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-600">Completadas</p>
            <p className="text-2xl font-bold text-green-700">{stats.completedOrders}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600">En Proceso</p>
            <p className="text-2xl font-bold text-blue-700">{stats.inProgressOrders}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pendingOrders}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-600">Rechazadas</p>
            <p className="text-2xl font-bold text-red-700">{stats.rejectedOrders}</p>
          </div>
        </div>

      </div>
    </Card>
  );
}

// Componente para el reporte de satisfacción
function SatisfactionReport({ stats }: { stats: SatisfactionStats }) {
  return (
    <Card>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Reporte de Satisfacción</h2>
        
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-3">Calificaciones por Mecánico</h3>
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

  const [serviceStats] = useState<ServiceStats>({
    totalOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    pendingOrders: 0,
    rejectedOrders: 0,
  });

  const [satisfactionStats] = useState<SatisfactionStats>({
    averageRating: 0.0,
    totalRatings: 0,
    ratingDistribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    mechanicRatings: [
      {
        mechanicId: '1',
        mechanicName: 'Sin datos',
        averageRating: 0.0,
        totalRatings: 0,
      }
    ],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600">Análisis detallado de servicios, finanzas y satisfacción</p>
      </div>

      <ReportFilters filters={filters} onChange={setFilters} />
      <FinancialReport stats={financialStats} />
      <ServiceReport stats={serviceStats} />
      <SatisfactionReport stats={satisfactionStats} />

      <div className="flex justify-end space-x-4">
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
  );
}
