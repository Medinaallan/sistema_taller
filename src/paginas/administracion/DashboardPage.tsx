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
import { formatCurrency } from '../../utilidades/globalMockDatabase';
import { AppointmentCalendar } from '../../componentes/calendario/AppointmentCalendar';
import { appointmentsService } from '../../servicios/apiService';
import workOrdersService from '../../servicios/workOrdersService';
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
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [totalWorkOrders, setTotalWorkOrders] = useState(0);
  const [completedWorkOrders, setCompletedWorkOrders] = useState(0);
  const { clientes: clientesAPI } = useClientesFromAPI();

  useEffect(() => {
    // Refrescar estadísticas del dashboard automáticamente
    dispatch({ type: 'REFRESH_DASHBOARD_STATS' });
  }, [dispatch, data.vehicles.length, data.clients.length, data.workOrders.length]);

  // Cargar órdenes de trabajo desde la API
  useEffect(() => {
    const loadWorkOrders = async () => {
      try {
        const response = await workOrdersService.getAllWorkOrders();
        if (response && Array.isArray(response)) {
          setWorkOrders(response);
          setTotalWorkOrders(response.length);

          // Contar órdenes completadas
          const completad = response.filter(order => order.estado === 'Completada').length;
          setCompletedWorkOrders(completad);
        }
      } catch (error) {
        console.error('Error cargando órdenes de trabajo:', error);
      }
    };
    loadWorkOrders();
  }, []);

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
  const recentOrders = workOrders.slice(0, 5);

  // Filtrar órdenes por estado
  const pendingOrders = workOrders.filter(order => order.estado === 'pendiente' || order.status === 'pending');

  // Filtrar órdenes en progreso
  const inProgressOrders = workOrders.filter(order => order.estado === 'en-progreso' || order.status === 'in-progress');  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen general del taller</p>
      </div>

      {/* Estadísticas principales */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Órdenes"
            value={totalWorkOrders}
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
            title="Ingresos del Mes"
            value={formatCurrency(stats.monthlyRevenue)}
            icon={CurrencyDollarIcon}
            color="bg-green-600"
            subtitle="Mes actual"
          />
          <StatCard
            title="Órdenes Completadas"
            value={completedWorkOrders}
            icon={ChartBarIcon}
            color="bg-blue-600"
          />
          <StatCard
            title="Recordatorios Activos"
            value={stats.activeReminders}
            icon={BellIcon}
            color="bg-red-500"
          />
        </div>
      )}

      {/* Calendario de Citas - Ancho completo */}
      {appointments.length > 0 && (
        <div className="w-full">
          <AppointmentCalendar appointments={appointments} />
        </div>
      )}

      {/* Sección de Órdenes - Grid 2 columnas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Órdenes Recientes */}
        <Card title="Órdenes Recientes" subtitle="Últimas órdenes de trabajo registradas">
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.ot_id || order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      OT #{order.numero_ot || order.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.fecha_creacion ? new Date(order.fecha_creacion).toLocaleDateString('es-ES') : 'Fecha no disponible'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.estado === 'completada' ? 'bg-green-100 text-green-800' :
                      order.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      order.estado === 'en-progreso' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.estado || 'N/A'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No hay órdenes registradas</p>
            )}
          </div>
        </Card>

        {/* Órdenes Pendientes */}
        <Card title="Órdenes Pendientes" subtitle="Órdenes que requieren atención">
          <div className="space-y-3">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <div key={order.ot_id || order.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      OT #{order.numero_ot || order.id}
                    </p>
                    <p className="text-xs text-yellow-600">
                      Esperando atención
                    </p>
                  </div>
                  <div className="text-xs text-gray-600 whitespace-nowrap ml-2">
                    {order.fecha_creacion ? new Date(order.fecha_creacion).toLocaleDateString('es-ES') : ''}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">✓ No hay órdenes pendientes</p>
            )}
          </div>
        </Card>

        {/* Órdenes en Progreso */}
        <Card title="En Progreso" subtitle="Órdenes actualmente en trabajo">
          <div className="space-y-3">
            {inProgressOrders.length > 0 ? (
              inProgressOrders.map((order) => (
                <div key={order.ot_id || order.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      OT #{order.numero_ot || order.id}
                    </p>
                    <p className="text-xs text-blue-600">
                      {order.mecanico_encargado_id ? 'Asignado' : 'Sin asignar'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-600 whitespace-nowrap ml-2">
                    {order.fecha_creacion ? new Date(order.fecha_creacion).toLocaleDateString('es-ES') : ''}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No hay órdenes en progreso</p>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
