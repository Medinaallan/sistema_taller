const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

/**
 * POST /api/chat/iniciar-sala
 * Iniciar una sala de chat para una OT
 * Parámetros: ot_id, registrado_por
 */
router.post('/iniciar-sala', async (req, res) => {
  try {
    const { ot_id, registrado_por } = req.body;

    if (!ot_id || !registrado_por) {
      return res.status(400).json({
        success: false,
        error: 'Los parámetros ot_id y registrado_por son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('ot_id', sql.Int, ot_id)
      .input('registrado_por', sql.Int, registrado_por)
      .execute('SP_INICIAR_SALA_CHAT');

    // El SP puede retornar la sala creada o existente
    const data = result.recordset[0] || {};

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error al iniciar sala de chat:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/chat/enviar-mensaje
 * Enviar un mensaje en una sala
 * Parámetros: sala_id, usuario_id, contenido, archivo_url (opcional)
 * Retorna: response, msg, allow, mensaje_id
 */
router.post('/enviar-mensaje', async (req, res) => {
  try {
    const { sala_id, usuario_id, contenido, archivo_url } = req.body;

    if (!sala_id || !usuario_id || !contenido) {
      return res.status(400).json({
        success: false,
        error: 'Los parámetros sala_id, usuario_id y contenido son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('sala_id', sql.Int, sala_id)
      .input('usuario_id', sql.Int, usuario_id)
      .input('contenido', sql.NVarChar(1000), contenido)
      .input('archivo_url', sql.VarChar(255), archivo_url || null)
      .execute('SP_ENVIAR_MENSAJE');

    const data = result.recordset[0] || {};

    res.json({
      success: data.allow === 1,
      response: data.response,
      msg: data.msg,
      allow: data.allow,
      mensaje_id: data.mensaje_id
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/chat/chats-usuario/:usuario_id
 * Obtener todas las salas de chat de un usuario
 * Retorna: lista de salas con último mensaje y conteo de no leídos
 */
router.get('/chats-usuario/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;

    console.log('📋 Solicitando chats para usuario_id:', usuario_id);

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro usuario_id es requerido'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('usuario_id', sql.Int, parseInt(usuario_id))
      .execute('SP_OBTENER_CHATS_USUARIO');

    console.log('✅ SP_OBTENER_CHATS_USUARIO ejecutado. Salas encontradas:', result.recordset.length);
    console.log('📋 Salas:', JSON.stringify(result.recordset, null, 2));

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error('❌ Error al obtener chats del usuario:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/chat/historial-sala/:sala_id
 * Obtener el historial completo de mensajes de una sala
 * Query param: usuario_consultante (requerido)
 * Retorna: lista de mensajes con datos del remitente
 */
router.get('/historial-sala/:sala_id', async (req, res) => {
  try {
    const { sala_id } = req.params;
    const { usuario_consultante } = req.query;

    if (!sala_id || !usuario_consultante) {
      return res.status(400).json({
        success: false,
        error: 'Los parámetros sala_id y usuario_consultante son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('sala_id', sql.Int, parseInt(sala_id))
      .input('usuario_consultante', sql.Int, parseInt(usuario_consultante))
      .execute('SP_OBTENER_HISTORIAL_SALA');

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error('Error al obtener historial de sala:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/chat/marcar-leidos
 * Marcar como leídos los mensajes de una sala
 * Parámetros: sala_id, usuario_id
 * Retorna: response, msg, allow
 */
router.post('/marcar-leidos', async (req, res) => {
  try {
    const { sala_id, usuario_id } = req.body;

    if (!sala_id || !usuario_id) {
      return res.status(400).json({
        success: false,
        error: 'Los parámetros sala_id y usuario_id son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('sala_id', sql.Int, sala_id)
      .input('usuario_id', sql.Int, usuario_id)
      .execute('SP_MARCAR_MENSAJES_LEIDOS');

    const data = result.recordset[0] || {};

    res.json({
      success: data.allow === 1,
      response: data.response,
      msg: data.msg,
      allow: data.allow
    });

  } catch (error) {
    console.error('Error al marcar mensajes como leídos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/chat/agregar-participante
 * Agregar un participante a una sala (ej: mecánico)
 * Parámetros: sala_id, nuevo_usuario_id, registrado_por
 * Retorna: response, msg, allow
 */
router.post('/agregar-participante', async (req, res) => {
  try {
    const { sala_id, nuevo_usuario_id, registrado_por } = req.body;

    if (!sala_id || !nuevo_usuario_id || !registrado_por) {
      return res.status(400).json({
        success: false,
        error: 'Los parámetros sala_id, nuevo_usuario_id y registrado_por son requeridos'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('sala_id', sql.Int, sala_id)
      .input('nuevo_usuario_id', sql.Int, nuevo_usuario_id)
      .input('registrado_por', sql.Int, registrado_por)
      .execute('SP_AGREGAR_PARTICIPANTE_SALA');

    const data = result.recordset[0] || {};

    res.json({
      success: data.allow === 1,
      response: data.response,
      msg: data.msg,
      allow: data.allow
    });

  } catch (error) {
    console.error('Error al agregar participante:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
