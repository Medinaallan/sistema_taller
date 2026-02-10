const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

/**
 * POST /api/invoice-items/add
 * Agregar un item a una factura en tiempo real (POS)
 * Llama a SP_AGREGAR_ITEM_FACTURA_POS
 */
router.post('/add', async (req, res) => {
  try {
    const {
      factura_id,
      descripcion,
      cantidad,
      precio_final_unitario,
      porcentaje_descuento = 0,
      registrado_por
    } = req.body;

    console.log(`📦 Agregando item a factura ${factura_id}:`, {
      descripcion,
      cantidad,
      precio_final_unitario,
      porcentaje_descuento
    });

    // Validar parámetros requeridos
    if (!factura_id || !descripcion || !cantidad || !precio_final_unitario || !registrado_por) {
      return res.status(400).json({
        success: false,
        message: 'Faltan parámetros requeridos',
        allow: 0
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('factura_id', sql.Int, factura_id)
      .input('descripcion', sql.VarChar(200), descripcion)
      .input('cantidad', sql.Decimal(10, 2), cantidad)
      .input('precio_final_unitario', sql.Decimal(10, 2), precio_final_unitario)
      .input('porcentaje_descuento', sql.Decimal(5, 2), porcentaje_descuento)
      .input('registrado_por', sql.Int, registrado_por)
      .execute('SP_AGREGAR_ITEM_FACTURA_POS');

    const response = result.recordset[0];

    if (response.allow === 1) {
      console.log(`✅ Item agregado exitosamente:`, response.msg);
      res.json({
        success: true,
        message: response.msg || 'Item agregado exitosamente',
        allow: response.allow,
        response: response.response
      });
    } else {
      console.warn(`⚠️ No se pudo agregar item:`, response.msg);
      res.status(400).json({
        success: false,
        message: response.msg || 'No se pudo agregar el item',
        allow: response.allow,
        response: response.response
      });
    }
  } catch (error) {
    console.error('❌ Error agregando item a factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar item a factura',
      error: error.message,
      allow: 0
    });
  }
});

/**
 * PUT /api/invoice-items/edit
 * Editar un item de factura en tiempo real (POS)
 * Llama a SP_EDITAR_ITEM_FACTURA_POS
 */
router.put('/edit', async (req, res) => {
  try {
    const {
      factura_item_id,
      descripcion,
      cantidad,
      precio_final_unitario,
      porcentaje_descuento = 0,
      registrado_por
    } = req.body;

    console.log(`✏️ Editando item ${factura_item_id}:`, {
      descripcion,
      cantidad,
      precio_final_unitario,
      porcentaje_descuento
    });

    // Validar parámetros requeridos
    if (!factura_item_id || !descripcion || !cantidad || !precio_final_unitario || !registrado_por) {
      return res.status(400).json({
        success: false,
        message: 'Faltan parámetros requeridos',
        allow: 0
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('factura_item_id', sql.Int, factura_item_id)
      .input('descripcion', sql.VarChar(200), descripcion)
      .input('cantidad', sql.Decimal(10, 2), cantidad)
      .input('precio_final_unitario', sql.Decimal(10, 2), precio_final_unitario)
      .input('porcentaje_descuento', sql.Decimal(5, 2), porcentaje_descuento)
      .input('registrado_por', sql.Int, registrado_por)
      .execute('SP_EDITAR_ITEM_FACTURA_POS');

    const response = result.recordset[0];

    if (response.allow === 1) {
      console.log(`✅ Item editado exitosamente:`, response.msg);
      res.json({
        success: true,
        message: response.msg || 'Item editado exitosamente',
        allow: response.allow,
        response: response.response
      });
    } else {
      console.warn(`⚠️ No se pudo editar item:`, response.msg);
      res.status(400).json({
        success: false,
        message: response.msg || 'No se pudo editar el item',
        allow: response.allow,
        response: response.response
      });
    }
  } catch (error) {
    console.error('❌ Error editando item de factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al editar item de factura',
      error: error.message,
      allow: 0
    });
  }
});

/**
 * DELETE /api/invoice-items/delete/:factura_item_id
 * Eliminar un item de factura en tiempo real (POS)
 * Llama a SP_ELIMINAR_ITEM_FACTURA_POS
 * Solo permite eliminar items agregados en POS (es_agregado_pos = 1)
 */
router.delete('/delete/:factura_item_id', async (req, res) => {
  try {
    const { factura_item_id } = req.params;
    const { registrado_por } = req.body;

    console.log(`🗑️ Eliminando item ${factura_item_id}...`);

    // Validar parámetros requeridos
    if (!factura_item_id || !registrado_por) {
      return res.status(400).json({
        success: false,
        message: 'Faltan parámetros requeridos',
        allow: 0
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('factura_item_id', sql.Int, parseInt(factura_item_id))
      .input('registrado_por', sql.Int, registrado_por)
      .execute('SP_ELIMINAR_ITEM_FACTURA_POS');

    const response = result.recordset[0];

    if (response.allow === 1) {
      console.log(`✅ Item eliminado exitosamente:`, response.msg);
      res.json({
        success: true,
        message: response.msg || 'Item eliminado exitosamente',
        allow: response.allow,
        response: response.response
      });
    } else {
      console.warn(`⚠️ No se pudo eliminar item:`, response.msg);
      res.status(400).json({
        success: false,
        message: response.msg || 'No se pudo eliminar el item',
        allow: response.allow,
        response: response.response
      });
    }
  } catch (error) {
    console.error('❌ Error eliminando item de factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar item de factura',
      error: error.message,
      allow: 0
    });
  }
});

module.exports = router;
