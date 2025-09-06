# Módulo de Chat (Admin <-> Cliente)

Este módulo implementa la base para un sistema de chat en tiempo real usando Socket.IO.

## Componentes principales

- `servicios/chatService.ts`: Encapsula la conexión Socket.IO y estandariza el formato de los mensajes.
- `hooks/useAdminChat.ts`: Maneja estado del lado administrador (lista de clientes, salas, mensajes y búsqueda).
- `paginas/administracion/chat/AdminChatPage.tsx`: Interfaz de dos columnas (lista de clientes + ventana de chat).

## Eventos previstos (alinear con backend futuro)

- `joinRoom`, `leaveRoom`: Para agrupar usuarios por sala (clientId).
- `chat:send` / `chat:mensaje`: Flujo para mensajes individuales.
- `chat:historial`: Respuesta con historial de la sala.
- `chat:notificacion`: Indica nuevos mensajes y conteo no leídos.

Actualmente el backend sólo reemite `chatMessage`, por lo que el servicio adapta la estructura y simula rooms en el cliente.

## Extensiones futuras

1. Persistencia real de historial: implementar endpoint o evento Socket para solicitar historial (`chat:historial:solicitar`).
2. Confirmaciones de lectura: evento `chat:leido` y actualización de campo `leido`.
3. Adjuntos: agregar subida a un endpoint y enviar `archivo_url` en el mensaje.
4. Tiping indicator: eventos `chat:escribiendo`.

## Integración rápida

Añadir la ruta `/admin-chat` ya presente en el layout y renderizar `AdminChatPage`.

## Notas

El sistema evita clases dinámicas Tailwind para asegurar compatibilidad con purge. Ajustar estilos según necesidad.
