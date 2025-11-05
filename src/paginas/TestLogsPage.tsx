// Página de prueba para generar logs de ejemplo para las categorías
import React, { useState } from 'react';
import { Card, Button } from '../componentes/comunes/UI';
import { useBusinessLogs } from '../hooks/useBusinessLogs';
import { logService } from '../servicios/logService';

const TestLogsPage: React.FC = () => {
  const businessLogs = useBusinessLogs();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createSystemLog = async (type: string) => {
    setLoading(true);
    try {
      const logData = {
        userId: 'test-user',
        userName: 'Usuario de Prueba',
        userRole: 'admin' as const,
        action: 'LOGIN' as const,
        entity: 'system',
        description: '',
        severity: 'MEDIUM' as const,
        ipAddress: '192.168.1.100',
        userAgent: navigator.userAgent
      };

      switch (type) {
        case 'login':
          await logService.createLog({
            ...logData,
            action: 'LOGIN',
            description: 'Usuario inició sesión en el sistema',
            severity: 'LOW'
          });
          break;
        case 'security':
          await logService.createLog({
            ...logData,
            action: 'CUSTOM',
            entity: 'security',
            description: 'Intento de acceso no autorizado bloqueado',
            severity: 'HIGH',
            details: { ip: '192.168.1.100', attempts: 3 }
          });
          break;
        case 'system-error':
          await logService.createLog({
            ...logData,
            action: 'CUSTOM',
            entity: 'system',
            description: 'Error crítico en el sistema de base de datos',
            severity: 'HIGH',
            details: { errorCode: 'DB_CONNECTION_FAILED', module: 'database' }
          });
          break;
      }
      setMessage(`✅ Log de sistema (${type}) creado exitosamente`);
    } catch (error) {
      setMessage(`❌ Error creando log: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const createBusinessLog = async (type: string) => {
    setLoading(true);
    try {
      const mockClient = {
        id: 'client-test-001',
        name: 'Juan Pérez',
        email: 'juan.perez@email.com',
        phone: '+1234567890',
        password: 'test123',
        address: 'Calle Test 123',
        vehicles: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockVehicle = {
        id: 'vehicle-test-001',
        clientId: 'client-test-001',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        licensePlate: 'ABC-123',
        color: 'Blanco',
        vin: 'VIN123456',
        mileage: 50000,
        serviceType: 'maintenance' as const,
        workOrders: [],
        reminders: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockAppointment = {
        id: 'appointment-test-001',
        clientId: 'client-test-001',
        vehicleId: 'vehicle-test-001',
        serviceTypeId: 'service-001',
        date: '2025-11-10',
        time: '10:00',
        status: 'scheduled' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockQuotation = {
        id: 'quotation-test-001',
        clientId: 'client-test-001',
        vehicleId: 'vehicle-test-001',
        items: [
          { id: '1', name: 'Cambio de aceite', price: 150, quantity: 1 },
          { id: '2', name: 'Revisión de frenos', price: 200, quantity: 1 }
        ],
        total: 350.00,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      switch (type) {
        case 'client':
          await businessLogs.logClientCreated(mockClient);
          break;
        case 'vehicle':
          await businessLogs.logVehicleCreated(mockVehicle, 'Juan Pérez');
          break;
        case 'appointment':
          await businessLogs.logAppointmentCreated(mockAppointment, 'Juan Pérez', 'Toyota Corolla (ABC-123)');
          break;
        case 'appointment-approved':
          await businessLogs.logAppointmentApproved(mockAppointment, 'Juan Pérez');
          break;
        case 'quotation':
          await businessLogs.logQuotationCreated(mockQuotation, 'Juan Pérez');
          break;
        case 'quotation-approved':
          await businessLogs.logQuotationApproved(mockQuotation, 'Juan Pérez');
          break;
      }
      setMessage(`✅ Log de negocio (${type}) creado exitosamente`);
    } catch (error) {
      setMessage(`❌ Error creando log: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generador de Logs de Prueba</h1>
        <p className="text-gray-600">Usa esta página para crear logs de ejemplo y probar el sistema de categorías</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Logs del Sistema */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              🔒 Logs del Sistema
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Logs relacionados con autenticación, seguridad y errores del sistema
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => createSystemLog('login')}
                disabled={loading}
                className="w-full"
              >
                Crear Log de Login
              </Button>
              <Button 
                onClick={() => createSystemLog('security')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Crear Log de Seguridad
              </Button>
              <Button 
                onClick={() => createSystemLog('system-error')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Crear Log de Error del Sistema
              </Button>
            </div>
          </div>
        </Card>

        {/* Logs de Negocio */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              💼 Logs de Negocio
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Logs relacionados con operaciones comerciales como clientes, vehículos y citas
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => createBusinessLog('client')}
                disabled={loading}
                className="w-full"
              >
                Crear Cliente
              </Button>
              <Button 
                onClick={() => createBusinessLog('vehicle')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Registrar Vehículo
              </Button>
              <Button 
                onClick={() => createBusinessLog('appointment')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Crear Cita
              </Button>
              <Button 
                onClick={() => createBusinessLog('appointment-approved')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Aprobar Cita
              </Button>
              <Button 
                onClick={() => createBusinessLog('quotation')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Crear Cotización
              </Button>
              <Button 
                onClick={() => createBusinessLog('quotation-approved')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Aprobar Cotización
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          Después de crear los logs, ve a la <strong>sección de Logs</strong> para ver cómo se categorizan automáticamente
        </p>
      </div>
    </div>
  );
};

export default TestLogsPage;