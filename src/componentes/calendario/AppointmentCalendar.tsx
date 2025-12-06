import { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Card } from '../comunes/UI';
import type { Appointment } from '../../tipos';

interface AppointmentWithNames extends Appointment {
  clientName?: string;
}

interface AppointmentCalendarProps {
  appointments: AppointmentWithNames[];
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  appointments: AppointmentWithNames[];
}

const statusConfig = {
  pending: { color: 'bg-yellow-100 border-yellow-400', textColor: 'text-yellow-700', label: 'Pendiente' },
  confirmed: { color: 'bg-blue-100 border-blue-400', textColor: 'text-blue-700', label: 'Confirmada' },
  completed: { color: 'bg-green-100 border-green-400', textColor: 'text-green-700', label: 'Completada' },
  cancelled: { color: 'bg-red-100 border-red-400', textColor: 'text-red-700', label: 'Cancelada' },
};

export function AppointmentCalendar({ appointments }: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);

    // Días del mes anterior para completar la primera semana
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Crear array de días
    const calendarDays: CalendarDay[] = [];
    let currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = currentDay.toISOString().split('T')[0];
      const dayAppointments = appointments.filter((apt) => {
        const aptDateStr = apt.date.toISOString().split('T')[0];
        return aptDateStr === dateStr;
      });

      calendarDays.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        appointments: dayAppointments,
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }

    return calendarDays;
  }, [currentDate, appointments]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthYear = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <Card title="Calendario de Citas">
      <div className="space-y-2">
        {/* Header del calendario */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={previousMonth}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-semibold text-gray-900 capitalize">{monthYear}</h3>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Días del calendario */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-16 p-1 border rounded text-xs overflow-y-auto ${
                day.isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className={`text-xs font-semibold mb-0.5 sticky top-0 bg-white ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                {day.date.getDate()}
              </div>

              {/* Citas del día */}
              <div className="space-y-0.5">
                {day.appointments.length > 0 ? (
                  day.appointments.map((apt, idx) => {
                    const config = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.pending;
                    return (
                      <div
                        key={idx}
                        className={`text-xs px-1 py-0.5 rounded border line-clamp-1 ${config.color} ${config.textColor}`}
                        title={`${apt.time} - ${apt.clientName || 'Cliente'}`}
                      >
                        {apt.time}
                      </div>
                    );
                  })
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Leyenda de estados */}
        <div className="border-t pt-2 mt-2">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Estado:</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={key} className="flex items-center space-x-1">
                <div className={`h-2 w-2 rounded border ${config.color.replace('bg-', 'bg-').replace(' border', ' border')}`}></div>
                <span className="text-xs text-gray-600">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default AppointmentCalendar;
