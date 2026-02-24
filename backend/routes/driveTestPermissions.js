const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const spacesService = require('../services/spacesService');

/**
 * POST /api/drive-test-permissions
 * Registrar un nuevo permiso de prueba de manejo (SP_REGISTRAR_PERMISO_PRUEBA_MANEJO)
 * Body: { otId, descripcion?, registradoPor }
 */
router.post('/', async (req, res) => {
  try {
    const { otId, descripcion, registradoPor } = req.body;

    if (!otId || !registradoPor) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: otId, registradoPor'
      });
    }

    console.log(`📋 Registrando permiso de prueba de manejo para OT ${otId}`);

    const pool = await getConnection();
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(otId))
      .input('descripcion', sql.VarChar(300), descripcion || null)
      .input('registrado_por', sql.Int, parseInt(registradoPor))
      .execute('SP_REGISTRAR_PERMISO_PRUEBA_MANEJO');

    const response = result.recordset[0];

    if (response.allow === 1) {
      console.log(`✅ Permiso creado con ID: ${response.permiso_id}`);
      return res.json({
        success: true,
        message: response.msg,
        data: {
          permisoId: response.permiso_id
        }
      });
    } else {
      console.warn(`⚠️ SP rechazó la creación: ${response.msg}`);
      return res.status(400).json({
        success: false,
        message: response.msg
      });
    }
  } catch (error) {
    console.error('❌ Error registrando permiso de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar permiso de prueba de manejo',
      error: error.message
    });
  }
});

/**
 * GET /api/drive-test-permissions
 * Obtener permisos con filtros opcionales (SP_OBTENER_PERMISO_PRUEBA_MANEJO)
 * Query params: permisoId, otId, clienteId, estado, fechaInicio, fechaFin
 */
router.get('/', async (req, res) => {
  try {
    const { permisoId, otId, clienteId, estado, fechaInicio, fechaFin } = req.query;

    console.log('🔍 Consultando permisos de prueba de manejo', req.query);

    const pool = await getConnection();
    const result = await pool.request()
      .input('permiso_id', sql.Int, permisoId ? parseInt(permisoId) : null)
      .input('ot_id', sql.Int, otId ? parseInt(otId) : null)
      .input('cliente_id', sql.Int, clienteId ? parseInt(clienteId) : null)
      .input('estado', sql.VarChar(50), estado || null)
      .input('fecha_inicio', sql.Date, fechaInicio || null)
      .input('fecha_fin', sql.Date, fechaFin || null)
      .execute('SP_OBTENER_PERMISO_PRUEBA_MANEJO');

    const permisos = result.recordset || [];
    console.log(`✅ Encontrados ${permisos.length} permisos`);

    res.json({
      success: true,
      data: permisos
    });
  } catch (error) {
    console.error('❌ Error obteniendo permisos de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos de prueba de manejo',
      error: error.message
    });
  }
});

/**
 * GET /api/drive-test-permissions/ot/:otId
 * Obtener el permiso de una OT específica
 */
router.get('/ot/:otId', async (req, res) => {
  try {
    const { otId } = req.params;
    console.log(`🔍 Buscando permiso de prueba para OT ${otId}`);

    const pool = await getConnection();
    const result = await pool.request()
      .input('permiso_id', sql.Int, null)
      .input('ot_id', sql.Int, parseInt(otId))
      .input('cliente_id', sql.Int, null)
      .input('estado', sql.VarChar(50), null)
      .input('fecha_inicio', sql.Date, null)
      .input('fecha_fin', sql.Date, null)
      .execute('SP_OBTENER_PERMISO_PRUEBA_MANEJO');

    const permiso = result.recordset?.[0] || null;

    res.json({
      success: true,
      data: permiso
    });
  } catch (error) {
    console.error('❌ Error obteniendo permiso de OT:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permiso de la orden de trabajo',
      error: error.message
    });
  }
});

/**
 * GET /api/drive-test-permissions/client/:clienteId
 * Obtener permisos pendientes de un cliente
 */
router.get('/client/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { estado } = req.query;

    console.log(`🔍 Buscando permisos de prueba del cliente ${clienteId}`);

    const pool = await getConnection();
    const result = await pool.request()
      .input('permiso_id', sql.Int, null)
      .input('ot_id', sql.Int, null)
      .input('cliente_id', sql.Int, parseInt(clienteId))
      .input('estado', sql.VarChar(50), estado || 'Pendiente')
      .input('fecha_inicio', sql.Date, null)
      .input('fecha_fin', sql.Date, null)
      .execute('SP_OBTENER_PERMISO_PRUEBA_MANEJO');

    const permisos = result.recordset || [];
    console.log(`✅ Encontrados ${permisos.length} permisos para cliente ${clienteId}`);

    res.json({
      success: true,
      data: permisos
    });
  } catch (error) {
    console.error('❌ Error obteniendo permisos del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos del cliente',
      error: error.message
    });
  }
});

/**
 * PUT /api/drive-test-permissions/:otId/resolve
 * Resolver (aprobar/denegar) un permiso de prueba de manejo.
 * Si se aprueba, sube la firma en base64 a Digital Ocean Spaces y guarda la URL.
 * Body: { estadoResolucion: 'Aprobado' | 'Denegado', firmadoPor, firmaBase64? }
 * SP_RESOLVER_PERMISO_PRUEBA_MANEJO
 */
router.put('/:otId/resolve', async (req, res) => {
  try {
    const { otId } = req.params;
    const { estadoResolucion, firmadoPor, firmaBase64 } = req.body;

    if (!otId || !estadoResolucion || !firmadoPor) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: otId, estadoResolucion, firmadoPor'
      });
    }

    if (!['Aprobado', 'Denegado'].includes(estadoResolucion)) {
      return res.status(400).json({
        success: false,
        message: 'estadoResolucion debe ser "Aprobado" o "Denegado"'
      });
    }

    console.log(`📝 Resolviendo permiso de prueba para OT ${otId}: ${estadoResolucion}`);

    let firmaUrl = null;

    // Si es aprobación y hay firma en base64, subirla a Digital Ocean Spaces
    if (estadoResolucion === 'Aprobado' && firmaBase64) {
      console.log('📤 Subiendo firma al almacenamiento...');
      try {
        // Quitar el prefijo "data:image/png;base64," si existe
        const base64Data = firmaBase64.replace(/^data:image\/\w+;base64,/, '');
        const signatureBuffer = Buffer.from(base64Data, 'base64');

        const uploadResult = await spacesService.uploadImage(
          signatureBuffer,
          `firma-prueba-manejo-ot${otId}.png`,
          'image/png',
          'drive-test-signatures'
        );

        if (uploadResult.success) {
          firmaUrl = uploadResult.url;
          console.log(`✅ Firma subida exitosamente: ${firmaUrl}`);
        } else {
          console.error('⚠️ Error al subir la firma:', uploadResult.error);
          return res.status(500).json({
            success: false,
            message: 'Error al subir la firma al almacenamiento'
          });
        }
      } catch (uploadError) {
        console.error('❌ Error subiendo firma:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error al procesar la firma digital',
          error: uploadError.message
        });
      }
    }

    // Ejecutar SP_RESOLVER_PERMISO_PRUEBA_MANEJO
    const pool = await getConnection();
    const result = await pool.request()
      .input('ot_id', sql.Int, parseInt(otId))
      .input('estado_resolucion', sql.VarChar(50), estadoResolucion)
      .input('firmado_por', sql.Int, parseInt(firmadoPor))
      .input('firma_url', sql.VarChar(255), firmaUrl)
      .execute('SP_RESOLVER_PERMISO_PRUEBA_MANEJO');

    const response = result.recordset[0];

    if (response.allow === 1) {
      console.log(`✅ Permiso resuelto: ${estadoResolucion}`);
      return res.json({
        success: true,
        message: response.msg,
        data: {
          otId,
          estadoResolucion,
          firmaUrl
        }
      });
    } else {
      console.warn(`⚠️ SP rechazó la resolución: ${response.msg}`);
      return res.status(400).json({
        success: false,
        message: response.msg
      });
    }
  } catch (error) {
    console.error('❌ Error resolviendo permiso de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resolver el permiso de prueba de manejo',
      error: error.message
    });
  }
});

module.exports = router;
