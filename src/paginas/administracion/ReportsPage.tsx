import { useState, MouseEvent, useCallback } from 'react';
import { Card, Button, Select, Input } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import type { ReportFilters, FinancialStats } from '../../tipos/index';
import { formatCurrency } from '../../utilidades/globalMockDatabase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
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
import { Pie, Bar, Line } from 'react-chartjs-2';

interface MechanicDetails {
  photo: string;
  specialties: string[];
  totalServices: number;
  responseTime: string;
  completionRate: string;
  ratings: {
    technical: number;
    communication: number;
    punctuality: number;
    cleanliness: number;
  };
}

interface MechanicsDirectory {
  [key: string]: MechanicDetails;
}

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
  const [selectedView, setSelectedView] = useState('general'); // 'general' | 'trend' | 'details'
  const [selectedPeriod, setSelectedPeriod] = useState('6m'); // '1m' | '3m' | '6m' | '1año'

  const serviceData = {
    labels: ['Cambio de Aceite', 'Alineación', 'Frenos', 'Motor', 'Suspensión', 'Otros'],
    datasets: [
      {
        data: [5, 4, 0, 6, 0, 0],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }
    ]
  };

  const serviceRevenueData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Ingresos por Servicios',
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        tension: 0.4
      },
      {
        label: 'Meta de Ingresos',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: '#FF6384',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4
      }
    ]
  };



  // Estado para el filtro de periodo seleccionado

  const periodOptions = [
    { value: '1m', label: 'Último Mes' },
    { value: '3m', label: 'Últimos 3 Meses' },
    { value: '6m', label: 'Últimos 6 Meses' },
    { value: '1y', label: 'Último Año' }
  ];

  return (
    <Card>
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-lg font-semibold">Reporte de Servicios</h2>
          <div className="flex items-center space-x-4">
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              options={periodOptions}
              className="w-48"
            />
            <div className="flex space-x-2">
              {['general', 'trend', 'details'].map((view) => (
                <Button
                  key={view}
                  variant={selectedView === view ? 'primary' : 'outline'}
                  onClick={() => setSelectedView(view)}
                  className="capitalize"
                >
                  {view === 'general' ? 'General' : view === 'trend' ? 'Tendencias' : 'Detalles'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Servicios este periodo</p>
            <p className="text-2xl font-bold mt-1">0</p>
            <p className="text-xs text-green-600 mt-2">+ 0% vs periodo anterior</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(0)}</p>
            <p className="text-xs text-green-600 mt-2"> + 0% vs periodo anterior</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
            <p className="text-2xl font-bold mt-1">0h</p>
            <p className="text-xs text-green-600 mt-2">0% mas lento o eficiente </p>
          </div>
        </div>

        {selectedView === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-md font-semibold mb-4">Distribución de Servicios</h3>
              <div className="h-72">
                <Pie 
                  data={serviceData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }} 
                />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-md font-semibold mb-4">Análisis Temporal</h3>
              <div className="h-72">
                <Line
                  data={{
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [
                      {
                        label: 'Servicios Completados',
                        data: [0, 0, 0, 0, 0, 0],
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        fill: true,
                        tension: 0.4
                      }
                    ]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {selectedView === 'trend' && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-md font-semibold mb-4">Tendencia de Ingresos y Metas</h3>
            <div className="h-96">
              <Line
                data={serviceRevenueData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        )}

        {selectedView === 'details' && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold mb-4">Estadísticas Detalladas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-sm font-medium text-gray-600">Servicios Completados</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-gray-600 mt-2">• Este mes</p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                <p className="text-2xl font-bold">0h</p>
                <p className="text-xs text-gray-600 mt-2">• Por servicio</p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-sm font-medium text-gray-600">Eficiencia</p>
                <p className="text-2xl font-bold">0%</p>
                <p className="text-xs text-gray-600 mt-2">• Servicios a tiempo</p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-sm font-medium text-gray-600">Servicios en Proceso</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-gray-600 mt-2">• En taller</p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-sm font-medium text-gray-600">Ingreso por Servicio</p>
                <p className="text-2xl font-bold">{formatCurrency(0)}</p>
                <p className="text-xs text-gray-600 mt-2">• Promedio</p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-sm font-medium text-gray-600">Clientes Frecuentes</p>
                <p className="text-2xl font-bold">0%</p>
                <p className="text-xs text-gray-600 mt-2">• Retornan</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Componente para el reporte de satisfacción
function SatisfactionReport() {
  const [selectedTab, setSelectedTab] = useState('general'); // 'general' | 'mechanics' | 'trends'
  const [selectedMechanic, setSelectedMechanic] = useState<string | null>(null);
  
  const satisfactionData = {
    labels: ['5 estrellas', '4 estrellas', '3 estrellas', '2 estrellas', '1 estrella'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          '#4CAF50',
          '#8BC34A',
          '#FFC107',
          '#FF9800',
          '#F44336'
        ]
      }
    ]
  };

  const mechanicSatisfactionData = {
    labels: [],
    datasets: [
      {
        label: 'Calificación General',
        data: [],
        backgroundColor: '#36A2EB'
      },
      {
        label: 'Atención al Cliente',
        data: [],
        backgroundColor: '#FF6384'
      },
      {
        label: 'Calidad Técnica',
        data: [],
        backgroundColor: '#4CAF50'
      }
    ]
  };

  const satisfactionTrendData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Satisfacción General',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const mechanicDetails: MechanicsDirectory = {
    'Ejemplo': {
      photo: '-',
      specialties: [],
      totalServices: 0,
      responseTime: '0 min',
      completionRate: '0%',
      ratings: {
        technical: 0,
        communication: 0,
        punctuality: 0,
        cleanliness: 0
      }
    }
  };

  return (
    <Card>
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-lg font-semibold">Reporte de Satisfacción</h2>
          <div className="flex space-x-2">
            {['general', 'mechanics', 'trends'].map((tab) => (
              <Button
                key={tab}
                variant={selectedTab === tab ? 'primary' : 'outline'}
                onClick={() => setSelectedTab(tab)}
                className="capitalize"
              >
                {tab === 'general' ? 'General' : tab === 'mechanics' ? 'Mecánicos' : 'Tendencias'}
              </Button>
            ))}
          </div>
        </div>

        {/* KPIs Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm font-medium text-gray-600">Calificación del Servicio</p>
              <div className="flex items-center mt-1">
                <p className="text-2xl font-bold">0.0</p>
                <span className="text-sm text-gray-500 ml-1">/ 5 estrellas</span>
              </div>
              <p className="text-xs text-gray-600 mt-2 flex items-center">
                <span className="mr-1">•</span> Sin datos anteriores
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm font-medium text-gray-600">Opiniones de Clientes</p>
              <p className="text-2xl font-bold mt-1">0</p>
              <p className="text-xs text-gray-600 mt-2">• Este mes</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm font-medium text-gray-600">Atención al Cliente</p>
              <p className="text-2xl font-bold mt-1">0%</p>
              <p className="text-xs text-gray-600 mt-2">• Tiempo de respuesta</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-gray-600">Satisfacción General</p>
                <button className="text-xs text-gray-400 hover:text-gray-600" title="Porcentaje de clientes que recomendarían nuestro taller a sus amigos y familiares">
                  (?)
                </button>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold">0%</p>
                <span className="text-xs text-gray-500">de clientes satisfechos</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>        {selectedTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-md font-semibold mb-4">Distribución de Calificaciones</h3>
              <div className="h-72">
                <Pie 
                  data={satisfactionData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }} 
                />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-md font-semibold mb-4">Tendencia de Satisfacción</h3>
              <div className="h-72">
                <Line
                  data={satisfactionTrendData}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: 4,
                        max: 5,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'mechanics' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-md font-semibold mb-4">Desempeño por Mecánico</h3>
              <div className="h-96">
                <Bar
                  data={mechanicSatisfactionData}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 5,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                  onClick={(event: MouseEvent<HTMLCanvasElement>) => {
                    const chart = event.currentTarget;
                    const elements = (chart as any)._chart.getElementsAtEventForMode(
                      event.nativeEvent,
                      'nearest',
                      { intersect: true },
                      false
                    );
                    if (elements && elements.length > 0) {
                      const mechanic = mechanicSatisfactionData.labels[elements[0].index];
                      setSelectedMechanic(mechanic as string);
                    }
                  }}
                />
              </div>
            </div>

            {selectedMechanic && mechanicDetails[selectedMechanic] && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xl font-bold text-blue-600">{mechanicDetails[selectedMechanic].photo}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{selectedMechanic}</h3>
                      <p className="text-gray-600">{mechanicDetails[selectedMechanic].specialties.join(' • ')}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedMechanic(null)}>
                    Cerrar
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Servicios Completados</p>
                    <p className="text-2xl font-bold">{mechanicDetails[selectedMechanic].totalServices}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Tiempo de Respuesta</p>
                    <p className="text-2xl font-bold">{mechanicDetails[selectedMechanic].responseTime}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Tasa de Finalización</p>
                    <p className="text-2xl font-bold">{mechanicDetails[selectedMechanic].completionRate}</p>
                  </div>
                </div>

                <h4 className="font-semibold mb-4">Calificaciones Detalladas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(mechanicDetails[selectedMechanic].ratings).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 capitalize">{key}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xl font-bold">{String(value)}</p>
                        <div className="text-yellow-500 text-sm">/ 5.0</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Componente principal de la página de reportes
function prepareFinancialData(stats: FinancialStats) {
  return [
    ['REPORTE FINANCIERO'],
    [''],
    ['RESUMEN GENERAL'],
    ['Métrica', 'Valor'],
    ['Ventas Totales', stats.totalSales],
    ['Importe Gravado', stats.taxableAmount],
    ['ISV (15%)', stats.isv],
    ['Total con Impuestos', stats.totalWithTax],
    [''],
    ['DISTRIBUCIÓN DE PAGOS'],
    ['Método', 'Monto', 'Porcentaje'],
    ['Efectivo', stats.cashPayments, (stats.cashPayments / stats.totalSales * 100).toFixed(2) + '%'],
    ['Tarjeta', stats.cardPayments, (stats.cardPayments / stats.totalSales * 100).toFixed(2) + '%'],
    ['Transferencia', stats.transferPayments, (stats.transferPayments / stats.totalSales * 100).toFixed(2) + '%'],
    ['Pendiente', stats.pendingPayments, (stats.pendingPayments / stats.totalSales * 100).toFixed(2) + '%'],
    ['Total', stats.totalSales, '100%']
  ];
}

function prepareServicesData(serviceData: any) {
  const totalServices = serviceData.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
  
  return [
    ['REPORTE DE SERVICIOS'],
    [''],
    ['DISTRIBUCIÓN DE SERVICIOS'],
    ['Tipo de Servicio', 'Cantidad', 'Porcentaje'],
    ...serviceData.labels.map((label: string, index: number) => [
      label, 
      serviceData.datasets[0].data[index],
      ((serviceData.datasets[0].data[index] / totalServices) * 100).toFixed(2) + '%'
    ]),
    ['Total', totalServices, '100%'],
    [''],
    ['MÉTRICAS ACTUALES'],
    ['Indicador', 'Valor', 'Tendencia'],
    ['Servicios este periodo', '0', '+ 0% vs periodo anterior'],
    ['Ingresos Totales', formatCurrency(0), '+ 0% vs periodo anterior'],
    ['Tiempo Promedio', '0h', '0% mas lento o eficiente']
  ];
}

function prepareSatisfactionData(satisfactionData: any) {
  const totalResponses = satisfactionData.datasets[0].data.reduce((a: number, b: number) => a + b, 0);

  return [
    ['REPORTE DE SATISFACCIÓN'],
    [''],
    ['DISTRIBUCIÓN DE CALIFICACIONES'],
    ['Calificación', 'Cantidad', 'Porcentaje'],
    ...satisfactionData.labels.map((label: string, index: number) => [
      label,
      satisfactionData.datasets[0].data[index],
      ((satisfactionData.datasets[0].data[index] / totalResponses) * 100).toFixed(2) + '%'
    ]),
    ['Total', totalResponses, '100%'],
    [''],
    ['MÉTRICAS ACTUALES'],
    ['Indicador', 'Valor', 'Estado'],
    ['Calificación del Servicio', '0.0 / 5 estrellas', 'Sin datos anteriores'],
    ['Opiniones de Clientes', '0', 'Este mes'],
    ['Atención al Cliente', '0%', 'Tiempo de respuesta'],
    ['Satisfacción General', '0%', 'de clientes satisfechos']
  ];
}

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  });

  // Estado inicial para datos financieros
  const [financialStats] = useState<FinancialStats>({
    totalSales: 0,
    taxableAmount: 0,
    isv: 0,
    totalWithTax: 0,
    cashPayments: 0,
    cardPayments: 0,
    transferPayments: 0,
    pendingPayments: 0,
  });

  // Estado inicial para datos de servicios
  const [serviceData] = useState({
    labels: ['Cambio de Aceite', 'Alineación', 'Frenos', 'Motor', 'Suspensión', 'Otros'],
    datasets: [{
      label: 'Servicios',
      data: [0, 0, 0, 0, 0, 0],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(201, 203, 207, 0.8)',
      ],
      borderWidth: 1,
    }],
  });

  // Estado inicial para datos de satisfacción
  const [satisfactionData] = useState({
    labels: ['5 estrellas', '4 estrellas', '3 estrellas', '2 estrellas', '1 estrella'],
    datasets: [{
      label: 'Satisfacción',
      data: [0, 0, 0, 0, 0],
      backgroundColor: [
        '#4CAF50',  // Verde
        '#8BC34A',  // Verde claro
        '#FFC107',  // Amarillo
        '#FF9800',  // Naranja
        '#F44336',  // Rojo
      ],
      borderWidth: 1,
    }],
  });

  const exportToExcel = useCallback(() => {
    const workbook = XLSX.utils.book_new();
    
    // Reporte Financiero
    const financialData = prepareFinancialData(financialStats);
    const financialWS = XLSX.utils.aoa_to_sheet(financialData);
    XLSX.utils.book_append_sheet(workbook, financialWS, "Reporte Financiero");

    // Reporte de Servicios
    const servicesData = prepareServicesData(serviceData);
    const servicesWS = XLSX.utils.aoa_to_sheet(servicesData);
    XLSX.utils.book_append_sheet(workbook, servicesWS, "Reporte de Servicios");

    // Reporte de Satisfacción
    const satisfactionPreparedData = prepareSatisfactionData(satisfactionData);
    const satisfactionWS = XLSX.utils.aoa_to_sheet(satisfactionPreparedData);
    XLSX.utils.book_append_sheet(workbook, satisfactionWS, "Reporte de Satisfacción");

    // Dar formato a las columnas (ajustado para 3 columnas)
    const columnWidth = [{ wch: 35 }, { wch: 15 }, { wch: 15 }];
    
    // Aplicar formato a cada hoja
    ["Reporte Financiero", "Reporte de Servicios", "Reporte de Satisfacción"].forEach(sheetName => {
      workbook.Sheets[sheetName]["!cols"] = columnWidth;
    });

    // Generar el archivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(dataBlob, `reporte_consolidado_${filters.startDate.toISOString().split('T')[0]}_${filters.endDate.toISOString().split('T')[0]}.xlsx`);
  }, [filters, financialStats, serviceData, satisfactionData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Análisis detallado de servicios, finanzas y satisfacción</p>
        </div>
        <Button 
          onClick={exportToExcel}
          className="flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar a Excel
        </Button>
      </div>

      <ReportFilters filters={filters} onChange={setFilters} />
      <FinancialReport stats={financialStats} />
      <ServiceReport />
      <SatisfactionReport />
    </div>
  );
}
