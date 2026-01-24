const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const CONFIG_FILE_PATH = path.join(__dirname, '../..', 'src', 'data', 'company-config.json');

// GET - Obtener toda la configuración
router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(data);
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error leyendo configuración:', error);
    res.status(500).json({ success: false, message: 'Error al leer la configuración', error: error.message });
  }
});

// GET - Obtener solo información de la empresa
router.get('/company-info', async (req, res) => {
  try {
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(data);
    res.json({ success: true, data: config.companyInfo });
  } catch (error) {
    console.error('Error leyendo información de empresa:', error);
    res.status(500).json({ success: false, message: 'Error al leer la información' });
  }
});

// GET - Obtener solo configuración de facturación
router.get('/billing-config', async (req, res) => {
  try {
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(data);
    res.json({ success: true, data: config.billingConfig });
  } catch (error) {
    console.error('Error leyendo configuración de facturación:', error);
    res.status(500).json({ success: false, message: 'Error al leer la configuración' });
  }
});

// PUT - Actualizar información de la empresa
router.put('/company-info', async (req, res) => {
  try {
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(data);
    
    config.companyInfo = {
      ...config.companyInfo,
      ...req.body
    };
    
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
    
    res.json({ success: true, message: 'Información de empresa actualizada', data: config.companyInfo });
  } catch (error) {
    console.error('Error actualizando información de empresa:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la información' });
  }
});

// PUT - Actualizar configuración de facturación
router.put('/billing-config', async (req, res) => {
  try {
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(data);
    
    config.billingConfig = {
      ...config.billingConfig,
      ...req.body
    };
    
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
    
    res.json({ success: true, message: 'Configuración de facturación actualizada', data: config.billingConfig });
  } catch (error) {
    console.error('Error actualizando configuración de facturación:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la configuración', error: error.message });
  }
});

// POST - Agregar un nuevo CAI
router.post('/cais', async (req, res) => {
  try {
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(data);
    
    const newCAI = {
      id: `cai-${Date.now()}`,
      ...req.body,
      activo: req.body.activo !== undefined ? req.body.activo : true
    };
    
    config.billingConfig.cais.push(newCAI);
    
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
    
    res.json({ success: true, message: 'CAI agregado exitosamente', data: newCAI });
  } catch (error) {
    console.error('Error agregando CAI:', error);
    res.status(500).json({ success: false, message: 'Error al agregar el CAI' });
  }
});

// PUT - Actualizar un CAI existente
router.put('/cais/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(data);
    
    const index = config.billingConfig.cais.findIndex(cai => cai.id === id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'CAI no encontrado' });
    }
    
    config.billingConfig.cais[index] = {
      ...config.billingConfig.cais[index],
      ...req.body
    };
    
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
    
    res.json({ success: true, message: 'CAI actualizado exitosamente', data: config.billingConfig.cais[index] });
  } catch (error) {
    console.error('Error actualizando CAI:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el CAI' });
  }
});

// DELETE - Eliminar un CAI
router.delete('/cais/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(data);
    
    const initialLength = config.billingConfig.cais.length;
    config.billingConfig.cais = config.billingConfig.cais.filter(cai => cai.id !== id);
    
    if (config.billingConfig.cais.length === initialLength) {
      return res.status(404).json({ success: false, message: 'CAI no encontrado' });
    }
    
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
    
    res.json({ success: true, message: 'CAI eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando CAI:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el CAI' });
  }
});

// PATCH - Activar/Desactivar un CAI
router.patch('/cais/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(data);
    
    const cai = config.billingConfig.cais.find(c => c.id === id);
    
    if (!cai) {
      return res.status(404).json({ success: false, message: 'CAI no encontrado' });
    }
    
    cai.activo = !cai.activo;
    
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
    
    res.json({ 
      success: true, 
      message: `CAI ${cai.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: cai
    });
  } catch (error) {
    console.error('Error toggling CAI:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar el estado del CAI' });
  }
});

// POST - Incrementar número de factura del CAI activo
router.post('/cais/increment-invoice', async (req, res) => {
  try {
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(data);
    
    // Buscar CAI activo para facturas
    const cai = config.billingConfig.cais.find(
      c => c.tipoDocumento === 'factura' && c.activo
    );
    
    if (!cai) {
      return res.status(404).json({ success: false, message: 'No hay CAI activo para facturas' });
    }
    
    // Extraer el número actual
    const match = cai.numeroActual.match(/(\d+)$/);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Formato de número inválido' });
    }
    
    const currentNumber = parseInt(match[1]);
    const nextNumber = currentNumber + 1;
    
    // Formatear con ceros a la izquierda (8 dígitos)
    const nextNumberStr = `FAC-${String(nextNumber).padStart(8, '0')}`;
    
    cai.numeroActual = nextNumberStr;
    
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
    
    res.json({ 
      success: true, 
      message: 'Número de factura incrementado',
      data: { numeroActual: nextNumberStr }
    });
  } catch (error) {
    console.error('Error incrementando número de factura:', error);
    res.status(500).json({ success: false, message: 'Error al incrementar el número' });
  }
});

module.exports = router;
