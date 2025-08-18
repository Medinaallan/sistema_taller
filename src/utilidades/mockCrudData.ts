// mockCrudData.ts
// Mock data para tablas CRUD de todos los módulos administrativos
// Nota: Todos los valores monetarios están en Lempiras Hondureños (L.)
import type {
  WorkOrder,
  Appointment,
  Quotation,
  QuotationItem,
  Invoice,
  InvoiceItem,
  Payment,
  InventoryItem,
  Supplier,
  Product,
  Service,
  Log
} from '../tipos/index';

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo1',
    clientId: 'c1',
    vehicleId: 'v1',
    mechanicId: 'm1',
    receptionistId: 'r1',
    status: 'in-progress',
    description: 'Reparación de motor',
    problem: 'Ruido anormal en el motor',
    diagnosis: 'Posible problema en los pistones',
    serviceType: 'corrective',
    estimatedCompletionDate: new Date('2025-08-20'),
    startDate: new Date('2025-08-15'),
    technicianNotes: 'Se requiere desarmar el motor',
    laborCost: 2000,
    partsCost: 3000,
    totalCost: 5000,
    estimatedCost: 5500,
    parts: [],
    services: [],
    notes: 'Cliente reporta ruido desde hace una semana',
    recommendations: 'Se recomienda cambio de aceite cada 5000km',
    paymentStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'wo2',
    clientId: 'c2',
    vehicleId: 'v2',
    mechanicId: 'm2',
    receptionistId: 'r1',
    status: 'pending',
    description: 'Cambio de frenos',
    problem: 'Frenos hacen ruido al frenar',
    serviceType: 'preventive',
    estimatedCompletionDate: new Date('2025-08-18'),
    laborCost: 800,
    partsCost: 1200,
    totalCost: 2000,
    estimatedCost: 2200,
    parts: [],
    services: [],
    notes: 'Cliente solicita revisión completa del sistema de frenos',
    paymentStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    clientId: 'c1',
    vehicleId: 'v1',
    serviceTypeId: 's1',
    date: new Date('2025-08-15'),
    time: '10:00',
    status: 'pending',
    notes: 'Primera cita',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'a2',
    clientId: 'c2',
    vehicleId: 'v2',
    serviceTypeId: 's2',
    date: new Date('2025-08-16'),
    time: '14:30',
    status: 'confirmed',
    notes: 'Servicio regular',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockQuotations: Quotation[] = [
  {
    id: 'q1',
    clientId: 'c1',
    vehicleId: 'v1',
    items: [
      {
        id: 'qi1',
        description: 'Cambio de aceite',
        quantity: 1,
        unitPrice: 500,
        total: 500
      } as QuotationItem
    ],
    total: 500,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'f1',
    clientId: 'c1',
    workOrderId: 'wo1',
    invoiceNumber: 'F-001',
    date: new Date('2025-08-14'),
    items: [
      {
        id: 'fi1',
        description: 'Cambio de aceite',
        quantity: 1,
        unitPrice: 500,
        total: 500
      } as InvoiceItem
    ],
    subtotal: 500,
    tax: 75,
    total: 575,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockPayments: Payment[] = [
  {
    id: 'p1',
    invoiceId: 'f1',
    clientId: 'c1',
    amount: 575,
    method: 'cash',
    date: new Date('2025-08-14'),
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockInventory: InventoryItem[] = [
  {
    id: 'i1',
    productId: 'pr1',
    quantity: 10,
    minStock: 2,
    maxStock: 20,
    location: 'Bodega 1',
    supplierId: 's1',
    lastEntryDate: new Date('2025-08-10'),
    lastExitDate: new Date('2025-08-12'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockSuppliers: Supplier[] = [
  {
    id: 's1',
    name: 'Repuestos Sula',
    contactName: 'Juan Pérez',
    phone: '9999-8888',
    email: 'contacto@sula.com',
    address: 'Blvd. Principal',
    productsSupplied: ['pr1'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockProducts: Product[] = [
  {
    id: 'pr1',
    name: 'Aceite 5W-30',
    description: 'Aceite sintético para motor',
    brand: 'Castrol',
    model: 'Edge',
    price: 500,
    cost: 350,
    stock: 10,
    supplierId: 's1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockServices: Service[] = [
  {
    id: 'sv1',
    name: 'Cambio de aceite',
    description: 'Incluye filtro',
    basePrice: 500,
    estimatedTime: '1h',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockLogs: Log[] = [
  {
    id: 'l1',
    userId: 'admin1',
    action: 'login',
    entity: 'user',
    entityId: 'admin1',
    description: 'Inicio de sesión',
    timestamp: new Date(),
  },
];
