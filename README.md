# Chat API — API REST de chat simulada

API REST construida en N capaz con  Node.js + Express que simula el backend de una aplicación de chat. Permite registrar usuarios, enviar mensajes (texto e imágenes simuladas) y gestionar el ciclo de vida de llamadas (audio/video) entre dos usuarios.

> ⚠️ **Importante:** Esta es una **API simulada con fines de practicar node.js**. No envía mensajes en tiempo real, no transmite audio/video real y no persiste datos al reiniciar el servidor. Al final del documento se explica cómo evolucionarla a una versión de producción.

---

## 📋 Tabla de contenidos

- [¿Qué es esta API?](#qué-es-esta-api)
- [¿Qué puede hacer?](#qué-puede-hacer)
- [¿Qué NO puede hacer (por ser simulada)?](#qué-no-puede-hacer-por-ser-simulada)
- [Arquitectura](#arquitectura)
- [Tecnologías usadas](#tecnologías-usadas)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Cómo ejecutar](#cómo-ejecutar)
- [Endpoints](#endpoints)
- [Ejemplos de uso](#ejemplos-de-uso)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Limitaciones conocidas](#limitaciones-conocidas)
- [Cómo evolucionar a producción](#cómo-evolucionar-a-producción)
- [Licencia](#licencia)

---

## ¿Qué es esta API?

Es una **simulación funcional de un backend de chat**. Está pensada para:

- Aprender cómo se diseña una API REST con autenticación JWT.
- Entender la **arquitectura en capas** (routes → controllers → services → repositories).
- Practicar la lógica de negocio de un chat sin necesidad de infraestructura compleja (WebSockets, WebRTC, base de datos).

Todos los datos viven **en memoria** (arrays de JavaScript). Cuando reinicias el servidor, se borran. Esto es intencional: permite probar la API sin instalar nada.

**No es un producto listo para producción.** Es una base sólida de aprendizaje que puedes extender.

---

## ¿Qué puede hacer?

### Autenticación
- ✅ Registrar usuarios con nombre, email y contraseña (hasheada con bcrypt).
- ✅ Iniciar sesión y obtener un token JWT válido por 4 horas.
- ✅ Proteger todas las rutas de chat y llamadas con JWT.

### Mensajería 1 a 1
- ✅ Listar todos los contactos disponibles (todos los usuarios excepto tú).
- ✅ Enviar mensajes de texto.
- ✅ Enviar "imágenes" (representadas por una URL, tipo `https://.../foto.jpg`).
- ✅ Ver la conversación completa entre dos usuarios (mensajes en ambas direcciones, ordenados por fecha).
- ✅ Ver cuántos mensajes no leídos tienes.
- ✅ Marcar mensajes como leídos automáticamente al abrir una conversación.

### Llamadas (señalización)
- ✅ Iniciar una llamada (audio o video) hacia otro usuario.
- ✅ Aceptar, rechazar o finalizar una llamada.
- ✅ Calcular automáticamente la duración de la llamada.
- ✅ Ver el historial de llamadas.
- ✅ Validar que solo los participantes de una llamada puedan cambiar su estado.

### Seguridad
- ✅ Contraseñas hasheadas con bcrypt (nunca se guardan en texto plano).
- ✅ JWT firmado con clave secreta en `.env`.
- ✅ El remitente de un mensaje o el que inicia una llamada **siempre** se extrae del token, nunca del cuerpo de la petición.
- ✅ Validaciones de negocio (no puedes enviarte mensajes a ti mismo, no puedes llamarte a ti mismo, etc.).

---

## ¿Qué NO puede hacer (por ser simulada)?

| Limitación | ¿Por qué? | Cómo se resuelve en producción |
|-----------|----------|-------------------------------|
| **Mensajes en tiempo real** | La API es REST, no WebSocket. El receptor debe consultar (`GET`) para ver si le llegó algo. | Integrar **Socket.io** |
| **Llamadas de audio/video reales** | WebRTC necesita conexión peer-to-peer entre navegadores. Esta API solo registra el ciclo de vida de la llamada (señalización). | WebRTC en el cliente + Socket.io para señalización |
| **Subida de archivos reales** | Las "fotos" son solo URLs que el cliente debe alojar aparte. No hay almacenamiento. | `multer` + Cloudinary / S3 / disco |
| **Persistencia de datos** | Los datos están en arrays en memoria. Al reiniciar el servidor, todo se pierde. | MongoDB / PostgreSQL |
| **Indicador de "en línea"** | No hay WebSocket que detecte conexiones activas. | Socket.io con eventos `connect` / `disconnect` |
| **Cifrado extremo a extremo** | Los mensajes se guardan en texto plano en el array. | Signal Protocol / libsodium |
| **Grupos o chats múltiples** | Solo soporta conversaciones 1 a 1. | Modelo de `Conversation` con N participantes |
| **Notificaciones push** | No hay integración con servicios de notificación. | Firebase Cloud Messaging / APNs |
| **Rate limiting** | No hay protección contra spam o fuerza bruta. | `express-rate-limit` |

---

## Arquitectura

La API sigue una **arquitectura en capas** (Layered Architecture):

```
Cliente HTTP
    │
    ▼
┌──────────────────────────┐
│  Routes                  │  ← Define URLs y middlewares
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Controllers             │  ← Traduce HTTP ↔ negocio
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Services                │  ← Lógica de negocio (validaciones)
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Repositories            │  ← Acceso a datos (arrays)
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  db.js (arrays en RAM)   │  ← Datos simulados
└──────────────────────────┘
```

**Regla de oro:** cada capa solo habla con la de abajo. Nunca se salta capas. Los controladores no tocan la "base de datos" directamente, y los repositorios no tienen lógica de negocio.

### Roles de cada capa

| Capa | Responsabilidad | Lo que NO hace |
|------|----------------|----------------|
| **Routes** | Mapear URL → controlador, aplicar middlewares | Lógica, validaciones |
| **Controllers** | Extraer datos del `req`, llamar al servicio, devolver `res` con código HTTP | Acceso a datos, reglas de negocio |
| **Services** | Validar reglas de negocio, generar IDs, hashear contraseñas, calcular duraciones | Tocar `req`, `res`, ni el array de datos |
| **Repositories** | Leer, crear, actualizar en el array `db.js` | Validaciones, lógica de negocio |
| **Middlewares** | Autenticación JWT (verificar token, inyectar `req.user`) | Lógica de negocio |

---

## Tecnologías usadas

| Tecnología | Para qué |
|-----------|---------|
| **Node.js** (v18+) | Entorno de ejecución |
| **Express** | Framework HTTP |
| **jsonwebtoken** | Generar y verificar JWT |
| **bcryptjs** | Hash de contraseñas |
| **dotenv** | Variables de entorno |
| **crypto** (nativo) | Generar UUIDs (`crypto.randomUUID()`) |
| **nodemon** (dev) | Reinicio automático en desarrollo |

---

## Instalación

### 1. Clonar o descargar el proyecto

```bash
git clone <url-del-repo> chat-api
cd chat-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear el archivo `.env`

Copia la plantilla y rellena los valores:

```bash
cp .env.example .env
```

Edita `.env`:

```env
PORT=3001
JWT_SECRET=cambia_esto_por_una_clave_larga_y_aleatoria
```

> 🔒 **Nunca subas `.env` a Git.** Ya está en `.gitignore`.

---

## Variables de entorno

| Variable | Obligatoria | Descripción | Ejemplo |
|----------|------------|-------------|---------|
| `PORT` | No | Puerto donde corre el servidor (default `3001`) | `3001` |
| `JWT_SECRET` | **Sí** | Clave secreta para firmar/verificar tokens. Debe ser larga y aleatoria. | `chat_secreto_super_seguro_2026` |

Si `JWT_SECRET` falta, el login **fallará** con error `secretOrPrivateKey must have a value`.

---

## Cómo ejecutar

### Desarrollo (con reinicio automático)

```bash
npm run dev
```

### Producción (sin nodemon)

```bash
npm start
```

Verás en consola:

```
Chat API corriendo en http://localhost:3001
```

---

## Endpoints

### 🔓 Públicos (no requieren token)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/register` | Registrar un usuario |
| `POST` | `/auth/login` | Iniciar sesión y obtener JWT |

### 🔒 Protegidos (requieren `Authorization: Bearer <token>`)

#### Chat

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/chat/contacts` | Listar todos los usuarios (excepto yo) |
| `GET` | `/chat/unread` | Mensajes no leídos |
| `GET` | `/chat/conversation/:userId` | Conversación con un usuario (marca como leídos) |
| `POST` | `/chat/messages` | Enviar un mensaje |

#### Llamadas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/calls` | Iniciar una llamada |
| `PATCH` | `/calls/:id` | Actualizar estado (accepted / rejected / ended) |
| `GET` | `/calls/history` | Historial de llamadas |

---

## Ejemplos de uso

### 1. Registrar usuario

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@test.com","password":"123456"}'
```

**Respuesta:**
```json
{
  "id": "a1b2c3d4-...",
  "name": "Ana",
  "email": "ana@test.com"
}
```

### 2. Login (guarda el token)

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@test.com","password":"123456"}'
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "a1b2...", "name": "Ana", "email": "ana@test.com" }
}
```

### 3. Listar contactos

```bash
curl http://localhost:3001/chat/contacts \
  -H "Authorization: Bearer <TOKEN>"
```

### 4. Enviar mensaje de texto

```bash
curl -X POST http://localhost:3001/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"receiverId":"<ID_DESTINATARIO>","content":"Hola!","type":"text"}'
```

### 5. Enviar "foto" (URL simulada)

```bash
curl -X POST http://localhost:3001/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"receiverId":"<ID_DESTINATARIO>","content":"https://picsum.photos/200","type":"image"}'
```

### 6. Ver conversación

```bash
curl http://localhost:3001/chat/conversation/<ID_OTRO_USUARIO> \
  -H "Authorization: Bearer <TOKEN>"
```

### 7. Iniciar llamada de video

```bash
curl -X POST http://localhost:3001/calls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"receiverId":"<ID_DESTINATARIO>","type":"video"}'
```

### 8. Aceptar llamada (desde la cuenta del receptor)

```bash
curl -X PATCH http://localhost:3001/calls/<ID_LLAMADA> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_RECEPTOR>" \
  -d '{"status":"accepted"}'
```

### 9. Finalizar llamada

```bash
curl -X PATCH http://localhost:3001/calls/<ID_LLAMADA> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"status":"ended"}'
```

---

## Estructura del proyecto

```
chat-api/
├── src/
│   ├── routes/
│   │   ├── authRoutes.js          # POST /auth/register, /auth/login
│   │   ├── chatRoutes.js          # Endpoints de mensajería
│   │   └── callRoutes.js          # Endpoints de llamadas
│   ├── controllers/
│   │   ├── authController.js      # Traduce HTTP ↔ authService
│   │   ├── chatController.js      # Traduce HTTP ↔ chatService
│   │   └── callController.js      # Traduce HTTP ↔ callService
│   ├── services/
│   │   ├── authService.js         # Registro, login, JWT, bcrypt
│   │   ├── chatService.js         # Envío de mensajes, conversaciones
│   │   └── callService.js         # Ciclo de vida de llamadas
│   ├── repositories/
│   │   ├── db.js                  # Arrays en memoria (la "BD")
│   │   ├── userRepository.js      # CRUD de usuarios
│   │   ├── messageRepository.js   # CRUD de mensajes
│   │   └── callRepository.js      # CRUD de llamadas
│   ├── middlewares/
│   │   └── authMiddleware.js      # Verifica JWT
│   ├── config/                    # (reservado para configuración futura)
│   ├── app.js                     # Ensambla Express (sin escuchar)
│   └── server.js                  # Inicia el servidor
├── node_modules/                  # Dependencias (no va a Git)
├── .env                           # Secretos reales (no va a Git)
├── .env.example                   # Plantilla (sí va a Git)
├── .gitignore
├── package.json
└── package-lock.json
```

---

## Limitaciones conocidas

Además de las ya mencionadas (tiempo real, WebRTC, persistencia), esta API tiene:

1. **No hay paginación** en conversaciones ni historial. Si hay 10 000 mensajes, todos se devuelven de una vez. → Agregar `?page=1&limit=50`.
2. **No hay borrado de mensajes**. → Agregar `DELETE /chat/messages/:id`.
3. **No hay edición de mensajes**. → Agregar `PATCH /chat/messages/:id`.
4. **No hay búsqueda de usuarios**. → Agregar `GET /chat/contacts?q=ana`.
5. **No hay bloqueo de usuarios**. → Agregar modelo `blocked`.
6. **El JWT no se puede revocar** antes de que expire. → Agregar una blacklist en memoria o BD.
7. **No hay validación de formato de email**. → Agregar regex o librería `validator`.
8. **No hay rate limiting**. Cualquiera puede spamear `POST /chat/messages`. → Agregar `express-rate-limit`.
9. **No hay tests automatizados**. → Agregar Jest + Supertest.
10. **No hay logs estructurados**. → Agregar `pino` o `winston`.

---

## Cómo evolucionar a producción

### Paso 1 — Persistencia real

Reemplazar los arrays de `db.js` por MongoDB o PostgreSQL. **Solo cambian los repositorios**, no los servicios ni los controladores. Ese es el beneficio de la arquitectura en capas.

**Ejemplo con MongoDB:**

```javascript
// src/repositories/userRepository.js
const User = require('../models/User'); // modelo de Mongoose

const findByEmail = (email) => User.findOne({ email });
const findById = (id) => User.findById(id);
const create = (user) => User.create(user);
const findAllExcept = (id) => User.find({ _id: { $ne: id } });

module.exports = { findByEmail, findById, create, findAllExcept };
```

Los servicios **no cambian una sola línea**. Siguen llamando `userRepository.findByEmail(email)`.

### Paso 2 — Mensajes en tiempo real con Socket.io

```bash
npm install socket.io
```

En `server.js`, envolver `app` con un servidor HTTP y agregar Socket.io:

```javascript
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server);

io.use((socket, next) => {
  try {
    socket.user = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('No autorizado'));
  }
});

io.on('connection', (socket) => {
  socket.join(socket.user.id);

  socket.on('message:send', (data) => {
    const msg = chatService.sendMessage({
      senderId: socket.user.id,
      receiverId: data.receiverId,
      content: data.content,
      type: data.type
    });
    io.to(data.receiverId).emit('message:new', msg);
  });
});

server.listen(PORT);
```

El receptor recibe el mensaje **al instante**, sin polling.

### Paso 3 — Llamadas reales con WebRTC

WebRTC transmite el audio/video **peer-to-peer** entre navegadores. La API solo hace de **señalización**: intercambia las "ofertas" y "respuestas" SDP entre los dos clientes.

- El frontend usa `RTCPeerConnection` para la conexión.
- La API + Socket.io se usan para intercambiar SDP y candidatos ICE.
- El audio/video **no pasa por tu servidor**, va directo entre navegadores.

### Paso 4 — Subida real de imágenes

```bash
npm install multer
```

```javascript
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/messages/image', authenticate, upload.single('file'), chatController.sendImage);
```

Y guardar el archivo en disco, S3 o Cloudinary, devolviendo la URL pública.

---

## Licencia

MIT — libre para usar, modificar y aprender.

---

## Créditos

Proyecto educativo para aprender **Node.js + Express + JWT + arquitectura en capas**.

No es un producto comercial. No lo uses en producción sin implementar las mejoras listadas arriba.
