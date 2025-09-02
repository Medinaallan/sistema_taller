import { Client, Vehicle, WorkOrder } from '../tipos/index';

// Estructura del CSV: Nombre;Teléfono;Email;Dirección;Contraseña;NumVehiculos;NombreVehiculo;Modelo;OrdenesCompletadas;OrdenesEnProceso;Kilometraje
export interface CSVClientData {
  name: string;
  phone: string;
  email: string;
  address: string;
  password: string;
  vehicleCount: number;
  vehicleName: string;
  vehicleModel: string;
  completedOrders: number;
  inProgressOrders: number;
  vehicleId: number;
  mileage: number;
}

// Parser del CSV
export function parseCSVLine(line: string): CSVClientData {
  const fields = line.split(';');
  return {
    name: fields[0]?.trim() || '',
    phone: fields[1]?.trim() || '',
    email: fields[2]?.trim() || '',
    address: fields[3]?.trim() || '',
    password: fields[4]?.trim() || '',
    vehicleCount: parseInt(fields[5]) || 0,
    vehicleName: fields[6]?.trim() || '',
    vehicleModel: fields[7]?.trim() || '',
    completedOrders: parseInt(fields[8]) || 0,
    inProgressOrders: parseInt(fields[9]) || 0,
    vehicleId: parseInt(fields[10]) || 0,
    mileage: parseInt(fields[11]) || 0
  };
}

// Función para leer el archivo CSV dinámicamente
export async function loadCSVData(): Promise<CSVClientData[]> {
  try {
    const response = await fetch('/Client_Database.csv');
    if (!response.ok) {
      throw new Error('No se pudo cargar el archivo CSV');
    }
    const csvText = await response.text();
    
    return csvText.split('\n')
      .filter(line => line.trim())
      .map(parseCSVLine);
  } catch (error) {
    console.error('Error cargando CSV:', error);
    // Fallback con datos de ejemplo si no se puede cargar el archivo
    return getFallbackData();
  }
}

// Datos de fallback si no se puede leer el CSV
function getFallbackData(): CSVClientData[] {
  const csvData = `Andre Vargas;9999-9999;avargas@taller.com;Col. Los arbolitos;asdf1234;1;Honda;Civic;2;2;1;20000
Katy Ramos;9999-1003;kramos@taller.com;Barrio A;asdf1234;4;Honda;Crv;2;1;5;120000`;

  return csvData.split('\n')
    .filter(line => line.trim())
    .map(parseCSVLine);
}

// Parsear todos los datos del CSV (función síncrona para compatibilidad)
export function parseCSVData(): CSVClientData[] {
  return getFallbackData(); // Por ahora usar fallback, se puede cambiar por carga async
}

// Convertir datos CSV a formato de Cliente
export function csvToClients(csvData: CSVClientData[]): Client[] {
  const clientMap = new Map<string, Client>();

  csvData.forEach(data => {
    if (!clientMap.has(data.email)) {
      clientMap.set(data.email, {
        id: `client-${data.email.split('@')[0]}`,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        password: data.password,
        vehicles: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      });
    }

    const client = clientMap.get(data.email)!;
    
    // Agregar vehículo si no existe
    const vehicleExists = client.vehicles.find(v => 
      v.brand === data.vehicleName && v.model === data.vehicleModel
    );

    if (!vehicleExists) {
      const vehicle: Vehicle = {
        id: `vehicle-${data.vehicleId}`,
        clientId: client.id,
        brand: data.vehicleName,
        model: data.vehicleModel,
        year: 2020, // Valor por defecto
        licensePlate: `ABC-${data.vehicleId.toString().padStart(3, '0')}`,
        color: 'Blanco', // Valor por defecto
        mileage: data.mileage,
        serviceType: {
          id: 'maintenance',
          name: 'Mantenimiento',
          description: 'Servicio general',
          estimatedDuration: 2,
          basePrice: 500
        },
        workOrders: [],
        reminders: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      };

      client.vehicles.push(vehicle);
    }
  });

  return Array.from(clientMap.values());
}

// Generar órdenes de trabajo basadas en los datos CSV
export function csvToWorkOrders(csvData: CSVClientData[]): WorkOrder[] {
  const workOrders: WorkOrder[] = [];
  let orderCounter = 1;

  csvData.forEach(data => {
    const clientId = `client-${data.email.split('@')[0]}`;
    const vehicleId = `vehicle-${data.vehicleId}`;

    // Crear órdenes completadas
    for (let i = 0; i < data.completedOrders; i++) {
      workOrders.push({
        id: `wo-${orderCounter++}`,
        vehicleId,
        clientId,
        mechanicId: 'mech-001',
        receptionistId: 'recep-001',
        status: 'completed',
        description: `Orden completada #${i + 1} para ${data.vehicleName} ${data.vehicleModel}`,
        problem: 'Mantenimiento preventivo',
        diagnosis: 'Servicio completado satisfactoriamente',
        serviceType: 'preventive',
        estimatedCompletionDate: new Date('2024-08-01'),
        actualCompletionDate: new Date('2024-08-01'),
        startDate: new Date('2024-07-30'),
        technicianNotes: 'Trabajo realizado según especificaciones',
        laborCost: 500,
        partsCost: 300,
        totalCost: 800,
        estimatedCost: 800,
        parts: [],
        services: [],
        notes: `Servicio para vehículo ${data.vehicleName} ${data.vehicleModel}`,
        recommendations: 'Próximo servicio en 5000 km',
        paymentStatus: 'completed',
        createdAt: new Date('2024-07-30'),
        updatedAt: new Date('2024-08-01')
      });
    }

    // Crear órdenes en proceso
    for (let i = 0; i < data.inProgressOrders; i++) {
      workOrders.push({
        id: `wo-${orderCounter++}`,
        vehicleId,
        clientId,
        mechanicId: 'mech-001',
        receptionistId: 'recep-001',
        status: 'in-progress',
        description: `Orden en proceso #${i + 1} para ${data.vehicleName} ${data.vehicleModel}`,
        problem: 'Revisión general',
        diagnosis: 'En proceso de evaluación',
        serviceType: 'corrective',
        estimatedCompletionDate: new Date('2025-09-10'),
        startDate: new Date('2025-09-01'),
        technicianNotes: 'Trabajo en progreso',
        laborCost: 600,
        partsCost: 400,
        totalCost: 1000,
        estimatedCost: 1000,
        parts: [],
        services: [],
        notes: `Orden en proceso para ${data.vehicleName} ${data.vehicleModel}`,
        recommendations: 'En evaluación',
        paymentStatus: 'pending',
        createdAt: new Date('2025-09-01'),
        updatedAt: new Date()
      });
    }
  });

  return workOrders;
}

// Datos parseados para usar en toda la aplicación
export const csvClients = csvToClients(parseCSVData());
export const csvWorkOrders = csvToWorkOrders(parseCSVData());
export const csvVehicles = csvClients.flatMap(client => client.vehicles);

// Función para autenticación de clientes
export function authenticateClient(email: string, password: string): Client | null {
  const client = csvClients.find(c => c.email === email && c.password === password);
  return client || null;
}
