const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const ExcelImportService = require('../services/excelImportService');

const router = express.Router();
const excelImportService = new ExcelImportService();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        // Crear directorio si no existe
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generar nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Solo permitir archivos Excel
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // Límite de 10MB
    }
});

// Crear directorio de uploads si no existe
async function ensureUploadDir() {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, { recursive: true });
    }
}

// Inicializar directorio
ensureUploadDir();

/**
 * POST /api/excel-import/preview
 * Subir archivo Excel y obtener vista previa sin procesarlo
 */
router.post('/preview', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se subió ningún archivo'
            });
        }

        console.log(`Generando vista previa para: ${req.file.filename}`);

        // Procesar el archivo Excel para vista previa
        const result = await excelImportService.previewExcelFile(req.file.path);

        // Mantener el archivo temporalmente para procesamiento posterior
        // Agregar la ruta del archivo al resultado para uso posterior
        result.tempFilePath = req.file.path;
        result.tempFileName = req.file.filename;

        // Responder con el resultado
        res.json(result);

    } catch (error) {
        console.error('Error generando vista previa:', error);

        // Limpiar archivo temporal en caso de error
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (cleanupError) {
                console.warn('No se pudo eliminar archivo temporal:', cleanupError.message);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * POST /api/excel-import/confirm
 * Confirmar y procesar archivo Excel previamente validado
 */
router.post('/confirm', async (req, res) => {
    try {
        const { tempFilePath } = req.body;

        if (!tempFilePath) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó ruta de archivo temporal'
            });
        }

        // Verificar que el archivo temporal existe
        try {
            await fs.access(tempFilePath);
        } catch {
            return res.status(404).json({
                success: false,
                message: 'Archivo temporal no encontrado o expirado'
            });
        }

        console.log(`Procesando archivo confirmado: ${tempFilePath}`);

        // Procesar el archivo Excel completamente
        const result = await excelImportService.processExcelFile(tempFilePath);

        // Limpiar archivo temporal
        try {
            await fs.unlink(tempFilePath);
        } catch (error) {
            console.warn('No se pudo eliminar archivo temporal:', error.message);
        }

        // Responder con el resultado
        res.json(result);

    } catch (error) {
        console.error('Error procesando archivo confirmado:', error);

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * POST /api/excel-import/upload
 * Subir y procesar archivo Excel con clientes y vehículos (método original mantenido para compatibilidad)
 */
router.post('/upload', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se subió ningún archivo'
            });
        }

        console.log(`Procesando archivo: ${req.file.filename}`);

        // Procesar el archivo Excel
        const result = await excelImportService.processExcelFile(req.file.path);

        // Limpiar archivo temporal
        try {
            await fs.unlink(req.file.path);
        } catch (error) {
            console.warn('No se pudo eliminar archivo temporal:', error.message);
        }

        // Responder con el resultado
        res.json(result);

    } catch (error) {
        console.error('Error procesando archivo Excel:', error);

        // Limpiar archivo temporal en caso de error
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (cleanupError) {
                console.warn('No se pudo eliminar archivo temporal:', cleanupError.message);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * GET /api/excel-import/template
 * Descargar plantilla Excel para importación
 */
router.get('/template', async (req, res) => {
    try {
        const templatePath = await excelImportService.downloadTemplate();
        
        // Verificar que el archivo existe
        try {
            await fs.access(templatePath);
        } catch {
            return res.status(404).json({
                success: false,
                message: 'Plantilla no encontrada'
            });
        }

        // Leer el archivo como buffer
        const fileBuffer = await fs.readFile(templatePath);
        
        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla-importacion-clientes-vehiculos.xlsx');
        res.setHeader('Content-Length', fileBuffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        // Enviar buffer directamente
        res.send(fileBuffer);

    } catch (error) {
        console.error('Error descargando plantilla:', error);
        res.status(500).json({
            success: false,
            message: 'Error descargando plantilla',
            error: error.message
        });
    }
});

/**
 * GET /api/excel-import/status
 * Obtener estadísticas actuales de clientes y vehículos
 */
router.get('/status', async (req, res) => {
    try {
        const clientsPath = path.join(__dirname, '..', 'data', 'clients', 'clients.csv');
        const vehiclesPath = path.join(__dirname, '..', 'data', 'vehicles', 'vehicles.csv');

        let clientsCount = 0;
        let vehiclesCount = 0;

        // Contar clientes
        try {
            const clientsContent = await fs.readFile(clientsPath, 'utf8');
            const clientsLines = clientsContent.trim().split('\n');
            clientsCount = Math.max(0, clientsLines.length - 1); // -1 para excluir header
        } catch {
            // Archivo no existe o está vacío
        }

        // Contar vehículos
        try {
            const vehiclesContent = await fs.readFile(vehiclesPath, 'utf8');
            const vehiclesLines = vehiclesContent.trim().split('\n');
            vehiclesCount = Math.max(0, vehiclesLines.length - 1); // -1 para excluir header
        } catch {
            // Archivo no existe o está vacío
        }

        res.json({
            success: true,
            stats: {
                totalClients: clientsCount,
                totalVehicles: vehiclesCount,
                lastUpdate: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas',
            error: error.message
        });
    }
});

// Manejo de errores de multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Archivo demasiado grande. Máximo 10MB permitido.'
            });
        }
    }
    
    if (error.message === 'Solo se permiten archivos Excel (.xlsx, .xls)') {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    next(error);
});

module.exports = router;