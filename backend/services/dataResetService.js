const fs = require('fs-extra');
const path = require('path');
const csvService = require('./csvService');

/**
 * 🔄 SERVICIO DE RESTABLECIMIENTO DE DATOS
 * 
 * Permite restablecer todos los CSVs del sistema con datos de ejemplo
 */

class DataResetService {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
  }

  /**
   * 🏗️ DATOS DE EJEMPLO PARA CLIENTES
   */
  getSampleClients() {
    return [
      {
        id: 'cli_001',
        firstName: 'Juan Carlos',
        lastName: 'Rodríguez',
        email: 'juan.rodriguez@email.com',
        phone: '+57 300 1234567',
        address: 'Calle 123 #45-67, Bogotá',
        city: 'Bogotá',
        postalCode: '110111',
        companyName: '',
        idNumber: '1234567890',
        birthDate: '1985-03-15',
        gender: 'male',
        isActive: true,
        registrationDate: '2024-01-15',
        lastUpdateDate: '2024-01-15',
        notes: 'Cliente frecuente, muy puntual'
      },
      {
        id: 'cli_002',
        firstName: 'María Elena',
        lastName: 'García',
        email: 'maria.garcia@email.com',
        phone: '+57 301 2345678',
        address: 'Carrera 87 #23-45, Medellín',
        city: 'Medellín',
        postalCode: '050001',
        companyName: 'Empresa ABC S.A.S',
        idNumber: '2345678901',
        birthDate: '1990-08-22',
        gender: 'female',
        isActive: true,
        registrationDate: '2024-02-01',
        lastUpdateDate: '2024-02-01',
        notes: 'Cliente empresarial'
      },
      {
        id: 'cli_003',
        firstName: 'Carlos Andrés',
        lastName: 'Martínez',
        email: 'carlos.martinez@email.com',
        phone: '+57 302 3456789',
        address: 'Avenida 68 #12-34, Cali',
        city: 'Cali',
        postalCode: '760001',
        companyName: '',
        idNumber: '3456789012',
        birthDate: '1978-12-10',
        gender: 'male',
        isActive: true,
        registrationDate: '2024-03-10',
        lastUpdateDate: '2024-03-10',
        notes: 'Especialista en vehículos deportivos'
      },
      {
        id: 'cli_004',
        firstName: 'Ana Sofía',
        lastName: 'López',
        email: 'ana.lopez@email.com',
        phone: '+57 303 4567890',
        address: 'Transversal 15 #67-89, Barranquilla',
        city: 'Barranquilla',
        postalCode: '080001',
        companyName: '',
        idNumber: '4567890123',
        birthDate: '1992-05-18',
        gender: 'female',
        isActive: true,
        registrationDate: '2024-04-05',
        lastUpdateDate: '2024-04-05',
        notes: 'Cliente nueva, muy exigente con la calidad'
      },
      {
        id: 'cli_005',
        firstName: 'Roberto',
        lastName: 'Hernández',
        email: 'roberto.hernandez@email.com',
        phone: '+57 304 5678901',
        address: 'Diagonal 27 #45-23, Bucaramanga',
        city: 'Bucaramanga',
        postalCode: '680001',
        companyName: '',
        idNumber: '5678901234',
        birthDate: '1988-11-30',
        gender: 'male',
        isActive: false,
        registrationDate: '2023-12-20',
        lastUpdateDate: '2024-06-15',
        notes: 'Cliente inactivo - mudó de ciudad'
      }
    ];
  }

  /**
   * 🚗 DATOS DE EJEMPLO PARA VEHÍCULOS
   */
  getSampleVehicles() {
    return [
      {
        id: 'veh_001',
        clientId: 'cli_001',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        licensePlate: 'ABC123',
        color: 'Blanco',
        vin: '1HGBH41JXMN109186',
        engineNumber: 'ENG001234',
        fuelType: 'Gasolina',
        transmission: 'Manual',
        mileage: 45000,
        isActive: true,
        registrationDate: '2024-01-15',
        lastServiceDate: '2024-08-15',
        nextServiceDate: '2024-11-15',
        notes: 'Mantenimiento preventivo cada 6 meses'
      },
      {
        id: 'veh_002',
        clientId: 'cli_002',
        brand: 'Honda',
        model: 'Civic',
        year: 2019,
        licensePlate: 'DEF456',
        color: 'Negro',
        vin: '2HGFC2F59KH123456',
        engineNumber: 'ENG002345',
        fuelType: 'Gasolina',
        transmission: 'Automática',
        mileage: 67000,
        isActive: true,
        registrationDate: '2024-02-01',
        lastServiceDate: '2024-07-20',
        nextServiceDate: '2024-10-20',
        notes: 'Vehículo empresarial'
      },
      {
        id: 'veh_003',
        clientId: 'cli_003',
        brand: 'BMW',
        model: 'M3',
        year: 2021,
        licensePlate: 'GHI789',
        color: 'Azul',
        vin: 'WBA3B1C55EK123456',
        engineNumber: 'ENG003456',
        fuelType: 'Gasolina',
        transmission: 'Automática',
        mileage: 25000,
        isActive: true,
        registrationDate: '2024-03-10',
        lastServiceDate: '2024-09-01',
        nextServiceDate: '2024-12-01',
        notes: 'Vehículo deportivo - requiere productos premium'
      }
    ];
  }

  /**
   * 📅 DATOS DE EJEMPLO PARA CITAS
   */
  getSampleAppointments() {
    return [
      {
        id: 'app_001',
        clientId: 'cli_001',
        vehicleId: 'veh_001',
        serviceType: 'Mantenimiento Preventivo',
        scheduledDate: '2024-11-15',
        scheduledTime: '09:00',
        status: 'scheduled',
        mechanic: 'Carlos Técnico',
        estimatedDuration: 120,
        notes: 'Cambio de aceite y filtros',
        createdDate: '2024-09-13',
        lastUpdateDate: '2024-09-13'
      },
      {
        id: 'app_002',
        clientId: 'cli_002',
        vehicleId: 'veh_002',
        serviceType: 'Diagnóstico',
        scheduledDate: '2024-10-20',
        scheduledTime: '14:00',
        status: 'confirmed',
        mechanic: 'Luis Mecánico',
        estimatedDuration: 60,
        notes: 'Revisión de ruidos extraños',
        createdDate: '2024-09-10',
        lastUpdateDate: '2024-09-12'
      }
    ];
  }

  /**
   * 🔧 DATOS DE EJEMPLO PARA SERVICIOS
   */
  getSampleServices() {
    return [
      {
        id: 'srv_001',
        name: 'Cambio de Aceite',
        category: 'Mantenimiento',
        description: 'Cambio de aceite de motor y filtro',
        duration: 30,
        price: 80000,
        isActive: true
      },
      {
        id: 'srv_002',
        name: 'Diagnóstico Computarizado',
        category: 'Diagnóstico',
        description: 'Diagnóstico completo con scanner automotriz',
        duration: 60,
        price: 150000,
        isActive: true
      },
      {
        id: 'srv_003',
        name: 'Alineación y Balanceo',
        category: 'Llantas',
        description: 'Alineación y balanceo de las 4 ruedas',
        duration: 90,
        price: 120000,
        isActive: true
      }
    ];
  }

  /**
   * 🔄 RESTABLECER TODOS LOS DATOS (VACIAR COMPLETAMENTE)
   */
  async resetAllData() {
    try {
      console.log('🔄 Iniciando restablecimiento de datos (VACÍO)...');
      
      // 1. Crear backup de datos actuales
      await this.createBackup();
      
      // 2. Vaciar completamente cada archivo CSV
      await csvService.writeCSV('clients', 'clients.csv', [], ['id', 'nombre', 'email', 'telefono', 'direccion', 'vehiculos']);
      console.log('✅ clients.csv vaciado completamente');
      
      await csvService.writeCSV('vehicles', 'vehicles.csv', [], ['id', 'clienteId', 'marca', 'modelo', 'año', 'placa', 'color']);
      console.log('✅ vehicles.csv vaciado completamente');
      
      await csvService.writeCSV('appointments', 'appointments.csv', [], ['id', 'clienteId', 'vehiculoId', 'fecha', 'hora', 'servicio', 'estado', 'notas']);
      console.log('✅ appointments.csv vaciado completamente');
      
      await csvService.writeCSV('services', 'services.csv', [], ['id', 'nombre', 'descripcion', 'precio', 'duracion', 'categoria']);
      console.log('✅ services.csv vaciado completamente');
      
      console.log('✅ TODOS LOS DATOS BORRADOS - Sistema completamente limpio');
      return {
        success: true,
        message: 'Todos los archivos CSV han sido vaciados completamente',
        details: {
          clients: 'Vaciado',
          vehicles: 'Vaciado',
          appointments: 'Vaciado',
          services: 'Vaciado'
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error durante el restablecimiento:', error);
      throw error;
    }
  }

  /**
   * 💾 CREAR BACKUP DE DATOS ACTUALES
   */
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.dataPath, 'backup', `reset_backup_${timestamp}`);
    
    await fs.ensureDir(backupDir);
    
    // Copiar todas las carpetas de datos
    const modules = ['clients', 'vehicles', 'appointments', 'services', 'financial', 'inventory'];
    
    for (const module of modules) {
      const sourcePath = path.join(this.dataPath, module);
      const targetPath = path.join(backupDir, module);
      
      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, targetPath);
      }
    }
    
    console.log(`📦 Backup creado en: ${backupDir}`);
    return backupDir;
  }

  /**
   * 👥 RESTABLECER CLIENTES
   */
  async resetClients() {
    const clients = this.getSampleClients();
    await csvService.writeCSV('clients', 'clients.csv', clients);
    console.log(`✅ ${clients.length} clientes restablecidos`);
    return { count: clients.length, module: 'clients' };
  }

  /**
   * 🚗 RESTABLECER VEHÍCULOS
   */
  async resetVehicles() {
    const vehicles = this.getSampleVehicles();
    await csvService.writeCSV('vehicles', 'vehicles.csv', vehicles);
    console.log(`✅ ${vehicles.length} vehículos restablecidos`);
    return { count: vehicles.length, module: 'vehicles' };
  }

  /**
   * 📅 RESTABLECER CITAS
   */
  async resetAppointments() {
    const appointments = this.getSampleAppointments();
    await csvService.writeCSV('appointments', 'appointments.csv', appointments);
    console.log(`✅ ${appointments.length} citas restablecidas`);
    return { count: appointments.length, module: 'appointments' };
  }

  /**
   * 🔧 RESTABLECER SERVICIOS
   */
  async resetServices() {
    const services = this.getSampleServices();
    await csvService.writeCSV('services', 'services.csv', services);
    console.log(`✅ ${services.length} servicios restablecidos`);
    return { count: services.length, module: 'services' };
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS DE DATOS
   */
  async getDataStats() {
    try {
      const stats = {
        clients: await this.getModuleStats('clients', 'clients.csv'),
        vehicles: await this.getModuleStats('vehicles', 'vehicles.csv'),
        appointments: await this.getModuleStats('appointments', 'appointments.csv'),
        services: await this.getModuleStats('services', 'services.csv')
      };
      
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * 📈 OBTENER ESTADÍSTICAS DE UN MÓDULO
   */
  async getModuleStats(module, filename) {
    try {
      const data = await csvService.readCSV(module, filename);
      const filePath = path.join(this.dataPath, module, filename);
      const exists = await fs.pathExists(filePath);
      
      let lastModified = null;
      if (exists) {
        const stats = await fs.stat(filePath);
        lastModified = stats.mtime.toISOString();
      }
      
      return {
        count: data.length,
        exists,
        lastModified,
        path: filePath
      };
    } catch (error) {
      return {
        count: 0,
        exists: false,
        lastModified: null,
        error: error.message
      };
    }
  }
}

module.exports = new DataResetService();