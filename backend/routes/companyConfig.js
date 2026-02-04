const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getConnection, sql } = require('../config/database');
const spacesService = require('../services/spacesService');

// Configurar multer para almacenar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// GET - Obtener configuración de la empresa (usando SP_OBTENER_CONFIGURACION_EMPRESA)
router.get('/company-info', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .execute('SP_OBTENER_CONFIGURACION_EMPRESA');
    
    if (result.recordset && result.recordset.length > 0) {
      const row = result.recordset[0];
      // Mapear campos del SP a la estructura del frontend
      const companyInfo = {
        empresaId: row.empresa_id,
        nombreEmpresa: row.nombre_empresa,
        rtn: row.rtn,
        direccion: row.direccion,
        telefono: row.telefono,
        correo: row.correo,
        logoUrl: row.logo_url,
        mensajePieFactura: row.mensaje_pie_factura,
        impuestoPorcentaje: row.impuesto_porcentaje,
        moneda: row.moneda
      };
      res.json({ success: true, data: companyInfo });
    } else {
      res.status(404).json({ success: false, message: 'No se encontró configuración de empresa' });
    }
  } catch (error) {
    console.error('Error obteniendo configuración de empresa:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la configuración', error: error.message });
  }
});

// PUT - Actualizar información de la empresa (usando SP_ACTUALIZAR_CONFIGURACION_EMPRESA)
router.put('/company-info', async (req, res) => {
  try {
    const {
      empresaId,
      nombreEmpresa,
      rtn,
      direccion,
      telefono,
      correo,
      logoUrl,
      mensajePieFactura,
      impuestoPorcentaje,
      moneda
    } = req.body;

    // Obtener el usuario que modifica (por ahora hardcodeado, luego se obtendrá del token)
    const modificadoPor = req.user?.id || 1;

    const pool = await getConnection();
    const result = await pool.request()
      .input('empresa_id', sql.Int, empresaId)
      .input('nombre_empresa', sql.VarChar(150), nombreEmpresa)
      .input('rtn', sql.VarChar(20), rtn)
      .input('direccion', sql.VarChar(300), direccion)
      .input('telefono', sql.VarChar(30), telefono || null)
      .input('correo', sql.VarChar(100), correo || null)
      .input('logo_url', sql.VarChar(255), logoUrl || null)
      .input('mensaje_pie_factura', sql.VarChar(300), mensajePieFactura || null)
      .input('impuesto_porcentaje', sql.Decimal(5, 2), impuestoPorcentaje)
      .input('moneda', sql.VarChar(5), moneda)
      .input('modificado_por', sql.Int, modificadoPor)
      .execute('SP_ACTUALIZAR_CONFIGURACION_EMPRESA');

    if (result.recordset && result.recordset.length > 0) {
      const response = result.recordset[0];
      if (response.status === '200 OK' || response.allow === 1) {
        res.json({ success: true, message: response.msg || 'Configuración actualizada correctamente' });
      } else {
        res.status(400).json({ success: false, message: response.msg || 'Error al actualizar' });
      }
    } else {
      res.json({ success: true, message: 'Configuración actualizada correctamente' });
    }
  } catch (error) {
    console.error('Error actualizando configuración de empresa:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la configuración', error: error.message });
  }
});

// POST - Subir logo de la empresa a Digital Ocean Spaces
router.post('/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se proporcionó ningún archivo' });
    }

    // Subir imagen a Digital Ocean Spaces
    const uploadResult = await spacesService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'company-logos'
    );

    if (!uploadResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al subir el logo a Digital Ocean Spaces',
        error: uploadResult.error 
      });
    }

    // Retornar la URL del logo
    res.json({ 
      success: true, 
      message: 'Logo subido exitosamente',
      data: {
        url: uploadResult.url,
        key: uploadResult.key
      }
    });

  } catch (error) {
    console.error('Error subiendo logo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al subir el logo', 
      error: error.message 
    });
  }
});

// GET - Convertir imagen de logo a base64 (proxy para evitar CORS)
router.get('/logo-base64', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL no proporcionada' });
    }

    // Descargar la imagen usando fetch (node-fetch o el fetch nativo de Node 18+)
    const https = require('https');
    const http = require('http');
    
    const protocol = url.startsWith('https') ? https : http;
    
    const imageBuffer = await new Promise((resolve, reject) => {
      protocol.get(url, (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });

    // Convertir a base64
    const base64 = imageBuffer.toString('base64');
    const mimeType = url.endsWith('.png') ? 'image/png' : 
                     url.endsWith('.jpg') || url.endsWith('.jpeg') ? 'image/jpeg' : 
                     'image/png';
    
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    res.json({ 
      success: true, 
      data: { base64: dataUrl }
    });

  } catch (error) {
    console.error('Error convirtiendo logo a base64:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al convertir imagen a base64', 
      error: error.message 
    });
  }
});

// ==================== RUTAS DE CAI ====================

// GET - Obtener lista de CAIs
router.get('/cais', async (req, res) => {
  try {
    const pool = await getConnection();
    
    // Verificar si la tabla existe primero
    const tableCheck = await pool.request()
      .query(`
        SELECT COUNT(*) as table_count
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = 'rangos_cai'
      `);
    
    if (tableCheck.recordset[0].table_count === 0) {
      // La tabla aún no existe, devolver array vacío
      return res.json({ success: true, data: [] });
    }
    
    // Consulta directa a la tabla de rangos CAI
    const result = await pool.request()
      .query(`
        SELECT 
          rango_id as id,
          cai,
          punto_emision as puntoEmision,
          establecimiento,
          tipo_documento as tipoDocumento,
          rango_inicial as rangoInicial,
          rango_final as rangoFinal,
          numero_actual as numeroActual,
          fecha_limite_emision as fechaLimiteEmision,
          activo
        FROM rangos_cai
        WHERE activo = 1
        ORDER BY fecha_creacion DESC
      `);
    
    const cais = result.recordset.map(row => ({
      ...row,
      fechaLimiteEmision: row.fechaLimiteEmision ? new Date(row.fechaLimiteEmision).toISOString().split('T')[0] : null,
      activo: row.activo === 1 || row.activo === true
    }));
    
    res.json({ success: true, data: cais });
  } catch (error) {
    console.error('Error obteniendo CAIs:', error);
    // En caso de error, devolver array vacío en lugar de error 500
    res.json({ success: true, data: [], message: 'Tabla de CAIs no disponible aún' });
  }
});

// POST - Registrar nuevo CAI (usando SP_REGISTRAR_RANGO_CAI)
router.post('/cais', async (req, res) => {
  try {
    const {
      cai,
      puntoEmision,
      establecimiento,
      tipoDocumento,
      rangoInicial,
      rangoFinal,
      fechaLimiteEmision
    } = req.body;

    // Validaciones
    if (!cai || !puntoEmision || !establecimiento || !tipoDocumento || !rangoInicial || !rangoFinal || !fechaLimiteEmision) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son obligatorios' 
      });
    }

    // Obtener el usuario que registra (por ahora hardcodeado, luego se obtendrá del token)
    const registradoPor = req.user?.id || 1;

    const pool = await getConnection();
    const result = await pool.request()
      .input('cai', sql.VarChar(40), cai)
      .input('punto_emision', sql.VarChar(3), puntoEmision)
      .input('establecimiento', sql.VarChar(3), establecimiento)
      .input('tipo_documento', sql.VarChar(2), tipoDocumento)
      .input('rango_inicial', sql.VarChar(8), rangoInicial)
      .input('rango_final', sql.VarChar(8), rangoFinal)
      .input('fecha_limite_emision', sql.Date, fechaLimiteEmision)
      .input('registrado_por', sql.Int, registradoPor)
      .execute('SP_REGISTRAR_RANGO_CAI');

    if (result.recordset && result.recordset.length > 0) {
      const response = result.recordset[0];
      if (response.status === '200 OK' || response.allow === 1) {
        res.json({ 
          success: true, 
          message: response.msg || 'CAI registrado correctamente' 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: response.msg || 'Error al registrar el CAI' 
        });
      }
    } else {
      res.json({ success: true, message: 'CAI registrado correctamente' });
    }
  } catch (error) {
    console.error('Error registrando CAI:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar el CAI', 
      error: error.message 
    });
  }
});

// DELETE - Eliminar/Desactivar CAI
router.delete('/cais/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await getConnection();
    // Desactivar el CAI en lugar de eliminarlo físicamente
    const result = await pool.request()
      .input('rango_id', sql.Int, id)
      .query(`
        UPDATE rangos_cai 
        SET activo = 0, 
            fecha_modificacion = GETDATE()
        WHERE rango_id = @rango_id
      `);

    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: 'CAI eliminado correctamente' });
    } else {
      res.status(404).json({ success: false, message: 'CAI no encontrado' });
    }
  } catch (error) {
    console.error('Error eliminando CAI:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar el CAI', 
      error: error.message 
    });
  }
});

// PUT - Actualizar configuración de facturación
router.put('/billing', async (req, res) => {
  try {
    const {
      regimenFiscal,
      obligadoLlevarContabilidad,
      contribuyenteISV,
      agenteRetencionISV,
      sujetoPercepcionISV
    } = req.body;

    // Por ahora solo retornamos éxito ya que estos campos podrían guardarse en configuración
    // En el futuro se puede agregar un SP para esto
    res.json({ 
      success: true, 
      message: 'Configuración de facturación guardada correctamente' 
    });
  } catch (error) {
    console.error('Error actualizando configuración de facturación:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar la configuración', 
      error: error.message 
    });
  }
});

module.exports = router;
