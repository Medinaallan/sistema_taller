const express = require('express');
const { getConnection, sql } = require('../config/database');
const router = express.Router();

/**
 * CONTROLADOR DE VEHÍCULOS 
 * Endpoints para gestión de vehículos usando la base de datos
 * SP: SP_VALIDAR_PLACA_VEHICULO, SP_REGISTRAR_VEHICULO, 
 *     SP_OBTENER_VEHICULOS, SP_EDITAR_VEHICULO
 */

// GET /api/vehicles - Obtener vehículos con filtros opcionales
router.get('/', async (req, res) => {
  console.log('🚗 Obteniendo vehículos:', req.query);
  try {
    const { cliente_id, vehiculo_id, placa, obtener_activos = 1 } = req.query;
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('cliente_id', sql.Int, cliente_id ? parseInt(cliente_id) : null)
      .input('vehiculo_id', sql.Int, vehiculo_id ? parseInt(vehiculo_id) : null)
      .input('placa', sql.VarChar(50), placa || null)
      .input('obtener_activos', sql.Bit, obtener_activos === 'null' ? null : parseInt(obtener_activos))
      .execute('SP_OBTENER_VEHICULOS');
    
    console.log('Vehículos obtenidos:', result.recordset.length);
    res.json({
      success: true,
      data: result.recordset,
      message: `${result.recordset.length} vehículos encontrados`
    });
  } catch (error) {
    console.error('Error obteniendo vehículos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener vehículos',
      error: error.message
    });
  }
});

// POST /api/vehicles/validate-plate - Validar placa de vehículo
router.post('/validate-plate', async (req, res) => {
  console.log('Validando placa:', req.body);
  try {
    const { placa, vehiculo_id } = req.body;
    
    if (!placa) {
      return res.status(400).json({
        success: false,
        message: 'La placa es requerida'
      });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('placa', sql.VarChar(50), placa)
      .input('vehiculo_id', sql.Int, vehiculo_id || null)
      .execute('SP_VALIDAR_PLACA_VEHICULO');
    
    const response = result.recordset[0];
    console.log('Resultado validación placa:', response);
    
    res.json({
      success: response.allow === 1,
      available: response.allow === 1,
      message: response.msg,
      data: response
    });
  } catch (error) {
    console.error('Error validando placa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar la placa',
      error: error.message
    });
  }
});

// POST /api/vehicles - Registrar nuevo vehículo
router.post('/', async (req, res) => {
  console.log('🚗 Registrando vehículo:', req.body);
  try {
    const { 
      cliente_id, clienteId,
      marca, 
      modelo, 
      anio, año,
      placa, 
      color, 
      vin, 
      numero_motor, 
      kilometraje, 
      foto_url 
    } = req.body;
    
    const finalClienteId = cliente_id || clienteId;
    const finalAnio = anio || año;
    
    // Validaciones básicas - Solo campos obligatorios según el SP
    if (!finalClienteId || !marca || !modelo || !finalAnio || !placa) {
      return res.status(400).json({
        success: false,
        message: 'Los campos cliente_id, marca, modelo, anio y placa son obligatorios'
      });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('cliente_id', sql.Int, parseInt(finalClienteId))
      .input('marca', sql.VarChar(50), marca)
      .input('modelo', sql.VarChar(50), modelo)
      .input('anio', sql.SmallInt, parseInt(finalAnio))
      .input('placa', sql.VarChar(50), placa)
      .input('color', sql.VarChar(50), color || null)
      .input('vin', sql.VarChar(50), vin || null)
      .input('numero_motor', sql.VarChar(50), numero_motor || null)
      .input('kilometraje', sql.Int, kilometraje ? parseInt(kilometraje) : null)
      .input('foto_url', sql.VarChar(255), foto_url || null)
      .execute('SP_REGISTRAR_VEHICULO');
    
    const response = result.recordset[0];
    console.log('Resultado registro vehículo:', response);
    
    if (response.msg === '200 OK') {
      res.status(201).json({
        success: true,
        data: {
          vehiculo_id: response.vehiculo_id,
          cliente_id: finalClienteId,
          marca,
          modelo,
          anio: finalAnio,
          placa,
          color,
          vin,
          numero_motor,
          kilometraje,
          foto_url
        },
        message: 'Vehículo registrado exitosamente'
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.msg || 'Error al registrar el vehículo',
        data: response
      });
    }
  } catch (error) {
    console.error('Error registrando vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el vehículo',
      error: error.message
    });
  }
});

// PUT /api/vehicles/:id - Actualizar vehículo existente
router.put('/:id', async (req, res) => {
  console.log('🚗 Actualizando vehículo:', req.params.id, req.body);
  try {
    const vehiculo_id = parseInt(req.params.id);
    const { 
      marca, 
      modelo, 
      anio, año,
      placa, 
      color, 
      vin, 
      numero_motor, 
      kilometraje, 
      foto_url 
    } = req.body;
    
    if (isNaN(vehiculo_id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de vehículo inválido'
      });
    }
    
    const finalAnio = anio || año;
    
    // Validaciones básicas - Solo campos obligatorios según el SP
    if (!marca || !modelo || !finalAnio || !placa) {
      return res.status(400).json({
        success: false,
        message: 'Los campos marca, modelo, anio y placa son obligatorios'
      });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('vehiculo_id', sql.Int, vehiculo_id)
      .input('marca', sql.VarChar(50), marca)
      .input('modelo', sql.VarChar(50), modelo)
      .input('anio', sql.SmallInt, parseInt(finalAnio))
      .input('placa', sql.VarChar(50), placa)
      .input('color', sql.VarChar(50), color || null)
      .input('vin', sql.VarChar(50), vin || null)
      .input('numero_motor', sql.VarChar(50), numero_motor || null)
      .input('kilometraje', sql.Int, kilometraje ? parseInt(kilometraje) : null)
      .input('foto_url', sql.VarChar(255), foto_url || null)
      .execute('SP_EDITAR_VEHICULO');
    
    const response = result.recordset[0];
    console.log('Resultado actualización vehículo:', response);
    
    if (response.msg === '200 OK' || response.allow === 1) {
      res.json({
        success: true,
        data: {
          vehiculo_id,
          marca,
          modelo,
          anio: finalAnio,
          placa,
          color,
          vin,
          numero_motor,
          kilometraje,
          foto_url
        },
        message: 'Vehículo actualizado exitosamente'
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.msg || 'Error al actualizar el vehículo',
        data: response
      });
    }
  } catch (error) {
    console.error('Error actualizando vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el vehículo',
      error: error.message
    });
  }
});

// GET /api/vehicles/client/:clientId - Obtener vehículos de un cliente específico
router.get('/client/:clientId', async (req, res) => {
  console.log('Obteniendo vehículos del cliente:', req.params.clientId);
  try {
    const cliente_id = parseInt(req.params.clientId);
    
    if (isNaN(cliente_id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cliente inválido'
      });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('cliente_id', sql.Int, cliente_id)
      .input('vehiculo_id', sql.Int, null)
      .input('placa', sql.VarChar(50), null)
      .input('obtener_activos', sql.Bit, 1)
      .execute('SP_OBTENER_VEHICULOS');
    
    console.log(`Vehículos del cliente ${cliente_id}:`, result.recordset.length);
    res.json({
      success: true,
      data: result.recordset,
      message: `${result.recordset.length} vehículos encontrados para el cliente`
    });
  } catch (error) {
    console.error('Error obteniendo vehículos del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los vehículos del cliente',
      error: error.message
    });
  }
});

module.exports = router;