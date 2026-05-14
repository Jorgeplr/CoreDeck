# CoreDesk — Plan de mejoras

Fecha: 2026-05-14
Estado del repo en el que se basa: rama `development`, schema Prisma actual, ~30 endpoints en `packages/api`.

El plan está ordenado de **mayor impacto / menor esfuerzo** a **menor impacto / mayor esfuerzo**. Cada bloque incluye motivación y una pista de implementación concreta.

---

## 0. Documentación de API (acabamos de añadirla)

- `GET /api/docs` → spec OpenAPI 3.1 JSON, generado desde los schemas Zod existentes.
- `GET /api/docs/ui` → UI Scalar (vía CDN, sin coste de bundle).
- Fuente única: [packages/api/src/lib/openapi.ts](packages/api/src/lib/openapi.ts) reutiliza [validation.ts](packages/api/src/lib/validation.ts) → no hay riesgo de drift entre spec y validación.

**Siguiente paso recomendado:** proteger `/api/docs*` con un flag (`ENABLE_API_DOCS=true`) en producción o restringirlo a usuarios autenticados con rol admin.

---

## 1. Seguridad (prioritario)

### 1.1 Migraciones de base de datos formales
El log de memoria indica que el último deploy se hizo con `prisma db push` (sin generar migraciones). Para producción:
- Ejecutar `prisma migrate dev --name baseline` en local sobre una BD limpia.
- Reemplazar `db:push` por `db:migrate` / `db:deploy` en el flujo de despliegue.
- Añadir job en CI que compruebe que el schema y las migraciones están sincronizados (`prisma migrate diff --exit-code`).

### 1.2 Rate-limit distribuido
Hoy `rateLimiter.ts` es in-memory: con varias réplicas detrás de un balanceador el límite se evade trivialmente. Ya hay dependencia de `@upstash/redis` instalada.
- Mover `checkRateLimit` a Redis (`INCR` + `EXPIRE`).
- Aplicar también a: `verify-email`, `resend-verification`, `groups/join`, `attachments POST`.

### 1.3 Cabeceras de seguridad
Añadir en [next.config.ts](packages/api/next.config.ts):
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` mínima.
- En el frontend (Vite/nginx), `Content-Security-Policy` con `default-src 'self'`.

### 1.4 Refresh tokens
- Rotación: emitir un nuevo refresh en cada `/auth/refresh` y revocar el anterior (detecta reutilización → invalida toda la cadena del usuario).
- Hash en BD: hoy parece guardarse el token plano (`@unique`). Guardar `sha256(token)` para que un dump de BD no permita secuestrar sesiones.

### 1.5 Vault
- Cambiar derivación a **Argon2id** (parámetros mínimos: 64 MB, 3 iter, 4 lanes). PBKDF2 sigue siendo aceptable pero Argon2 es el estándar moderno.
- En cliente, derivar una **clave de cifrado** distinta de la del login (HKDF a partir del mismo material) para que el servidor jamás pueda derivar la clave del vault aunque vea la contraseña.
- Añadir **versión de cifrado** (`encVersion: int`) en `VaultEntry` para migrar parámetros en el futuro sin romper entradas viejas.

### 1.6 Subida de adjuntos
- Validar `mimeType` contra una allow-list (rechazar `text/html`, SVG, ejecutables).
- Re-derivar el filename de almacenamiento con un UUID + extensión validada (no usar `originalName`).
- Servir descargas con `Content-Disposition: attachment; filename="..."` y `X-Content-Type-Options: nosniff`.
- Considerar S3-compatible storage (R2/MinIO) en lugar de disco local: facilita escalar y backup.

### 1.7 Auditoría y logs
- Loguear en estructura JSON con `pino` y un `requestId` por petición (middleware Next).
- Tabla `audit_log` para acciones sensibles: login, password change, vault export, group role change, ticket delete.

---

## 2. Calidad de código y arquitectura

### 2.1 Capa de servicio
Las rutas mezclan validación, autorización, queries Prisma y serialización. Extraer una carpeta `src/services/` con:
- `ticketService.create(userId, dto)`
- `vaultService.list(userId, filter)`
- `groupService.assertCanAccess(userId, groupId, requiredRole)`

Beneficios: testeable sin Next, evita duplicar `canAccess*` helpers, base limpia para una futura gRPC/RPC interna.

### 2.2 Tipos compartidos
Crear `packages/shared` (TS-only) con:
- Tipos Zod del schema (los de `validation.ts`)
- Enums (`TicketStatus`, etc.) re-exportados de Prisma
- Helper `apiClient` tipado generado desde el OpenAPI (con `openapi-typescript` + `openapi-fetch`)

El frontend deja de duplicar interfaces y consume el cliente tipado.

### 2.3 Errores estandarizados
Hoy cada endpoint devuelve `{ error: string | flatten }` con códigos inconsistentes. Definir:
```ts
type ApiError = { code: string; message: string; details?: unknown }
```
con `code` enumerado (`AUTH_INVALID`, `RATE_LIMITED`, `FORBIDDEN_GROUP_ACCESS`, ...) y un helper `apiError(code, status, details?)`.

### 2.4 Tests
No hay tests. Mínimo viable:
- **Vitest** en `packages/api` para servicios puros (validation, rateLimiter, openapi spec generación).
- **Supertest** o un client fetch contra Next en modo test para endpoints críticos: login, register, vault CRUD, ticket CRUD, group join (race condition).
- Un test de **contrato OpenAPI**: cargar el spec y validar que cada respuesta de los endpoints cumple su schema (`openapi-response-validator`).

### 2.5 Lint y formato
Añadir en root: `eslint` + `prettier` + `husky` + `lint-staged`. El CI ya hace typecheck del `app`; añadir el `api` también.

---

## 3. Rendimiento

### 3.1 Paginación real
Endpoints como `/flow/tickets`, `/context/notes`, `/vault` aceptan `limit/offset` (o no). Estandarizar:
- Cursor-based pagination (`cursor=<id>&limit=50`) para tickets/notes.
- Respuesta envuelta: `{ items: [...], nextCursor: string | null, total?: number }`.

### 3.2 N+1 y `include`
`flow/tickets GET` hace `include` de `createdBy`, `assignedTo`, `labels.label`, `_count`. Para listados con cientos de tickets:
- Devolver IDs y dejar que el cliente cachee usuarios.
- O usar `select` explícito en cada relación y un dataloader si hace falta.

### 3.3 Índices
Revisar índices Prisma. Faltan al menos:
- `Ticket(@@index([dueDate]))` para vencimientos del cron.
- `Ticket(@@index([groupId, status]))` compuesto (filtros típicos del Kanban).
- `Attachment(@@index([uploadedById]))`.
- `Note(@@index([groupId, updatedAt]))`.

### 3.4 Cache de búsqueda
`/api/search` probablemente hace LIKE %q% en varias tablas. Considerar:
- MySQL `FULLTEXT INDEX` sobre `tickets.title/description`, `notes.title/content`.
- O delegar a Meilisearch/Typesense si el volumen crece.

---

## 4. Funcionalidades nuevas

### 4.1 Notificaciones
- WebPush o canal en tiempo real (Pusher / Ably / WebSocket en un proceso aparte).
- Centro de notificaciones in-app (tabla `Notification` con `read/unread`).
- Tipos: ticket asignado, mención, recordatorio vencido, comentario en mis tickets.

### 4.2 Time-tracking en tickets
Modelo `TimeEntry { ticketId, userId, startedAt, endedAt, durationSec }`. Botón "Iniciar/Detener" en `TicketDetail`. Sumarios en dashboard.

### 4.3 Subtareas / dependencias
`Ticket.parentId` (self relation) o tabla `TicketDependency(blockerId, blockedId)`. Permite roadmaps reales.

### 4.4 SLAs y respuesta esperada
Por grupo/prioridad: tiempo objetivo de primera respuesta y de resolución. Cron compara y marca `slaBreached`.

### 4.5 Exportar / importar
- Vault: export cifrado (KDBX o JSON con la misma key del usuario).
- Tickets: CSV/Markdown por filtro actual.

### 4.6 Integraciones
- Webhooks salientes en eventos de ticket (`ticket.created`, `ticket.status_changed`).
- Comandos Slack/Discord (`/coredesk new …`).
- Email-to-ticket: forwardear a una dirección crea ticket en el grupo correspondiente.

### 4.7 Editor enriquecido en notas y comentarios
Hoy `content` es texto plano. Migrar a TipTap (ProseMirror) + serialización a HTML + sanitización con DOMPurify. Soporta menciones, código y embebidos.

### 4.8 Permisos finos en vault
Compartir una entrada concreta de vault con un sub-conjunto del grupo (no todos los miembros). Requiere re-cifrar con clave del destinatario (sealed-box estilo Bitwarden).

---

## 5. DevOps e infraestructura

### 5.1 CI más robusto
Añadir al workflow existente:
- `prisma validate` + `prisma migrate diff --exit-code`.
- Tests (cuando existan) en una BD MySQL del action service.
- Lint.
- Build de Docker images con tag por SHA, push a registry.

### 5.2 Observabilidad
- OpenTelemetry → tracing distribuido (Next API + cron worker).
- Métricas Prometheus en `/metrics` (latencia por endpoint, rate-limit hits, queue del cron).
- Sentry para errores (Next + frontend).

### 5.3 Cron worker
Hoy hay un proceso aparte (`cronWorker.ts`). Sugerencias:
- Hacer idempotente con `CronLock` (ya existe el modelo, validar uso).
- Métricas: cuántos tickets se generaron por regla, último ejecución exitosa.
- Healthcheck endpoint que falle si `lastRun > now - 2*interval`.

### 5.4 Secrets y configuración
- Validar variables de entorno al arranque con Zod (`env.ts`) — fallar rápido si falta `JWT_SECRET`.
- Rotación de `JWT_SECRET`: soportar `JWT_SECRETS=secret1,secret2` y validar contra cualquiera, firmar con el primero.

### 5.5 Backups
- Dump cifrado de MySQL a S3 cada 6 h.
- Backup de `UPLOAD_DIR` (o moverlo a S3 ya, ver 1.6).
- Probar restore una vez por trimestre.

---

## 6. UX del frontend (orientativo)

- **Atajos de teclado** documentados (ya hay `Ctrl+K` para search): `c` nuevo ticket, `g f` ir a flow, `?` abrir cheatsheet.
- **Vista calendario** para tickets con `dueDate` y recordatorios.
- **Bulk actions** en el table view (cambiar status/prioridad a varios tickets).
- **Modo offline** básico para notas (IndexedDB + sync al volver).
- **Onboarding** la primera vez: tour de 4 pasos (crear grupo → invitar → primer ticket → vault).
- **Accesibilidad**: auditoría con axe-core, focus management en modales, contraste AA.

---

## Priorización sugerida (siguientes 4–6 semanas)

| Semana | Foco |
|--------|------|
| 1 | Migraciones formales, rate-limit en Redis, validación env con Zod, baseline de tests |
| 2 | Capa de servicio (auth+groups+tickets), errores estandarizados, cabeceras de seguridad |
| 3 | `packages/shared` + cliente API tipado en frontend, paginación cursor en tickets/notas |
| 4 | Refresh token rotation + hash, Argon2id en vault, audit log |
| 5 | Notificaciones in-app + WebPush, webhooks salientes |
| 6 | Editor enriquecido, time-tracking, CI con tests integración |

---

## Lo que no haría (por ahora)

- **Microservicios**: el monolito Next.js cubre todo el dominio sin fricción. Separar solo si el cron worker o las notificaciones empiezan a ahogar el API.
- **Reescribir el frontend en SSR**: el SPA actual sirve bien al caso de uso (herramienta interna). Migrar a Next sólo si SEO o tiempo de primera carga se vuelven críticos.
- **GraphQL**: el OpenAPI generado ya da tipado fuerte cliente-servidor. GraphQL añadiría complejidad sin caso de uso claro.
