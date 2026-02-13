const fs = require('fs-extra');
const path = require('path');

/**
 * 🔄 SERVICIO DE RESTABLECIMIENTO DE DATOS
 * 
 * Servicio para restablecer datos (basado en SQL Server - csvService deshabilitado)
 */

class DataResetService {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
  }

  /**
   */
  async resetAllData() {
    try {
      console.log('⚠️  csvService ha sido eliminado - Usando SQL Server para datos');
      return {
        success: false,
        message: 'El servicio de restablecimiento CSV ha sido deshabilitado. Usar SQL Server directamente.',
        error: 'CSV service removed'
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
}

module.exports = new DataResetService();