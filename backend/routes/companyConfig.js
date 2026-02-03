const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

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

module.exports = router;
