# CoreDesk

Plataforma de productividad all-in-one con gestion de contrasenas cifradas (E2EE), sistema de tickets/tareas tipo Kanban y recordatorios con notificaciones por email.

## Arquitectura

- Monorepo con dos aplicaciones principales: frontend en React (Vite) y backend en Next.js con rutas API.
- Backend desacoplado que expone endpoints REST y maneja autenticacion, validacion, notificaciones y persistencia en MySQL.
- Frontend SPA con manejo de estado local y server state, consumo de API por HTTP y cifrado E2EE en el navegador.
- Base de datos relacional MySQL con Prisma como ORM y migraciones versionadas.
- Servicios de soporte: cron jobs para notificaciones y envio de emails.

## Funcionamiento

- El usuario se autentica con JWT; el refresh token vive en cookie httpOnly.
- Vault: las credenciales se cifran en el navegador (AES-256-GCM) y el servidor nunca ve texto plano.
- Flow: tickets con estados, prioridades, asignaciones y etiquetas; vista Kanban con drag & drop y audit log.
- Context: notas en Markdown con editor en vivo y recordatorios con alertas visuales y emails.
- El backend valida datos con Zod, ejecuta la logica de negocio y persiste via Prisma en MySQL.

## Tecnologias

### Frontend
- React 19 + TypeScript
- Vite 6
- Bun
- React Router DOM v7
- TanStack Query v5
- Zustand v5
- Tailwind CSS v4
- Axios
- Web Crypto API
- @uiw/react-md-editor
- date-fns
- lucide-react

### Backend
- Next.js 15 (API routes)
- TypeScript
- Prisma v6
- MySQL 8
- JWT + httpOnly Cookie
- bcryptjs
- Zod
- Nodemailer
- node-cron
