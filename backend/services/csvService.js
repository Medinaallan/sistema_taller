const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { v4: uuidv4 } = require('uuid');

/**
 * 🗃️ SERVICIO CSV BASE - CRUD GENÉRICO PARA ARCHIVOS CSV
 * 
 * Sistema completo de gestión de datos CSV para el taller
 * Proporciona operaciones CRUD genéricas, validaciones y respaldos automáticos
 */

class CSVService {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.backupPath = path.join(this.dataPath, 'backup');
    
    // Asegurar que las carpetas existan
    this.ensureDirectories();
  }

  /**
   * 📁 Asegurar que las carpetas de datos existan
   */
  async ensureDirectories() {
    const directories = [
      'clients', 'vehicles', 'services', 'appointments', 
      'financial', 'inventory', 'admin', 'backup'
    ];
    
    for (const dir of directories) {
      await fs.ensureDir(path.join(this.dataPath, dir));
    }
  }

  /**
   * 📖 LEER CSV - Leer todos los registros de un archivo CSV
   * @param {string} module - Módulo (clients, vehicles, etc.)
   * @param {string} filename - Nombre del archivo CSV
   * @returns {Promise<Array>} Array de objetos
   */
  async readCSV(module, filename) {
    const filePath = path.join(this.dataPath, module, filename);
    
    // Si el archivo no existe, devolver array vacío
    if (!await fs.pathExists(filePath)) {
      console.log(`📄 Archivo ${filename} no existe, creando vacío...`);
      return [];
    }
    
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          console.log(`✅ Leídos ${results.length} registros de ${filename}`);
          resolve(results);
        })
        .on('error', (error) => {
          console.error(`❌ Error leyendo ${filename}:`, error);
          reject(error);
        });
    });
  }

  /**
   *  ESCRIBIR CSV - Escribir datos a un archivo CSV
   * @param {string} module - Módulo (clients, vehicles, etc.)
   * @param {string} filename - Nombre del archivo CSV
   * @param {Array} data - Array de objetos a escribir
   * @param {Array} headers - Headers del CSV (opcional, se auto-detecta del primer objeto)
   */
  async writeCSV(module, filename, data, headers) {
    const filePath = path.join(this.dataPath, module, filename);
    
    // Si no se proporcionan headers, extraerlos del primer objeto
    if (!headers && data && data.length > 0) {
      headers = Object.keys(data[0]);
    }
    
    // Validar que tenemos headers
    if (!headers || headers.length === 0) {
      throw new Error('No se pueden determinar los headers para el CSV');
    }
    
    // Crear backup antes de escribir
    await this.createBackup(module, filename);
    
    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers.map(h => ({ id: h, title: h }))
    });
    
    try {
      await csvWriter.writeRecords(data);
      console.log(`✅ Escritos ${data.length} registros en ${filename}`);
      return true;
    } catch (error) {
      console.error(`❌ Error escribiendo ${filename}:`, error);
      throw error;
    }
  }

  /**
   * ➕ CREAR REGISTRO - Agregar un nuevo registro
   * @param {string} module - Módulo
   * @param {string} filename - Archivo CSV
   * @param {Object} newRecord - Nuevo registro
   * @param {Array} headers - Headers del CSV
   */
  async createRecord(module, filename, newRecord, headers) {
    const data = await this.readCSV(module, filename);
    
    // Generar ID único si no existe
    if (!newRecord.id) {
      newRecord.id = this.generateId(module);
    }
    
    // Agregar timestamps
    newRecord.created_at = new Date().toISOString();
    newRecord.updated_at = new Date().toISOString();
    
    data.push(newRecord);
    await this.writeCSV(module, filename, data, headers);
    
    console.log(`✅ Registro creado en ${filename}: ${newRecord.id}`);
    return newRecord;
  }

  /**
   * 📝 ACTUALIZAR REGISTRO - Actualizar un registro existente
   * @param {string} module - Módulo
   * @param {string} filename - Archivo CSV
   * @param {string} id - ID del registro
   * @param {Object} updates - Campos a actualizar
   * @param {Array} headers - Headers del CSV
   */
  async updateRecord(module, filename, id, updates, headers) {
    const data = await this.readCSV(module, filename);
    const index = data.findIndex(record => record.id === id);
    
    if (index === -1) {
      throw new Error(`Registro con ID ${id} no encontrado`);
    }
    
    // Actualizar campos
    data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() };
    await this.writeCSV(module, filename, data, headers);
    
    console.log(`✅ Registro actualizado en ${filename}: ${id}`);
    return data[index];
  }

  /**
   * 🗑️ ELIMINAR REGISTRO - Eliminar un registro
   * @param {string} module - Módulo
   * @param {string} filename - Archivo CSV
   * @param {string} id - ID del registro
   * @param {Array} headers - Headers del CSV
   */
  async deleteRecord(module, filename, id, headers) {
    const data = await this.readCSV(module, filename);
    const filteredData = data.filter(record => record.id !== id);
    
    if (data.length === filteredData.length) {
      throw new Error(`Registro con ID ${id} no encontrado`);
    }
    
    await this.writeCSV(module, filename, filteredData, headers);
    
    console.log(`✅ Registro eliminado de ${filename}: ${id}`);
    return true;
  }

  /**
   * 🔍 BUSCAR REGISTROS - Buscar registros con filtros
   * @param {string} module - Módulo
   * @param {string} filename - Archivo CSV
   * @param {Object} filters - Filtros de búsqueda
   */
  async searchRecords(module, filename, filters = {}) {
    const data = await this.readCSV(module, filename);
    
    if (Object.keys(filters).length === 0) {
      return data;
    }
    
    return data.filter(record => {
      return Object.entries(filters).every(([key, value]) => {
        if (!record[key]) return false;
        return record[key].toString().toLowerCase().includes(value.toString().toLowerCase());
      });
    });
  }

  /**
   * 🆔 GENERAR ID ÚNICO
   * @param {string} prefix - Prefijo del ID
   */
  generateId(prefix = 'record') {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    return `${prefix}-${timestamp}-${uuid}`;
  }

  /**
   * 💾 CREAR BACKUP - Crear respaldo de un archivo
   * @param {string} module - Módulo
   * @param {string} filename - Archivo CSV
   */
  async createBackup(module, filename) {
    const sourcePath = path.join(this.dataPath, module, filename);
    
    if (!await fs.pathExists(sourcePath)) {
      return; // No hay nada que respaldar
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `${filename.replace('.csv', '')}_backup_${timestamp}.csv`;
    const backupFilePath = path.join(this.backupPath, backupFilename);
    
    try {
      await fs.copy(sourcePath, backupFilePath);
      console.log(`💾 Backup creado: ${backupFilename}`);
    } catch (error) {
      console.error(`❌ Error creando backup:`, error);
    }
  }

  /**
   * 🧹 LIMPIAR BACKUPS ANTIGUOS - Mantener solo los últimos N backups
   * @param {number} keepLast - Cantidad de backups a mantener
   */
  async cleanOldBackups(keepLast = 50) {
    try {
      const backupFiles = await fs.readdir(this.backupPath);
      const csvBackups = backupFiles
        .filter(file => file.endsWith('.csv') && file.includes('_backup_'))
        .sort((a, b) => b.localeCompare(a)); // Ordenar por fecha descendente
      
      if (csvBackups.length > keepLast) {
        const filesToDelete = csvBackups.slice(keepLast);
        
        for (const file of filesToDelete) {
          await fs.remove(path.join(this.backupPath, file));
          console.log(`🗑️ Backup eliminado: ${file}`);
        }
      }
    } catch (error) {
      console.error('❌ Error limpiando backups:', error);
    }
  }

  /**
   * 📊 ESTADÍSTICAS - Obtener estadísticas de un módulo
   * @param {string} module - Módulo
   * @param {string} filename - Archivo CSV
   */
  async getStats(module, filename) {
    const data = await this.readCSV(module, filename);
    
    return {
      total: data.length,
      lastUpdated: data.length > 0 ? Math.max(...data.map(r => new Date(r.updated_at || r.created_at).getTime())) : null,
      file: filename,
      module: module
    };
  }
}

// Instancia singleton
const csvService = new CSVService();

module.exports = csvService;