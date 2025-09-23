/**
 * Script para migrar imágenes existentes desde SaveImages/ a Digital Ocean Spaces
 */

const fs = require('fs');
const path = require('path');
const spacesService = require('../services/spacesService');

const SAVE_IMAGES_DIR = path.join(__dirname, '..', 'SaveImages');
const MIGRATION_LOG_FILE = path.join(__dirname, '..', 'migration-log.json');

class ImageMigration {
    constructor() {
        this.migrationLog = {
            startTime: new Date().toISOString(),
            endTime: null,
            totalFiles: 0,
            successful: 0,
            failed: 0,
            errors: [],
            fileMap: {} // old_filename -> new_spaces_url
        };
    }

    /**
     * Lista todas las imágenes en el directorio SaveImages
     */
    getLocalImages() {
        try {
            if (!fs.existsSync(SAVE_IMAGES_DIR)) {
                console.log('Directorio SaveImages no existe');
                return [];
            }

            const files = fs.readdirSync(SAVE_IMAGES_DIR);
            const imageFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
            });

            console.log(` Encontradas ${imageFiles.length} imágenes para migrar`);
            return imageFiles;
        } catch (error) {
            console.error(' Error listando imágenes locales:', error);
            return [];
        }
    }

    /**
     * Migra una imagen individual
     */
    async migrateImage(fileName) {
        try {
            const localPath = path.join(SAVE_IMAGES_DIR, fileName);
            
            console.log(` Migrando: ${fileName}`);
            
            const result = await spacesService.migrateLocalImage(localPath, fileName);
            
            if (result.success) {
                this.migrationLog.successful++;
                this.migrationLog.fileMap[fileName] = result.url;
                console.log(` ${fileName} -> ${result.url}`);
                return { success: true, url: result.url };
            } else {
                this.migrationLog.failed++;
                this.migrationLog.errors.push({
                    file: fileName,
                    error: result.error
                });
                console.error(` Error migrando ${fileName}:`, result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            this.migrationLog.failed++;
            this.migrationLog.errors.push({
                file: fileName,
                error: error.message
            });
            console.error(` Error migrando ${fileName}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Ejecuta la migración completa
     */
    async runMigration(options = {}) {
        const { dryRun = false, batchSize = 5 } = options;
        
        console.log(' Iniciando migración de imágenes a Digital Ocean Spaces');
        
        if (dryRun) {
            console.log(' MODO DRY RUN - No se subirán archivos realmente');
        }

        const imageFiles = this.getLocalImages();
        this.migrationLog.totalFiles = imageFiles.length;

        if (imageFiles.length === 0) {
            console.log('ℹ No hay imágenes para migrar');
            return this.migrationLog;
        }

        // Procesar en lotes para no sobrecargar el servicio
        for (let i = 0; i < imageFiles.length; i += batchSize) {
            const batch = imageFiles.slice(i, i + batchSize);
            console.log(` Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(imageFiles.length / batchSize)}`);
            
            if (dryRun) {
                // En modo dry run, solo simular
                batch.forEach(fileName => {
                    console.log(` DRY RUN: ${fileName} sería migrado`);
                    this.migrationLog.successful++;
                });
            } else {
                // Procesar lote en paralelo
                const promises = batch.map(fileName => this.migrateImage(fileName));
                await Promise.all(promises);
            }

            // Pequeña pausa entre lotes
            if (i + batchSize < imageFiles.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        this.migrationLog.endTime = new Date().toISOString();
        
        // Guardar log de migración
        this.saveLog();
        
        // Mostrar resumen
        this.showSummary();
        
        return this.migrationLog;
    }

    /**
     * Guarda el log de migración
     */
    saveLog() {
        try {
            fs.writeFileSync(MIGRATION_LOG_FILE, JSON.stringify(this.migrationLog, null, 2));
            console.log(` Log de migración guardado en: ${MIGRATION_LOG_FILE}`);
        } catch (error) {
            console.error(' Error guardando log de migración:', error);
        }
    }

    /**
     * Muestra resumen de la migración
     */
    showSummary() {
        console.log('\n RESUMEN DE MIGRACIÓN');
        console.log('========================');
        console.log(`Total de archivos: ${this.migrationLog.totalFiles}`);
        console.log(`Exitosos: ${this.migrationLog.successful}`);
        console.log(`Fallidos: ${this.migrationLog.failed}`);
        console.log(`Tiempo transcurrido: ${this.getElapsedTime()}`);
        
        if (this.migrationLog.errors.length > 0) {
            console.log('\n ERRORES:');
            this.migrationLog.errors.forEach(error => {
                console.log(`  - ${error.file}: ${error.error}`);
            });
        }
        
        if (this.migrationLog.successful > 0) {
            console.log('\n ARCHIVOS MIGRADOS:');
            Object.entries(this.migrationLog.fileMap).forEach(([fileName, url]) => {
                console.log(`  - ${fileName} -> ${url}`);
            });
        }
    }

    /**
     * Calcula el tiempo transcurrido
     */
    getElapsedTime() {
        if (!this.migrationLog.endTime) return 'En progreso...';
        
        const start = new Date(this.migrationLog.startTime);
        const end = new Date(this.migrationLog.endTime);
        const diffMs = end - start;
        const diffSec = Math.round(diffMs / 1000);
        
        return `${diffSec} segundos`;
    }

    /**
     * Crea respaldo de las imágenes locales
     */
    async createBackup() {
        const backupDir = path.join(__dirname, '..', 'backup-images');
        
        try {
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const imageFiles = this.getLocalImages();
            
            console.log(` Creando backup de ${imageFiles.length} imágenes...`);
            
            for (const fileName of imageFiles) {
                const sourcePath = path.join(SAVE_IMAGES_DIR, fileName);
                const backupPath = path.join(backupDir, fileName);
                
                fs.copyFileSync(sourcePath, backupPath);
            }
            
            console.log(` Backup creado en: ${backupDir}`);
            return backupDir;
        } catch (error) {
            console.error(' Error creando backup:', error);
            throw error;
        }
    }
}

// Función principal
async function main() {
    const migration = new ImageMigration();
    
    // Leer argumentos de línea de comandos
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const skipBackup = args.includes('--skip-backup');
    const batchSize = parseInt(args.find(arg => arg.startsWith('--batch='))?.split('=')[1]) || 5;

    try {
        console.log(' Iniciando script de migración...');
        
        // Crear backup antes de migrar (a menos que se especifique lo contrario)
        if (!dryRun && !skipBackup) {
            await migration.createBackup();
        }
        
        // Ejecutar migración
        await migration.runMigration({ dryRun, batchSize });
        
        console.log('\n Migración completada!');
        
        if (!dryRun) {
            console.log('\n  IMPORTANTE:');
            console.log('- Verifica que las imágenes se vean correctamente en el frontend');
            console.log('- Las imágenes locales siguen en SaveImages/ por seguridad');
            console.log('- Una vez confirmado que todo funciona, puedes eliminar SaveImages/');
        }
        
    } catch (error) {
        console.error(' Error durante la migración:', error);
        process.exit(1);
    }
}

// Exportar para uso programático
module.exports = ImageMigration;

// Ejecutar si se llama directamente
if (require.main === module) {
    main();
}