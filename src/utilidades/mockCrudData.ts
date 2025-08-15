// mockCrudData.ts
// Mock data para tablas CRUD de todos los módulos administrativos
import type { Appointment } from '../tipos/appointment';
import type { Quotation, QuotationItem } from '../tipos/quotation';
import type { Invoice, InvoiceItem } from '../tipos/invoice';
import type { Payment } from '../tipos/payment';
import type { InventoryItem } from '../tipos/inventory';
import type { Supplier } from '../tipos/supplier';
import type { Product } from '../tipos/product';
import type { Service } from '../tipos/service';
import type { Log } from '../tipos/log';

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
];

export const mockQuotations: Quotation[] = [
  {
    id: 'q1',
    clientId: 'c1',
    vehicleId: 'v1',
    items: [
      { id: 'qi1', description: 'Cambio de aceite', quantity: 1, unitPrice: 500, total: 500 },
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
      { id: 'fi1', description: 'Cambio de aceite', quantity: 1, unitPrice: 500, total: 500 },
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
