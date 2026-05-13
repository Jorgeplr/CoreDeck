# CoreDesk

Plataforma de productividad all-in-one con gestión de contraseñas cifradas (E2EE), sistema de tickets/tareas tipo Kanban y recordatorios con notificaciones por email.

---

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Vault** | Gestor de contraseñas con cifrado de extremo a extremo (AES-256-GCM). El servidor **nunca** ve texto plano. |
| **Flow** | Sistema de tickets con estados, prioridades, asignaciones, etiquetas, historial de cambios y vista Kanban con drag & drop. |
| **Context** | Notas en formato Markdown con editor en vivo y recordatorios con alertas visuales y notificaciones por email automáticas. |

---

## Stack Tecnológico

### Frontend (`packages/app/`)
| Tecnología | Rol |
|-----------|-----|
| React 19 + TypeScript | UI |
| Vite 6 | Build tool |
| Bun | Package manager y runtime |
| React Router DOM v7 | Routing |
| TanStack Query v5 | Server state / cache |
| Zustand v5 | Client state (auth, vault key, UI) |
| Tailwind CSS v4 | Estilos |
| Axios | HTTP client con interceptores |
| Web Crypto API | Cifrado E2EE nativo del navegador |
| @uiw/react-md-editor | Editor Markdown con preview en vivo |
| date-fns | Manejo de fechas |
| lucide-react | Iconos |

### Backend (`packages/api/`)
| Tecnología | Rol |
|-----------|-----|
| Next.js 15 | Framework (API routes only, sin SSR) |
| TypeScript | Tipado |
| Prisma v6 | ORM + sistema de migraciones |
| MySQL 8 | Base de datos relacional |
| JWT + httpOnly Cookie | Autenticación (access token + refresh token) |
| bcryptjs | Hash de contraseñas |
| Zod | Validación de schemas |
| Nodemailer | Envío de emails |
| node-cron | Cron jobs para notificaciones |

---

## Estructura del Proyecto

```
CoreDesk/
├── docker-compose.yml          # MySQL 8 (puerto 3308) + shadow DB (puerto 3309)
├── .gitignore
│
├── packages/
│   │
│   ├── api/                    # Backend — Next.js 15 (puerto 3001)
│   │   ├── .env.example
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Fuente única de verdad del esquema DB
│   │   │   ├── seed.ts         # Labels y usuario admin por defecto
│   │   │   └── migrations/     # Generadas automáticamente por Prisma
│   │   │
│   │   └── src/
│   │       ├── middleware.ts   # CORS global para rutas /api
│   │       │
│   │       ├── lib/
│   │       │   ├── prisma.ts       # Singleton de PrismaClient
│   │       │   ├── auth.ts         # JWT sign/verify, refresh token rotation
│   │       │   ├── middleware.ts   # withAuth HOF — protege endpoints
│   │       │   ├── validation.ts   # Schemas Zod para todos los módulos
│   │       │   ├── emailService.ts # Templates y envío con Nodemailer
│   │       │   └── cronJobs.ts     # Cron de notificaciones (cada 15 min)
│   │       │
│   │       └── app/api/
│   │           ├── route.ts                          # GET /api — inicia cron jobs
│   │           ├── auth/
│   │           │   ├── register/route.ts
│   │           │   ├── login/route.ts
│   │           │   ├── refresh/route.ts
│   │           │   └── logout/route.ts
│   │           ├── users/me/route.ts
│   │           ├── groups/
│   │           │   ├── route.ts
│   │           │   └── [groupId]/
│   │           │       ├── route.ts
│   │           │       └── members/route.ts
│   │           ├── vault/
│   │           │   ├── route.ts
│   │           │   └── [entryId]/route.ts
│   │           ├── flow/
│   │           │   ├── tickets/
│   │           │   │   ├── route.ts
│   │           │   │   └── [ticketId]/
│   │           │   │       ├── route.ts
│   │           │   │       └── history/route.ts
│   │           │   └── labels/route.ts
│   │           └── context/
│   │               ├── notes/
│   │               │   ├── route.ts
│   │               │   └── [noteId]/route.ts
│   │               └── reminders/
│   │                   ├── route.ts
│   │                   └── [reminderId]/route.ts
│   │
│   └── app/                    # Frontend — React + Vite (puerto 5173)
│       ├── .env.example
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── index.html
│       ├── public/
│       │   └── favicon.svg
│       │
│       └── src/
│           ├── main.tsx        # Entry point — QueryClient + Router
│           ├── App.tsx         # Rutas y silent refresh al iniciar
│           ├── index.css       # Tailwind v4 + tokens de diseño
│           │
│           ├── types/
│           │   └── index.ts    # Tipos TypeScript globales
│           │
│           ├── lib/
│           │   ├── api.ts      # Axios + interceptor de JWT + silent refresh
│           │   └── crypto.ts   # PBKDF2 → AES-256-GCM (E2EE)
│           │
│           ├── store/
│           │   ├── authStore.ts    # accessToken + user (solo memoria)
│           │   ├── vaultStore.ts   # masterKey CryptoKey (solo memoria)
│           │   └── uiStore.ts      # sidebar + tema (localStorage)
│           │
│           ├── components/
│           │   ├── layout/
│           │   │   ├── AppShell.tsx        # Wrapper sidebar + topbar
│           │   │   ├── Sidebar.tsx         # Navegación + logout
│           │   │   ├── TopBar.tsx          # Tema + avatar de usuario
│           │   │   └── ProtectedRoute.tsx  # Redirecciona si no autenticado
│           │   └── ui/                     # Componentes reutilizables
│           │
│           └── modules/
│               ├── auth/
│               │   ├── api/authApi.ts
│               │   └── pages/
│               │       ├── LoginPage.tsx
│               │       └── RegisterPage.tsx
│               │
│               ├── vault/
│               │   ├── api/vaultApi.ts
│               │   ├── components/
│               │   │   ├── PasswordCard.tsx      # Revela/copia con decrypt
│               │   │   ├── PasswordForm.tsx      # Cifra antes de enviar
│               │   │   └── PasswordGenerator.tsx # Genera + barra de fortaleza
│               │   └── pages/
│               │       ├── VaultPage.tsx         # Lista + búsqueda
│               │       └── VaultUnlockPage.tsx   # Derivación de clave maestra
│               │
│               ├── flow/
│               │   ├── api/flowApi.ts
│               │   ├── components/
│               │   │   ├── KanbanBoard.tsx   # 4 columnas con drag & drop
│               │   │   ├── TicketCard.tsx    # Vista resumida en kanban
│               │   │   └── AuditLog.tsx      # Timeline de cambios
│               │   └── pages/
│               │       ├── FlowPage.tsx
│               │       ├── CreateTicketPage.tsx
│               │       └── TicketDetailPage.tsx
│               │
│               └── context/
│                   ├── api/contextApi.ts
│                   ├── components/
│                   │   ├── ReminderCard.tsx  # Muestra urgencia visual
│                   │   └── ReminderForm.tsx
│                   └── pages/
│                       ├── ContextPage.tsx   # Tabs: Notas / Recordatorios
│                       └── NoteDetailPage.tsx # Editor Markdown en vivo
```

---

## Base de Datos — Esquema

```
users ──────────────────────────────────────────────────────────
  id, email, username, passwordHash, displayName, avatarUrl

refresh_tokens ─────────────────────────────────────────────────
  id, token, userId → users, expiresAt, revoked

groups ─────────────────────────────────────────────────────────
  id, name, slug (unique), description

group_members ──────────────────────────────────────────────────
  userId → users, groupId → groups, role: OWNER | ADMIN | MEMBER

vault_entries ──────────────────────────────────────────────────
  id, title, url, usernameEncrypted, passwordEncrypted,
  notesEncrypted, iv, scope: PERSONAL | GROUP

tickets ────────────────────────────────────────────────────────
  id, title, description, dueDate
  status:   OPEN | IN_PROGRESS | IN_REVIEW | RESOLVED
  priority: CRITICAL | URGENT | NORMAL | LOW
  scope:    INDIVIDUAL | GROUP
  createdById → users, assignedToId → users, groupId → groups

ticket_history ─────────────────────────────────────────────────
  id, ticketId, userId, action, oldValue, newValue

labels + ticket_labels (M:N) ───────────────────────────────────

notes ──────────────────────────────────────────────────────────
  id, title, content (Markdown LongText), isCollaborative,
  userId → users, groupId → groups

reminders ──────────────────────────────────────────────────────
  id, title, description, dueAt, notifiedAt
  status: PENDING | NOTIFIED | DISMISSED | DONE
  userId → users
```

---

## Cómo Iniciar el Proyecto

### Requisitos Previos
- [Bun](https://bun.sh) `>= 1.1`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para MySQL)
- Node.js `>= 20` (usado internamente por Next.js)

---

### 1. Levantar la base de datos

```bash
# Desde la raíz del proyecto
docker compose up -d
```

Esto levanta:
- **MySQL 8** en `localhost:3308` — base de datos `coredesk`
- **MySQL Shadow** en `localhost:3309` — requerido por Prisma para migraciones

Verificar que los contenedores estén corriendo:
```bash
docker compose ps
```

---

### 2. Configurar el Backend

```bash
cd packages/api

# Instalar dependencias
bun install

# Copiar y configurar variables de entorno
cp .env.example .env
```

Editar `.env` con tus valores:

```env
# Base de datos (ya configurada para Docker local)
DATABASE_URL="mysql://coredesk_user:coredesk_pass@localhost:3308/coredesk"
SHADOW_DATABASE_URL="mysql://coredesk_user:coredesk_pass@localhost:3309/coredesk_shadow"

# Auth — generar valores seguros
JWT_SECRET="genera_un_string_aleatorio_de_64_chars"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_DAYS=7

# Email (opcional en desarrollo, requerido para notificaciones)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu@email.com"
SMTP_PASS="tu_app_password"
EMAIL_FROM="CoreDesk <noreply@coredesk.app>"

# CORS
CORS_ORIGIN="http://localhost:5173"
APP_URL="http://localhost:5173"
```

```bash
# Ejecutar la primera migración (crea todas las tablas)
bunx prisma migrate dev --name init

# Cargar datos iniciales (labels + usuario admin)
bunx prisma db seed

# Iniciar el servidor de desarrollo
bun run dev
```

El backend queda disponible en **http://localhost:3001**

> **Usuario admin por defecto:**
> - Email: `admin@coredesk.app`
> - Contraseña: `CoreDesk@2024!`
> *(Cámbiala después del primer login)*

---

### 3. Configurar el Frontend

Abre una nueva terminal:

```bash
cd packages/app

# Instalar dependencias
bun install

# Copiar variables de entorno
cp .env.example .env
```

El `.env` del frontend solo necesita:
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=CoreDesk
```

```bash
# Iniciar el servidor de desarrollo
bun run dev
```

El frontend queda disponible en **http://localhost:5173**

---

### Resumen de Comandos

| Comando | Descripción |
|---------|-------------|
| `docker compose up -d` | Levantar MySQL |
| `docker compose down` | Detener MySQL |
| `docker compose down -v` | Detener y borrar datos |
| `bunx prisma migrate dev --name <nombre>` | Crear nueva migración |
| `bunx prisma migrate deploy` | Aplicar migraciones en producción |
| `bunx prisma db seed` | Cargar datos iniciales |
| `bunx prisma studio` | Interfaz visual de la base de datos |
| `bun run dev` (api) | Backend en modo desarrollo |
| `bun run dev` (app) | Frontend en modo desarrollo |
| `bun run cron:worker` | Worker de cron para recordatorios y vencimientos |
| `bun run build` | Build de producción |

---

## Arquitectura de Seguridad — Vault E2EE

El módulo Vault usa cifrado de extremo a extremo real. El flujo completo:

```
1. El usuario ingresa su "contraseña maestra" (nunca se envía al servidor)
        ↓
2. PBKDF2 (SHA-256, 310.000 iteraciones, salt = userId)
        ↓
3. masterKey (CryptoKey AES-256 — vive solo en memoria RAM)
        ↓
4. Al guardar una contraseña:
   AES-256-GCM encrypt(contraseña_plana, masterKey, IV_aleatorio)
        ↓
5. El servidor recibe: { passwordEncrypted, iv } — solo texto cifrado
        ↓
6. Al leer: el cliente descifra localmente con masterKey
```

**El servidor no puede leer ninguna contraseña guardada.**
Si el usuario olvida su contraseña maestra, los datos son irrecuperables por diseño.

---

## Flujo de Autenticación

```
Login exitoso
    ├── accessToken (JWT, 15 min) → almacenado en memoria (Zustand)
    └── refreshToken (opaco, 7 días) → cookie httpOnly SameSite=Strict

Cada request → Axios adjunta Bearer <accessToken>

Si el server devuelve 401:
    → Axios interceptor llama POST /api/auth/refresh automáticamente
    → Si el refresh es válido → nuevo accessToken → reintenta el request original
    → Si el refresh falla → logout + redirect a /login
```

---

## API — Endpoints Disponibles

### Autenticación
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/users/me
PATCH  /api/users/me
```

### Grupos
```
GET    /api/groups
POST   /api/groups
GET    /api/groups/:id
PATCH  /api/groups/:id
DELETE /api/groups/:id
GET    /api/groups/:id/members
POST   /api/groups/:id/members
DELETE /api/groups/:id/members
```

### Vault
```
GET    /api/vault?scope=PERSONAL|GROUP&groupId=
POST   /api/vault
GET    /api/vault/:id
PATCH  /api/vault/:id
DELETE /api/vault/:id
```

### Flow (Tickets)
```
GET    /api/flow/tickets?status=&priority=&scope=&groupId=
POST   /api/flow/tickets
GET    /api/flow/tickets/:id
PATCH  /api/flow/tickets/:id
DELETE /api/flow/tickets/:id
GET    /api/flow/tickets/:id/history
GET    /api/flow/labels
POST   /api/flow/labels
```

### Context (Notas y Recordatorios)
```
GET    /api/context/notes?groupId=
POST   /api/context/notes
GET    /api/context/notes/:id
PATCH  /api/context/notes/:id
DELETE /api/context/notes/:id

GET    /api/context/reminders
POST   /api/context/reminders
GET    /api/context/reminders/:id
PATCH  /api/context/reminders/:id
DELETE /api/context/reminders/:id
```

---

## Variables de Entorno Completas

### `packages/api/.env`
```env
DATABASE_URL="mysql://coredesk_user:coredesk_pass@localhost:3308/coredesk"
SHADOW_DATABASE_URL="mysql://coredesk_user:coredesk_pass@localhost:3309/coredesk_shadow"

JWT_SECRET=""
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_DAYS=7
COOKIE_SECRET=""

NODE_ENV="development"
API_PORT=3001
CORS_ORIGIN="http://localhost:5173"
APP_URL="http://localhost:5173"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="CoreDesk <noreply@coredesk.app>"

REMINDER_CHECK_CRON="*/15 * * * *"
REMINDER_NOTIFY_HOURS_BEFORE=24
CRON_LOCK_TTL_MS=300000

UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
RATE_LIMIT_PREFIX="rate"
```

### `packages/app/.env`
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=CoreDesk
```

---

## Rutas del Frontend

```
/login                    → Inicio de sesión
/register                 → Registro

/vault                    → Lista de contraseñas (requiere desbloqueo)
/vault/unlock             → Formulario de contraseña maestra

/flow                     → Vista Kanban con todos los tickets
/flow/tickets/new         → Crear nuevo ticket
/flow/tickets/:id         → Detalle + cambio de estado + historial

/context                  → Notas y recordatorios (tabs)
/context/notes/:id        → Editor Markdown en vivo
```
