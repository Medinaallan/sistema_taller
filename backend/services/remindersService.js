const fs = require('fs').promises;
const path = require('path');

const REMINDERS_FILE = path.join(__dirname, '../data/reminders.json');

// Asegurar que el archivo existe
async function ensureFile() {
  try {
    await fs.access(REMINDERS_FILE);
  } catch {
    await fs.writeFile(REMINDERS_FILE, JSON.stringify([], null, 2));
  }
}

// Leer todos los recordatorios
async function getAllReminders() {
  await ensureFile();
  const data = await fs.readFile(REMINDERS_FILE, 'utf8');
  return JSON.parse(data);
}

// Guardar recordatorios
async function saveReminders(reminders) {
  await fs.writeFile(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
}

// Obtener recordatorios por cliente
async function getRemindersByClient(clientId) {
  const reminders = await getAllReminders();
  return reminders.filter(r => r.clientId === clientId);
}

// Crear recordatorio
async function createReminder(reminderData) {
  const reminders = await getAllReminders();
  
  const newReminder = {
    id: Date.now().toString(),
    vehicleId: reminderData.vehicleId || null,
    clientId: reminderData.clientId,
    type: reminderData.type,
    title: reminderData.title,
    description: reminderData.description || '',
    triggerValue: reminderData.triggerValue,
    currentValue: reminderData.currentValue || null,
    isActive: true,
    isCompleted: false,
    services: reminderData.services || [],
    notificationSent: false,
    createdAt: new Date().toISOString(),
    triggerDate: reminderData.type === 'date' ? reminderData.triggerValue : null,
    createdBy: reminderData.createdBy || null
  };
  
  reminders.push(newReminder);
  await saveReminders(reminders);
  
  return newReminder;
}

// Actualizar recordatorio
async function updateReminder(id, updateData) {
  const reminders = await getAllReminders();
  const index = reminders.findIndex(r => r.id === id);
  
  if (index === -1) {
    throw new Error('Recordatorio no encontrado');
  }
  
  reminders[index] = {
    ...reminders[index],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  await saveReminders(reminders);
  return reminders[index];
}

// Eliminar recordatorio
async function deleteReminder(id) {
  const reminders = await getAllReminders();
  const filteredReminders = reminders.filter(r => r.id !== id);
  
  if (reminders.length === filteredReminders.length) {
    throw new Error('Recordatorio no encontrado');
  }
  
  await saveReminders(filteredReminders);
  return { message: 'Recordatorio eliminado correctamente' };
}

// Marcar como completado
async function completeReminder(id) {
  return await updateReminder(id, { 
    isCompleted: true, 
    completedAt: new Date().toISOString() 
  });
}

// Alternar estado activo
async function toggleReminderActive(id) {
  const reminders = await getAllReminders();
  const reminder = reminders.find(r => r.id === id);
  
  if (!reminder) {
    throw new Error('Recordatorio no encontrado');
  }
  
  return await updateReminder(id, { isActive: !reminder.isActive });
}

// Marcar notificación como enviada
async function markNotificationSent(id) {
  return await updateReminder(id, { 
    notificationSent: true,
    lastNotificationSent: new Date().toISOString()
  });
}

// Obtener recordatorios próximos a vencer
async function getUpcomingReminders(daysAhead = 7) {
  const reminders = await getAllReminders();
  const now = new Date();
  const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
  
  return reminders.filter(r => {
    if (!r.isActive || r.isCompleted) return false;
    
    if (r.type === 'date') {
      const triggerDate = new Date(r.triggerValue);
      return triggerDate >= now && triggerDate <= futureDate;
    }
    
    return false; // Para recordatorios de kilometraje necesitaríamos comparar con datos de vehículos
  });
}

// Obtener recordatorios vencidos
async function getExpiredReminders() {
  const reminders = await getAllReminders();
  const now = new Date();
  
  return reminders.filter(r => {
    if (!r.isActive || r.isCompleted) return false;
    
    if (r.type === 'date') {
      const triggerDate = new Date(r.triggerValue);
      return triggerDate < now;
    }
    
    return false;
  });
}

module.exports = {
  getAllReminders,
  getRemindersByClient,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
  toggleReminderActive,
  markNotificationSent,
  getUpcomingReminders,
  getExpiredReminders
};
