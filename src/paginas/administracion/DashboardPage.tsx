import React, { useEffect, useState } from 'react';
import {
  UsersIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  BellIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../componentes/comunes/UI';
import { useApp } from '../../contexto/useApp';
import useInterconnectedData from '../../contexto/useInterconnectedData';
import { formatCurrency, getStatusText, getStatusColor } from '../../utilidades/globalMockDatabase';
import { AppointmentCalendar } from '../../componentes/calendario/AppointmentCalendar';
import { appointmentsService } from '../../servicios/apiService';
import { useClientesFromAPI } from '../../hooks/useClientesFromAPI';
import type { Appointment } from '../../tipos';


interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { dispatch } = useApp();
  const data = useInterconnectedData();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { clientes: clientesAPI } = useClientesFromAPI();

  useEffect(() => {
    // Refrescar estadísticas del dashboard automáticamente
    dispatch({ type: 'REFRESH_DASHBOARD_STATS' });
  }, [dispatch, data.vehicles.length, data.clients.length, data.workOrders.length]);

  // Cargar citas para el calendario
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const response = await appointmentsService.getAll();
        if (response.success) {
          const mapEstado = (estado: string) => {
            switch (estado?.toLowerCase()) {
              case 'pendiente': return 'pending';
              case 'confirmada': return 'confirmed';
              case 'cancelada': return 'cancelled';
              case 'completada': return 'completed';
              default: return estado;
            }
          };
          const appointmentsData = response.data.map((spAppointment: any) => {
            const clientIdStr = String(spAppointment.cliente_id).trim();
            const cliente = clientesAPI.find((c: any) => String(c.id || c.usuario_id).trim() === clientIdStr);
            return {
              id: spAppointment.cita_id,
              date: new Date(spAppointment.fecha_inicio),
              time: spAppointment.fecha_inicio ? new Date(spAppointment.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
              clientId: clientIdStr,
              clientName: spAppointment.nombre_cliente || (cliente ? cliente.nombre_completo : `ID: ${clientIdStr}`),
              vehicleId: String(spAppointment.vehiculo_id).trim(),
              vehicleName: spAppointment.vehiculo_info || '',
              serviceTypeId: spAppointment.tipo_servicio_id,
              status: mapEstado(spAppointment.estado),
              notes: (spAppointment.notas_cliente || '').replace(/^"|"$/g, ''),
              createdAt: spAppointment.fecha_creacion ? new Date(spAppointment.fecha_creacion) : new Date(),
              updatedAt: new Date(),
            };
          });
          setAppointments(appointmentsData);
        }
      } catch (error) {
        console.error('Error cargando citas para el calendario:', error);
      }
    };
    loadAppointments();
  }, [clientesAPI]);

  const stats = data.dashboardStats;
  
  // Datos para las tablas
  const recentOrders = data.workOrders.slice(0, 5);

  // Filtrar órdenes por estado
  const pendingOrders = data.workOrders.filter(order => order.status === 'pending');

  // Filtrar órdenes en progreso
  const inProgressOrders = data.workOrders.filter(order => order.status === 'in-progress');  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen general del taller</p>
      </div>

      {/* Estadísticas principales */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Órdenes"
            value={stats.totalWorkOrders}
            icon={WrenchScrewdriverIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Clientes Registrados"
            value={stats.totalClients}
            icon={UsersIcon}
            color="bg-green-500"
          />
          <StatCard
            title="Vehículos"
            value={stats.totalVehicles}
            icon={TruckIcon}
            color="bg-yellow-500"
          />
          <StatCard
            title="Recordatorios Activos"
            value={stats.activeReminders}
            icon={BellIcon}
            color="bg-red-500"
          />
          <StatCard
            title="Ingresos del Mes"
            value={formatCurrency(stats.monthlyRevenue)}
            icon={CurrencyDollarIcon}
            color="bg-green-600"
            subtitle="Mes actual"
          />
          <StatCard
            title="Órdenes Completadas"
            value={stats.completedOrders}
            icon={ChartBarIcon}
            color="bg-blue-600"
          />
        </div>
      )}

      {/* Calendario de Citas */}
      {appointments.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="lg:col-span-1">
            <AppointmentCalendar appointments={appointments} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Órdenes Recientes */}
        <Card title="Órdenes Recientes" subtitle="Últimas órdenes de trabajo registradas">
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.problem}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(order.estimatedCost)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No hay órdenes recientes</p>
            )}
          </div>
        </Card>

        {/* Órdenes Pendientes */}
        <Card title="Órdenes Pendientes" subtitle="Órdenes que requieren atención">
          <div className="space-y-3">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.description}
                    </p>
                    <p className="text-sm text-yellow-600">
                      Esperando asignación de mecánico
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(order.estimatedCost)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No hay órdenes pendientes</p>
            )}
          </div>
        </Card>

        {/* Órdenes en Progreso */}
        <Card title="En Progreso" subtitle="Órdenes actualmente en trabajo">
          <div className="space-y-3">
            {inProgressOrders.length > 0 ? (
              inProgressOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.description}
                    </p>
                    <p className="text-sm text-blue-600">
                      {order.mechanicId ? 'Asignado a mecánico' : 'Sin mecánico asignado'}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(order.estimatedCost)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No hay órdenes en progreso</p>
            )}
          </div>
        </Card>

        {/* Acciones Rápidas */}
        <Card title="Acciones Rápidas">
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200">
              <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-700">Nueva Orden</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200">
              <UsersIcon className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-700">Nuevo Cliente</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors duration-200">
              <TruckIcon className="h-8 w-8 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-yellow-700">Nuevo Vehículo</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200">
              <BellIcon className="h-8 w-8 text-red-600 mb-2" />
              <span className="text-sm font-medium text-red-700">Recordatorio</span>
            </button>
          </div>
        </Card>
      </div>

    </div>
  );
}
