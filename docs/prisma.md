# Prisma en CoreDesk (API)

Guia corta para entender como se usa Prisma en este proyecto, incluyendo tablas, migraciones y seed.

## Ubicacion de archivos clave

- Schema: `packages/api/prisma/schema.prisma`
- Migraciones: `packages/api/prisma/migrations/`
- Seed: `packages/api/prisma/seed.ts`
- Config de seed: `packages/api/package.json` (`prisma.seed`)

## Variables de entorno

Prisma lee estas variables desde `.env`:

```env
DATABASE_URL="mysql://coredesk_user:coredesk_pass@localhost:3308/coredesk"
SHADOW_DATABASE_URL="mysql://coredesk_user:coredesk_pass@localhost:3307/coredesk_shadow"
```

Notas:
- El proyecto usa Docker Compose con MySQL en el puerto **3308** (host) y el shadow DB en **3307**.
- Si el contenedor esta arriba y el login falla, revisa que el puerto de `DATABASE_URL` coincida con el mapeo del compose.

## Modelos y tablas

Cada modelo tiene `@@map` para definir el nombre real de la tabla:

- `User` -> `users`
- `RefreshToken` -> `refresh_tokens`
- `Group` -> `groups`
- `GroupMember` -> `group_members`
- `VaultEntry` -> `vault_entries`
- `Ticket` -> `tickets`
- `TicketHistory` -> `ticket_history`
- `Label` -> `labels`
- `TicketLabel` -> `ticket_labels`
- `TicketComment` -> `ticket_comments`
- `Note` -> `notes`
- `Reminder` -> `reminders`

Enums clave:
- `GroupMemberRole`: OWNER | ADMIN | MEMBER
- `VaultEntryScope`: PERSONAL | GROUP
- `TicketStatus`: OPEN | IN_PROGRESS | IN_REVIEW | RESOLVED
- `TicketPriority`: CRITICAL | URGENT | NORMAL | LOW
- `TicketScope`: INDIVIDUAL | GROUP
- `ReminderStatus`: PENDING | NOTIFIED | DISMISSED | DONE

## Migraciones (dev)

1) Modifica `schema.prisma`.
2) Genera y aplica migracion:

```bash
bunx prisma migrate dev --name <descripcion_corta>
```

Esto crea una carpeta en `prisma/migrations/` y aplica el cambio a la DB.

## Migraciones (produccion)

```bash
bunx prisma migrate deploy
```

Usa solo las migraciones ya generadas en `prisma/migrations/`.

## Generar Prisma Client

```bash
bunx prisma generate
```

Se ejecuta automaticamente en varias operaciones, pero puedes correrlo manualmente si cambias el schema.

## Seed de datos

El seed crea:
- Labels por defecto
- Usuario admin

Credenciales por defecto:
- Email: `admin@coredesk.app`
- Password: `CoreDesk@2024!`

Ejecutar seed:

```bash
bunx prisma db seed
```

Si `tsx` no esta en PATH (Windows), usa:

```bash
bunx tsx prisma/seed.ts
```

## Troubleshooting comun

- **No conecta a MySQL**: `docker compose ps` y valida que el puerto en `.env` sea `3308`.
- **Auth failed**: revisa `coredesk_user` / `coredesk_pass` en docker-compose y tu `DATABASE_URL`.
- **Shadow DB**: `SHADOW_DATABASE_URL` debe apuntar al puerto `3307`.
